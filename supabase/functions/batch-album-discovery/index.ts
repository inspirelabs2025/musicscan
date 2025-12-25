import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Delay helper for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[batch-album-discovery] Starting batch album discovery...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional batch size from request
    let batchSize = 5;
    try {
      const body = await req.json();
      if (body?.batchSize) {
        batchSize = Math.min(Math.max(1, body.batchSize), 10); // 1-10 range
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Get artists that haven't been crawled yet (no albums_count or albums_count = 0)
    // Prioritize by priority field, then by created_at
    const { data: artists, error: fetchError } = await supabase
      .from('curated_artists')
      .select('id, artist_name, discogs_artist_id, albums_count, priority')
      .eq('is_active', true)
      .or('albums_count.is.null,albums_count.eq.0')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch artists: ${fetchError.message}`);
    }

    if (!artists || artists.length === 0) {
      console.log('[batch-album-discovery] No artists to process');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No artists to process',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[batch-album-discovery] Processing ${artists.length} artists...`);

    const results: Array<{
      artistName: string;
      success: boolean;
      albumsFound?: number;
      singlesFound?: number;
      error?: string;
    }> = [];

    for (const artist of artists) {
      console.log(`[batch-album-discovery] Processing: ${artist.artist_name}`);
      
      try {
        // Step 1: Discover albums
        const { data: albumData, error: albumError } = await supabase.functions.invoke('discover-artist-albums', {
          body: {
            artistId: artist.id,
            artistName: artist.artist_name,
            discogsArtistId: artist.discogs_artist_id,
          },
        });

        if (albumError) {
          console.error(`[batch-album-discovery] Album error for ${artist.artist_name}: ${albumError.message}`);
          results.push({
            artistName: artist.artist_name,
            success: false,
            error: albumError.message,
          });
        } else if (!albumData?.success) {
          console.error(`[batch-album-discovery] Album failed for ${artist.artist_name}: ${albumData?.error}`);
          results.push({
            artistName: artist.artist_name,
            success: false,
            error: albumData?.error || 'Unknown error',
          });
        } else {
          console.log(`[batch-album-discovery] Albums success for ${artist.artist_name}: ${albumData.mainAlbums} albums`);
          
          // Step 2: Discover singles (if we have discogs ID now)
          const discogsId = albumData.discogsArtistId || artist.discogs_artist_id;
          let singlesCount = 0;
          
          if (discogsId) {
            await delay(2000); // Brief delay before singles
            
            const { data: singlesData, error: singlesError } = await supabase.functions.invoke('discover-artist-singles', {
              body: {
                artistId: artist.id,
                artistName: artist.artist_name,
                discogsArtistId: discogsId,
              },
            });

            if (!singlesError && singlesData?.success) {
              singlesCount = singlesData.totalSingles || 0;
              console.log(`[batch-album-discovery] Singles success for ${artist.artist_name}: ${singlesCount} singles`);
            } else {
              console.error(`[batch-album-discovery] Singles error for ${artist.artist_name}:`, singlesError?.message || singlesData?.error);
            }
          }

          results.push({
            artistName: artist.artist_name,
            success: true,
            albumsFound: albumData.mainAlbums,
            singlesFound: singlesCount,
          });
        }
      } catch (invokeError) {
        console.error(`[batch-album-discovery] Invoke error for ${artist.artist_name}:`, invokeError);
        results.push({
          artistName: artist.artist_name,
          success: false,
          error: invokeError.message,
        });
      }

      // Rate limiting between artists (5 seconds)
      if (artists.indexOf(artist) < artists.length - 1) {
        console.log('[batch-album-discovery] Waiting 5 seconds before next artist...');
        await delay(5000);
      }
    }

    const executionTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalAlbums = results.reduce((sum, r) => sum + (r.albumsFound || 0), 0);
    const totalSingles = results.reduce((sum, r) => sum + (r.singlesFound || 0), 0);

    console.log(`[batch-album-discovery] Complete! ${successCount}/${results.length} successful, ${totalAlbums} albums, ${totalSingles} singles, took ${executionTime}ms`);

    // Log to cronjob_execution_log
    await supabase.from('cronjob_execution_log').insert({
      function_name: 'batch-album-discovery',
      status: 'completed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      execution_time_ms: executionTime,
      items_processed: artists.length,
      metadata: {
        successCount,
        totalAlbums,
        totalSingles,
        results,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: successCount,
        totalAlbumsDiscovered: totalAlbums,
        totalSinglesDiscovered: totalSingles,
        executionTimeMs: executionTime,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[batch-album-discovery] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
