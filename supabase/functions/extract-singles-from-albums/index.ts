import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Spotify API helper
async function getSpotifyToken(): Promise<string | null> {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.error('Missing Spotify credentials');
    return null;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return null;
  }
}

// Search for album on Spotify and get tracks
async function getAlbumTracks(token: string, artist: string, albumTitle: string): Promise<any[]> {
  try {
    // Search for album
    const searchQuery = encodeURIComponent(`album:${albumTitle} artist:${artist}`);
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${searchQuery}&type=album&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    const searchData = await searchResponse.json();
    const album = searchData.albums?.items?.[0];

    if (!album) {
      console.log(`Album not found: ${artist} - ${albumTitle}`);
      return [];
    }

    // Get album tracks
    const tracksResponse = await fetch(
      `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    const tracksData = await tracksResponse.json();
    
    // Also get track popularity (need to fetch full track details)
    const trackIds = tracksData.items?.map((t: any) => t.id).join(',');
    if (!trackIds) return [];

    const fullTracksResponse = await fetch(
      `https://api.spotify.com/v1/tracks?ids=${trackIds}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    const fullTracksData = await fullTracksResponse.json();
    
    return fullTracksData.tracks || [];
  } catch (error) {
    console.error(`Error fetching tracks for ${artist} - ${albumTitle}:`, error);
    return [];
  }
}

// Filter to get popular tracks (singles)
function filterPopularTracks(tracks: any[], minPopularity: number = 30): any[] {
  return tracks
    .filter(track => {
      // Filter by popularity
      if (track.popularity < minPopularity) return false;
      // Skip very short tracks (intros, interludes)
      if (track.duration_ms < 120000) return false; // < 2 minutes
      // Skip very long tracks (likely album fillers)
      if (track.duration_ms > 600000) return false; // > 10 minutes
      return true;
    })
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5); // Max 5 singles per album
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check current queue size
    const { count: queueSize } = await supabase
      .from('singles_import_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    console.log(`Current singles queue size: ${queueSize}`);

    // Only process if queue is low
    const minQueueSize = 10;
    if (queueSize && queueSize >= minQueueSize) {
      console.log(`Queue has ${queueSize} items, minimum is ${minQueueSize}. Skipping.`);
      return new Response(
        JSON.stringify({ success: true, message: `Queue already has ${queueSize} items`, extracted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Spotify token
    const spotifyToken = await getSpotifyToken();
    if (!spotifyToken) {
      throw new Error('Failed to get Spotify token');
    }

    // Get albums that haven't had singles extracted yet
    // We use a simple approach: process albums from blog_posts that don't have matching music_stories
    const { data: albums, error: albumsError } = await supabase
      .from('blog_posts')
      .select('id, yaml_frontmatter, album_cover_url')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(20); // Process 20 albums per run

    if (albumsError) {
      throw new Error(`Failed to fetch albums: ${albumsError.message}`);
    }

    console.log(`Found ${albums?.length || 0} albums to process`);

    let totalExtracted = 0;
    let processedAlbums = 0;
    const batchId = `extract-${Date.now()}`;

    for (const album of albums || []) {
      try {
        const frontmatter = album.yaml_frontmatter as any;
        const artist = frontmatter?.artist;
        const title = frontmatter?.title;
        const year = frontmatter?.year;

        if (!artist || !title) {
          console.log(`Skipping album without artist/title: ${album.id}`);
          continue;
        }

        // Get tracks from Spotify
        const tracks = await getAlbumTracks(spotifyToken, artist, title);
        if (tracks.length === 0) {
          console.log(`No tracks found for: ${artist} - ${title}`);
          continue;
        }

        // Filter to popular tracks
        const popularTracks = filterPopularTracks(tracks);
        console.log(`Found ${popularTracks.length} popular tracks for: ${artist} - ${title}`);

        for (const track of popularTracks) {
          // Check if single already exists in music_stories
          const { count: existingCount } = await supabase
            .from('music_stories')
            .select('*', { count: 'exact', head: true })
            .eq('artist_name', artist)
            .ilike('single_name', track.name);

          if (existingCount && existingCount > 0) {
            console.log(`Single already exists: ${artist} - ${track.name}`);
            continue;
          }

          // Check if already in queue
          const { count: queueCount } = await supabase
            .from('singles_import_queue')
            .select('*', { count: 'exact', head: true })
            .eq('artist', artist)
            .ilike('single_name', track.name);

          if (queueCount && queueCount > 0) {
            console.log(`Single already in queue: ${artist} - ${track.name}`);
            continue;
          }

          // Add to singles queue
          const { error: insertError } = await supabase
            .from('singles_import_queue')
            .insert({
              artist: artist,
              single_name: track.name,
              album: title,
              year: year || new Date().getFullYear(),
              status: 'pending',
              batch_id: batchId,
              metadata: {
                spotify_track_id: track.id,
                spotify_popularity: track.popularity,
                duration_ms: track.duration_ms,
                extracted_from_album: album.id,
                album_cover_url: album.album_cover_url,
              }
            });

          if (insertError) {
            console.error(`Failed to insert single ${track.name}:`, insertError);
            continue;
          }

          console.log(`Added single to queue: ${artist} - ${track.name} (popularity: ${track.popularity})`);
          totalExtracted++;
        }

        processedAlbums++;

        // Rate limit: wait between albums
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (albumError) {
        console.error(`Error processing album:`, albumError);
        continue;
      }
    }

    console.log(`Extraction complete: ${totalExtracted} singles from ${processedAlbums} albums`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Extracted ${totalExtracted} singles from ${processedAlbums} albums`,
        extracted: totalExtracted,
        processed_albums: processedAlbums,
        batch_id: batchId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-singles-from-albums:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
