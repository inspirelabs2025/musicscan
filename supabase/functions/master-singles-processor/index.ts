import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Master Singles Processor
 * 
 * This function moves pending singles from master_singles to singles_import_queue
 * for story generation. Runs on a cron schedule.
 * 
 * Flow: discover-artist-singles → master_singles → THIS FUNCTION → singles_import_queue → singles-batch-processor → music_stories
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[master-singles-processor] Starting...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse batch size from request (default 10)
    let batchSize = 10;
    try {
      const body = await req.json();
      if (body?.batchSize) {
        batchSize = Math.min(Math.max(1, body.batchSize), 50);
      }
    } catch {
      // Use default
    }

    // Get pending singles from master_singles that aren't in singles_import_queue yet
    const { data: pendingSingles, error: fetchError } = await supabase
      .from('master_singles')
      .select('*')
      .eq('status', 'pending')
      .not('artwork_large', 'is', null)
      .order('year', { ascending: false, nullsFirst: false })
      .limit(batchSize * 2); // Fetch more to account for duplicates

    if (fetchError) {
      throw new Error(`Failed to fetch master_singles: ${fetchError.message}`);
    }

    if (!pendingSingles || pendingSingles.length === 0) {
      console.log('[master-singles-processor] No pending singles to process');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending singles' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[master-singles-processor] Found ${pendingSingles.length} pending singles`);

    // Check which singles already exist in singles_import_queue or music_stories
    const artistSinglePairs = pendingSingles.map(s => `${s.artist_name?.toLowerCase()}|${s.title?.toLowerCase()}`);
    
    // Check singles_import_queue
    const { data: existingQueue } = await supabase
      .from('singles_import_queue')
      .select('artist, single_name');

    const existingQueueKeys = new Set<string>();
    for (const item of existingQueue || []) {
      if (item.artist && item.single_name) {
        existingQueueKeys.add(`${item.artist.toLowerCase()}|${item.single_name.toLowerCase()}`);
      }
    }

    // Check music_stories for existing singles
    const { data: existingStories } = await supabase
      .from('music_stories')
      .select('artist_name, single_name')
      .not('single_name', 'is', null);

    for (const story of existingStories || []) {
      if (story.artist_name && story.single_name) {
        existingQueueKeys.add(`${story.artist_name.toLowerCase()}|${story.single_name.toLowerCase()}`);
      }
    }

    // Filter out duplicates
    const singlesToProcess = pendingSingles
      .filter(single => {
        const key = `${single.artist_name?.toLowerCase()}|${single.title?.toLowerCase()}`;
        return !existingQueueKeys.has(key);
      })
      .slice(0, batchSize);

    if (singlesToProcess.length === 0) {
      // Mark all as skipped
      for (const single of pendingSingles.slice(0, batchSize)) {
        await supabase
          .from('master_singles')
          .update({ status: 'skipped', updated_at: new Date().toISOString() })
          .eq('id', single.id);
      }
      
      console.log('[master-singles-processor] All singles already in queue or stories');
      return new Response(
        JSON.stringify({ success: true, processed: 0, skipped: pendingSingles.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[master-singles-processor] Processing ${singlesToProcess.length} singles`);

    // Create a batch ID for this processor run
    const batchId = crypto.randomUUID();
    
    // Use the existing system user from singles_import_queue
    const systemUserId = '567d3376-a797-447c-86cb-4c2f1260e997';

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (const single of singlesToProcess) {
      try {
        // Insert into singles_import_queue
        const { error: insertError } = await supabase
          .from('singles_import_queue')
          .insert({
            user_id: systemUserId,
            batch_id: batchId,
            artist: single.artist_name,
            single_name: single.title,
            year: single.year,
            label: single.label,
            discogs_id: single.discogs_release_id,
            discogs_url: single.discogs_url,
            artwork_url: single.artwork_large || single.artwork_thumb,
            genre: single.genre,
            status: 'pending',
            priority: 50,
            attempts: 0,
            max_attempts: 3,
          });

        if (insertError) {
          if (insertError.code === '23505') {
            // Duplicate - mark as skipped
            await supabase
              .from('master_singles')
              .update({ status: 'skipped', updated_at: new Date().toISOString() })
              .eq('id', single.id);
            skipped++;
          } else {
            throw insertError;
          }
        } else {
          // Mark as queued in master_singles
          await supabase
            .from('master_singles')
            .update({ status: 'queued', updated_at: new Date().toISOString() })
            .eq('id', single.id);
          inserted++;
          console.log(`[master-singles-processor] Queued: ${single.artist_name} - ${single.title}`);
        }
      } catch (err) {
        console.error(`[master-singles-processor] Error processing ${single.title}:`, err);
        await supabase
          .from('master_singles')
          .update({ 
            status: 'failed', 
            error_message: err.message,
            updated_at: new Date().toISOString() 
          })
          .eq('id', single.id);
        failed++;
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`[master-singles-processor] Complete! Inserted: ${inserted}, Skipped: ${skipped}, Failed: ${failed}, Time: ${executionTime}ms`);

    // Log to cronjob_execution_log
    await supabase.from('cronjob_execution_log').insert({
      function_name: 'master-singles-processor',
      status: 'completed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      execution_time_ms: executionTime,
      items_processed: inserted + skipped,
      metadata: { inserted, skipped, failed },
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: inserted + skipped,
        inserted,
        skipped,
        failed,
        executionTimeMs: executionTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[master-singles-processor] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
