import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET') || '';

interface SpotifyRefreshResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  // Try PKCE style first
  console.log('🔄 Attempting PKCE-style token refresh...');
  let tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: SPOTIFY_CLIENT_ID,
    }),
  });

  if (!tokenResponse.ok) {
    console.log('⚠️ PKCE-style refresh failed, trying Basic Auth fallback...');
    tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
  }

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`REAUTH_REQUIRED:${errorText}`);
  }

  const tokenData: SpotifyRefreshResponse = await tokenResponse.json();
  return tokenData.access_token;
}

async function fetchSpotifyApi(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('spotify_refresh_token, spotify_connected')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile?.spotify_connected || !profile?.spotify_refresh_token) {
      return new Response(
        JSON.stringify({ error: 'User not connected to Spotify or missing refresh token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let accessToken: string;
    try {
      accessToken = await refreshAccessToken(profile.spotify_refresh_token);
    } catch (err) {
      const msg = err.message || '';
      if (msg.startsWith('REAUTH_REQUIRED')) {
        return new Response(
          JSON.stringify({ error: 'Failed to refresh token', error_code: 'REAUTH_REQUIRED', needs_reauth: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw err;
    }

    console.log('✅ Token refresh successful, starting sync for user:', user_id);

    const syncResult = {
      success: { playlists: 0, tracks: 0, topTracks: 0, topArtists: 0, recentlyPlayed: 0, profileUpdated: false },
      errors: {} as Record<string, string>,
    };

    // === 1. Sync Spotify Profile Data (avatar, country, followers) ===
    console.log('👤 Syncing Spotify profile data...');
    const meData = await fetchSpotifyApi('https://api.spotify.com/v1/me', accessToken);
    if (meData) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          spotify_avatar_url: meData.images?.[0]?.url || meData.images?.[1]?.url || null,
          spotify_country: meData.country || null,
          spotify_followers: meData.followers?.total || 0,
          spotify_display_name: meData.display_name || null,
          spotify_last_sync: new Date().toISOString(),
        })
        .eq('user_id', user_id);

      if (profileUpdateError) {
        console.error('❌ Profile update error:', profileUpdateError);
        syncResult.errors.profile = profileUpdateError.message;
      } else {
        syncResult.success.profileUpdated = true;
        console.log('✅ Profile data updated');
      }
    }

    // === 2. Sync Playlists ===
    console.log('📋 Syncing playlists...');
    const playlistsData = await fetchSpotifyApi('https://api.spotify.com/v1/me/playlists?limit=50', accessToken);
    if (playlistsData) {
      const playlists = (playlistsData.items || []).map((playlist: any) => ({
        user_id,
        spotify_playlist_id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        track_count: playlist.tracks.total,
        is_public: playlist.public,
        image_url: playlist.images?.[0]?.url,
        spotify_url: playlist.external_urls?.spotify,
        owner_id: playlist.owner.id,
        snapshot_id: playlist.snapshot_id,
        last_synced_at: new Date().toISOString(),
      }));

      if (playlists.length > 0) {
        const { error } = await supabase.from('spotify_playlists').upsert(playlists, { ignoreDuplicates: false });
        if (error) { syncResult.errors.playlists = error.message; } 
        else { syncResult.success.playlists = playlists.length; }
      }
    }

    // === 3. Sync Saved Tracks ===
    console.log('🎵 Syncing saved tracks...');
    let savedTracksUrl: string | null = 'https://api.spotify.com/v1/me/tracks?limit=50';
    const allSavedTracks: any[] = [];
    
    while (savedTracksUrl && allSavedTracks.length < 1000) {
      const tracksData = await fetchSpotifyApi(savedTracksUrl, accessToken);
      if (!tracksData) break;
      allSavedTracks.push(...tracksData.items);
      savedTracksUrl = tracksData.next;
    }

    if (allSavedTracks.length > 0) {
      try {
        for (let i = 0; i < allSavedTracks.length; i += 20) {
          const batch = allSavedTracks.slice(i, i + 20);
          const trackUpserts = batch.map((item: any) => ({
            user_id,
            spotify_track_id: item.track.id,
            artist: item.track.artists.map((a: any) => a.name).join(', '),
            title: item.track.name,
            album: item.track.album.name,
            year: item.track.album.release_date ? new Date(item.track.album.release_date).getFullYear() : null,
            popularity: item.track.popularity,
            duration_ms: item.track.duration_ms,
            explicit: item.track.explicit,
            preview_url: item.track.preview_url,
            spotify_url: item.track.external_urls?.spotify,
            image_url: item.track.album.images?.[0]?.url,
            added_at: item.added_at,
          }));

          const { error } = await supabase.from('spotify_tracks').upsert(trackUpserts, { ignoreDuplicates: false });
          if (error) { syncResult.errors.tracks = error.message; break; }
        }
        if (!syncResult.errors.tracks) syncResult.success.tracks = allSavedTracks.length;
      } catch (error) {
        syncResult.errors.tracks = error.message;
      }
    }

    // === 4. Sync Top Tracks & Artists ===
    console.log('🔥 Syncing top tracks and artists...');
    const timeRanges = ['short_term', 'medium_term', 'long_term'];
    
    for (const timeRange of timeRanges) {
      // Top tracks
      const topTracksData = await fetchSpotifyApi(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, accessToken
      );
      if (topTracksData) {
        await supabase.from('spotify_user_stats').delete()
          .eq('user_id', user_id).eq('stat_type', 'top_tracks').eq('time_range', timeRange);

        const topTrackStats = topTracksData.items.map((track: any, index: number) => ({
          user_id, stat_type: 'top_tracks', time_range: timeRange,
          spotify_id: track.id, name: track.name,
          data: {
            artist: track.artists.map((a: any) => a.name).join(', '),
            album: track.album.name,
            image_url: track.album.images?.[0]?.url,
            spotify_url: track.external_urls?.spotify,
            popularity: track.popularity,
            duration_ms: track.duration_ms,
          },
          rank_position: index + 1,
        }));
        await supabase.from('spotify_user_stats').insert(topTrackStats);
        syncResult.success.topTracks += topTrackStats.length;
      }

      // Top artists
      const topArtistsData = await fetchSpotifyApi(
        `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`, accessToken
      );
      if (topArtistsData) {
        await supabase.from('spotify_user_stats').delete()
          .eq('user_id', user_id).eq('stat_type', 'top_artists').eq('time_range', timeRange);

        const topArtistStats = topArtistsData.items.map((artist: any, index: number) => ({
          user_id, stat_type: 'top_artists', time_range: timeRange,
          spotify_id: artist.id, name: artist.name,
          data: {
            genres: artist.genres,
            image_url: artist.images?.[0]?.url,
            spotify_url: artist.external_urls?.spotify,
            popularity: artist.popularity,
            followers: artist.followers?.total,
          },
          rank_position: index + 1,
        }));
        await supabase.from('spotify_user_stats').insert(topArtistStats);
        syncResult.success.topArtists += topArtistStats.length;
      }
    }

    // === 5. Sync Recently Played ===
    console.log('🕐 Syncing recently played...');
    const recentData = await fetchSpotifyApi(
      'https://api.spotify.com/v1/me/player/recently-played?limit=50', accessToken
    );
    if (recentData?.items) {
      const recentTracks = recentData.items.map((item: any) => ({
        user_id,
        spotify_track_id: item.track.id,
        artist: item.track.artists.map((a: any) => a.name).join(', '),
        title: item.track.name,
        album: item.track.album?.name,
        image_url: item.track.album?.images?.[0]?.url,
        spotify_url: item.track.external_urls?.spotify,
        duration_ms: item.track.duration_ms,
        played_at: item.played_at,
      }));

      if (recentTracks.length > 0) {
        const { error } = await supabase.from('spotify_recently_played')
          .upsert(recentTracks, { onConflict: 'user_id,spotify_track_id,played_at', ignoreDuplicates: true });
        if (error) { syncResult.errors.recentlyPlayed = error.message; }
        else { syncResult.success.recentlyPlayed = recentTracks.length; }
      }
    }

    // === 6. Fetch Audio Features for top tracks (medium_term) ===
    console.log('🎛️ Fetching audio features...');
    const { data: topTrackIds } = await supabase
      .from('spotify_user_stats')
      .select('spotify_id')
      .eq('user_id', user_id)
      .eq('stat_type', 'top_tracks')
      .eq('time_range', 'medium_term')
      .limit(50);

    if (topTrackIds && topTrackIds.length > 0) {
      const ids = topTrackIds.map((t: any) => t.spotify_id).join(',');
      const audioData = await fetchSpotifyApi(
        `https://api.spotify.com/v1/audio-features?ids=${ids}`, accessToken
      );
      if (audioData?.audio_features) {
        // Store aggregated audio features in profile metadata
        const features = audioData.audio_features.filter((f: any) => f);
        if (features.length > 0) {
          const avg = (key: string) => features.reduce((sum: number, f: any) => sum + (f[key] || 0), 0) / features.length;
          const audioProfile = {
            danceability: Math.round(avg('danceability') * 100),
            energy: Math.round(avg('energy') * 100),
            valence: Math.round(avg('valence') * 100),
            acousticness: Math.round(avg('acousticness') * 100),
            instrumentalness: Math.round(avg('instrumentalness') * 100),
            liveness: Math.round(avg('liveness') * 100),
            speechiness: Math.round(avg('speechiness') * 100),
            tempo: Math.round(avg('tempo')),
            sample_size: features.length,
          };

          // Store in spotify_user_stats as a special entry
          await supabase.from('spotify_user_stats').upsert({
            user_id,
            stat_type: 'audio_features',
            time_range: 'medium_term',
            spotify_id: 'aggregated',
            name: 'Audio Features Profile',
            data: audioProfile,
            rank_position: 0,
          }, { onConflict: 'user_id,stat_type,time_range,spotify_id' });

          console.log('✅ Audio features saved:', audioProfile);
        }
      }
    }

    console.log('✅ Spotify sync completed for user:', user_id, syncResult);

    return new Response(
      JSON.stringify({ 
        message: 'Spotify data synced successfully',
        success: syncResult.success,
        errors: syncResult.errors,
        has_errors: Object.keys(syncResult.errors).length > 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in spotify-sync function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
