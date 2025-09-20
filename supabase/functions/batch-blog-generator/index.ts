import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, batchSize = 1, delaySeconds = 30, mediaTypes = ['cd', 'vinyl', 'ai'], minConfidence = 0.7, dryRun = false } = await req.json();
    
    console.log('Batch blog generation request:', { action, batchSize, delaySeconds, mediaTypes, minConfidence, dryRun });

    if (action === 'start') {
      // Check if there's already an active batch
      const existingBatch = await getBatchStatus();
      if (existingBatch?.status === 'active') {
        return new Response(JSON.stringify({
          error: 'Batch is already active',
          status: existingBatch
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get items to process
      const items = await getItemsToProcess(mediaTypes, minConfidence);
      
      if (items.length === 0) {
        return new Response(JSON.stringify({
          message: 'No items found to process',
          itemsFound: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (dryRun) {
        return new Response(JSON.stringify({
          message: 'Dry run completed',
          itemsFound: items.length,
          items: items.slice(0, 10) // Show first 10 items
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Initialize batch processing status and queue
      const batchId = crypto.randomUUID();
      
      console.log(`🚀 Starting nieuwe batch with ${items.length} items, batch ID: ${batchId}`);
      
      await updateBatchStatus({
        id: batchId,
        status: 'active',
        total_items: items.length,
        processed_items: 0,
        successful_items: 0,
        failed_items: 0,
        started_at: new Date().toISOString(),
        current_item: null,
        failed_item_details: [],
        queue_size: items.length,
        last_heartbeat: new Date().toISOString(),
        auto_mode: true
      });

      console.log(`✅ Batch status initialized for batch ${batchId}`);

      // Populate the queue with detailed logging
      const queueItems = items.map((item, index) => ({
        batch_id: batchId,
        item_id: item.id,
        item_type: item.type,
        priority: item.type === 'cd' ? 3 : item.type === 'vinyl' ? 2 : 1, // CD priority > vinyl > AI
        status: 'pending',
        attempts: 0,
        max_attempts: 3
      }));

      console.log(`📝 Prepared ${queueItems.length} queue items for insertion`);

      // Insert queue items in batches to avoid timeout with error handling
      const BATCH_SIZE = 100;
      let totalInserted = 0;
      
      for (let i = 0; i < queueItems.length; i += BATCH_SIZE) {
        const batch = queueItems.slice(i, i + BATCH_SIZE);
        
        console.log(`🔄 Inserting batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(queueItems.length/BATCH_SIZE)} (${batch.length} items)`);
        
        const { data, error } = await supabase.from('batch_queue_items').insert(batch).select('id');
        
        if (error) {
          console.error(`❌ Error inserting queue batch ${Math.floor(i/BATCH_SIZE) + 1}:`, error);
          throw new Error(`Failed to insert queue items: ${error.message}`);
        }
        
        totalInserted += batch.length;
        console.log(`✅ Successfully inserted batch ${Math.floor(i/BATCH_SIZE) + 1}, total inserted: ${totalInserted}`);
      }

      // Verify queue population
      const { data: queueVerification, error: verifyError } = await supabase
        .from('batch_queue_items')
        .select('id, status')
        .eq('batch_id', batchId);

      if (verifyError) {
        console.error('❌ Error verifying queue:', verifyError);
      } else {
        console.log(`🔍 Queue verification: Found ${queueVerification?.length || 0} items in queue for batch ${batchId}`);
      }

      console.log(`🎉 Successfully started batch processing with ${totalInserted} items in queue`);
      
      return new Response(JSON.stringify({
        message: 'Batch processing started - will be processed by cron job',
        batchId,
        totalItems: items.length,
        note: 'Processing runs automatically every minute via cron job'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      const status = await getBatchStatus();
      return new Response(JSON.stringify(status), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'stop') {
      try {
        await updateBatchStatus({
          status: 'paused',
          updated_at: new Date().toISOString()
        });

        return new Response(JSON.stringify({
          message: 'Batch processing paused'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error pausing batch:', error);
        return new Response(JSON.stringify({
          error: 'Failed to pause batch processing'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'force_stop') {
      try {
        // Mark current batch as stopped and clear queue
        const currentBatch = await getBatchStatus();
        if (currentBatch) {
          await updateBatchStatus({
            status: 'stopped',
            completed_at: new Date().toISOString()
          });

          // Clear remaining queue items
          await supabase
            .from('batch_queue_items')
            .update({ status: 'skipped' })
            .eq('batch_id', currentBatch.id)
            .in('status', ['pending', 'processing']);
        }

        return new Response(JSON.stringify({
          message: 'Batch processing force stopped and queue cleared'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error force stopping batch:', error);
        return new Response(JSON.stringify({
          error: 'Failed to force stop batch processing'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Batch blog generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getItemsToProcess(mediaTypes: string[], minConfidence: number) {
  const items = [];

  // Get CD scans without blog posts
  if (mediaTypes.includes('cd')) {
    const { data: cdScans, error: cdError } = await supabase
      .from('cd_scan')
      .select('id, artist, title, discogs_id')
      .not('discogs_id', 'is', null)
      .not('artist', 'is', null)
      .not('title', 'is', null);

    if (cdError) throw cdError;

    // Filter out items that already have blog posts
    for (const scan of cdScans || []) {
      const { data: existingBlog } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('album_id', scan.id)
        .eq('album_type', 'cd')
        .single();

      if (!existingBlog) {
        items.push({ ...scan, type: 'cd' });
      }
    }
  }

  // Get vinyl scans without blog posts
  if (mediaTypes.includes('vinyl')) {
    const { data: vinylScans, error: vinylError } = await supabase
      .from('vinyl2_scan')
      .select('id, artist, title, discogs_id')
      .not('discogs_id', 'is', null)
      .not('artist', 'is', null)
      .not('title', 'is', null);

    if (vinylError) throw vinylError;

    for (const scan of vinylScans || []) {
      const { data: existingBlog } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('album_id', scan.id)
        .eq('album_type', 'vinyl')
        .single();

      if (!existingBlog) {
        items.push({ ...scan, type: 'vinyl' });
      }
    }
  }

  // Get AI scans without blog posts
  if (mediaTypes.includes('ai')) {
    const { data: aiScans, error: aiError } = await supabase
      .from('ai_scan_results')
      .select('id, artist, title, discogs_id, confidence_score, media_type')
      .not('discogs_id', 'is', null)
      .not('artist', 'is', null)
      .not('title', 'is', null)
      .gte('confidence_score', minConfidence);

    if (aiError) throw aiError;

    for (const scan of aiScans || []) {
      const { data: existingBlog } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('album_id', scan.id)
        .eq('album_type', scan.media_type === 'ai' ? 'cd' : scan.media_type)
        .single();

      if (!existingBlog) {
        items.push({ ...scan, type: scan.media_type || 'cd' });
      }
    }
  }

  // Sort by priority: CD, vinyl, then AI by confidence
  return items.sort((a, b) => {
    const priorityOrder = { cd: 1, vinyl: 2, ai: 3 };
    if (a.type !== b.type) {
      return priorityOrder[a.type] - priorityOrder[b.type];
    }
    if (a.type === 'ai' && b.type === 'ai') {
      return (b.confidence_score || 0) - (a.confidence_score || 0);
    }
    return 0;
  });
}

async function getBatchStatus() {
  try {
    const { data, error } = await supabase
      .from('batch_processing_status')
      .select('*')
      .eq('process_type', 'blog_generation')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching batch status:', error);
      return null;
    }

    // Add queue statistics using separate count queries for reliability
    if (data) {
      // Get all queue stats in parallel for efficiency
      const [pendingResult, processingResult, completedResult, failedResult] = await Promise.all([
        supabase.from('batch_queue_items').select('id', { count: 'exact' }).eq('batch_id', data.id).eq('status', 'pending'),
        supabase.from('batch_queue_items').select('id', { count: 'exact' }).eq('batch_id', data.id).eq('status', 'processing'),
        supabase.from('batch_queue_items').select('id', { count: 'exact' }).eq('batch_id', data.id).eq('status', 'completed'),
        supabase.from('batch_queue_items').select('id', { count: 'exact' }).eq('batch_id', data.id).eq('status', 'failed')
      ]);

      data.queue_pending = pendingResult.count || 0;
      data.queue_processing = processingResult.count || 0;
      data.queue_completed = completedResult.count || 0;
      data.queue_failed = failedResult.count || 0;
      
      // Update queue_size to match actual totals
      const totalQueueItems = data.queue_pending + data.queue_processing + data.queue_completed + data.queue_failed;
      if (totalQueueItems !== data.queue_size) {
        data.queue_size = totalQueueItems;
        // Optionally sync this back to database
        await supabase
          .from('batch_processing_status')
          .update({ queue_size: totalQueueItems })
          .eq('id', data.id);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Failed to get batch status:', error);
    return null;
  }
}

async function updateBatchStatus(updates: any) {
  const currentStatus = await getBatchStatus();
  
  if (currentStatus && currentStatus.id) {
    await supabase
      .from('batch_processing_status')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', currentStatus.id);
  } else {
    await supabase
      .from('batch_processing_status')
      .insert({
        process_type: 'blog_generation',
        ...updates,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }
}