import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[album-queue-processor] Starting album queue processing...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse optional batch size from request
    let batchSize = 1; // Process 1 album per run to stay within rate limits
    try {
      const body = await req.json();
      if (body?.batchSize) {
        batchSize = Math.min(Math.max(1, body.batchSize), 5);
      }
    } catch {
      // No body, use default
    }

    // Get pending albums with artwork that haven't been processed
    const { data: albums, error: fetchError } = await supabase
      .from('master_albums')
      .select('id, artist_name, title, year, artwork_thumb, artwork_large, discogs_master_id, discogs_url')
      .eq('status', 'pending')
      .not('artwork_large', 'is', null)
      .order('discovered_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch albums: ${fetchError.message}`);
    }

    if (!albums || albums.length === 0) {
      console.log('[album-queue-processor] No pending albums to process');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending albums to process',
          processed: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[album-queue-processor] Processing ${albums.length} album(s)...`);

    const results: Array<{
      albumTitle: string;
      artist: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const album of albums) {
      console.log(`[album-queue-processor] Processing: ${album.artist_name} - ${album.title}`);
      
      // Mark as processing
      await supabase
        .from('master_albums')
        .update({
          status: 'processing',
          attempts: album.attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', album.id);

      try {
        // Add to photo_batch_queue for product generation
        const { data: queueData, error: queueError } = await supabase
          .from('photo_batch_queue')
          .insert({
            image_url: album.artwork_large || album.artwork_thumb,
            artist: album.artist_name,
            title: album.title,
            year: album.year,
            discogs_id: album.discogs_master_id,
            status: 'pending',
            source: 'master_albums',
            source_id: album.id,
            metadata: {
              discogs_url: album.discogs_url,
              master_album_id: album.id,
            },
          })
          .select()
          .single();

        if (queueError) {
          // Check if it's a duplicate
          if (queueError.code === '23505') {
            console.log(`[album-queue-processor] Album already in queue: ${album.title}`);
            await supabase
              .from('master_albums')
              .update({
                status: 'queued',
                updated_at: new Date().toISOString(),
              })
              .eq('id', album.id);
            
            results.push({
              albumTitle: album.title,
              artist: album.artist_name,
              success: true,
            });
          } else {
            throw new Error(queueError.message);
          }
        } else {
          console.log(`[album-queue-processor] Added to queue: ${album.title} (queue ID: ${queueData.id})`);
          
          // Update master_album status
          await supabase
            .from('master_albums')
            .update({
              status: 'queued',
              updated_at: new Date().toISOString(),
            })
            .eq('id', album.id);

          results.push({
            albumTitle: album.title,
            artist: album.artist_name,
            success: true,
          });
        }
      } catch (processError) {
        console.error(`[album-queue-processor] Error processing ${album.title}:`, processError);
        
        // Mark as failed
        await supabase
          .from('master_albums')
          .update({
            status: album.attempts >= 3 ? 'failed' : 'pending',
            error_message: processError.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', album.id);

        results.push({
          albumTitle: album.title,
          artist: album.artist_name,
          success: false,
          error: processError.message,
        });
      }

      // Small delay between albums
      if (albums.indexOf(album) < albums.length - 1) {
        await delay(1000);
      }
    }

    const executionTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(`[album-queue-processor] Complete! ${successCount}/${results.length} successful, took ${executionTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: successCount,
        executionTimeMs: executionTime,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[album-queue-processor] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
