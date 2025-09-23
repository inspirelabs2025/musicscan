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

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get user's Spotify refresh token
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

    // Refresh access token - try PKCE style first, then Basic Auth fallback
    console.log('🔄 Attempting PKCE-style token refresh...');
    let tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: profile.spotify_refresh_token,
        client_id: SPOTIFY_CLIENT_ID,
      }),
    });

    // If PKCE style fails, try Basic Auth fallback
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
          refresh_token: profile.spotify_refresh_token,
        }),
      });
    }

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Failed to refresh Spotify token (both methods):', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorText,
      });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to refresh token', 
          error_code: 'REAUTH_REQUIRED',
          details: 'Both PKCE and Basic Auth refresh methods failed',
          spotify_error: errorText,
          needs_reauth: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData: SpotifyRefreshResponse = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('✅ Token refresh successful, starting Spotify data sync for user:', user_id);

    let syncResult = {
      success: {
        playlists: 0,
        tracks: 0,
        topTracks: 0,
        topArtists: 0,
      },
      errors: {} as Record<string, string>,
    };

    // Sync user's playlists
    console.log('📋 Syncing playlists...');
    const playlistsResponse = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (playlistsResponse.ok) {
      const playlistsData = await playlistsResponse.json();
      console.log(`📋 Found ${playlistsData.items?.length || 0} playlists`);
      
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

      // Upsert playlists with error handling
      if (playlists.length > 0) {
        console.log(`📋 Upserting ${playlists.length} playlists...`);
        const { error: playlistError } = await supabase
          .from('spotify_playlists')
          .upsert(playlists, { ignoreDuplicates: false });
        
        if (playlistError) {
          console.error('❌ Playlist upsert error:', playlistError);
          syncResult.errors.playlists = playlistError.message;
        } else {
          syncResult.success.playlists = playlists.length;
          console.log(`✅ Successfully upserted ${playlists.length} playlists`);
        }
      }
    } else {
      console.error('❌ Failed to fetch playlists:', playlistsResponse.status);
      syncResult.errors.playlists = `Failed to fetch playlists: ${playlistsResponse.status}`;
    }

    console.log(`✅ Playlists sync completed: ${syncResult.success.playlists} synced, ${syncResult.errors.playlists ? 'with errors' : 'no errors'}`);

    // Sync user's saved tracks (Library)
    console.log('🎵 Syncing saved tracks...');
    let savedTracksUrl = 'https://api.spotify.com/v1/me/tracks?limit=50';
    let allSavedTracks = [];
    
    while (savedTracksUrl && allSavedTracks.length < 1000) { // Limit to prevent timeouts
      const tracksResponse = await fetch(savedTracksUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!tracksResponse.ok) break;

      const tracksData = await tracksResponse.json();
      allSavedTracks.push(...tracksData.items);
      savedTracksUrl = tracksData.next;
    }

    console.log(`🎵 Found ${allSavedTracks.length} saved tracks`);

    // Process saved tracks in batches with error handling
    if (allSavedTracks.length > 0) {
      try {
        for (let i = 0; i < allSavedTracks.length; i += 20) {
          const batch = allSavedTracks.slice(i, i + 20);
          const trackUpserts = batch.map(item => ({
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

          const { error: tracksError } = await supabase
            .from('spotify_tracks')
            .upsert(trackUpserts, { ignoreDuplicates: false });
          
          if (tracksError) {
            console.error(`❌ Tracks batch ${i}-${i + batch.length} upsert error:`, tracksError);
            syncResult.errors.tracks = tracksError.message;
            break;
          }
        }
        
        if (!syncResult.errors.tracks) {
          syncResult.success.tracks = allSavedTracks.length;
          console.log(`✅ Successfully synced ${allSavedTracks.length} saved tracks`);
        }
      } catch (error) {
        console.error('❌ Tracks sync error:', error);
        syncResult.errors.tracks = error.message;
      }
    }

    // Sync top tracks and artists
    console.log('🔥 Syncing top tracks and artists...');
    const timeRanges = ['short_term', 'medium_term', 'long_term'];
    
    for (const timeRange of timeRanges) {
      // Top tracks
      const topTracksResponse = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (topTracksResponse.ok) {
        const topTracksData = await topTracksResponse.json();
        
        // Clear existing stats for this time range
        await supabase
          .from('spotify_user_stats')
          .delete()
          .eq('user_id', user_id)
          .eq('stat_type', 'top_tracks')
          .eq('time_range', timeRange);

        // Insert new stats
        const topTrackStats = topTracksData.items.map((track: any, index: number) => ({
          user_id,
          stat_type: 'top_tracks',
          time_range: timeRange,
          spotify_id: track.id,
          name: track.name,
          data: {
            artist: track.artists.map((a: any) => a.name).join(', '),
            album: track.album.name,
            image_url: track.album.images?.[0]?.url,
            spotify_url: track.external_urls?.spotify,
            popularity: track.popularity,
          },
          rank_position: index + 1,
        }));

        await supabase
          .from('spotify_user_stats')
          .insert(topTrackStats);
        
        syncResult.success.topTracks += topTrackStats.length;
      }

      // Top artists
      const topArtistsResponse = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (topArtistsResponse.ok) {
        const topArtistsData = await topArtistsResponse.json();
        
        // Clear existing stats for this time range
        await supabase
          .from('spotify_user_stats')
          .delete()
          .eq('user_id', user_id)
          .eq('stat_type', 'top_artists')
          .eq('time_range', timeRange);

        // Insert new stats
        const topArtistStats = topArtistsData.items.map((artist: any, index: number) => ({
          user_id,
          stat_type: 'top_artists',
          time_range: timeRange,
          spotify_id: artist.id,
          name: artist.name,
          data: {
            genres: artist.genres,
            image_url: artist.images?.[0]?.url,
            spotify_url: artist.external_urls?.spotify,
            popularity: artist.popularity,
            followers: artist.followers?.total,
          },
          rank_position: index + 1,
        }));

        await supabase
          .from('spotify_user_stats')
          .insert(topArtistStats);
        
        syncResult.success.topArtists += topArtistStats.length;
      }
    }

    // Update last sync time
    await supabase
      .from('profiles')
      .update({ spotify_last_sync: new Date().toISOString() })
      .eq('user_id', user_id);

    console.log('✅ Spotify sync completed for user:', user_id, syncResult);

    return new Response(
      JSON.stringify({ 
        message: 'Spotify data synced successfully',
        success: syncResult,
        errors: syncResult.errors,
        has_errors: Object.keys(syncResult.errors).length > 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in spotify-sync function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});