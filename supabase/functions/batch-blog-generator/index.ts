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
    const { action, batchSize = 3, delaySeconds = 45, mediaTypes = ['cd', 'vinyl', 'ai'], minConfidence = 0.7, dryRun = false } = await req.json();
    
    console.log('Batch blog generation request:', { action, batchSize, delaySeconds, mediaTypes, minConfidence, dryRun });

    if (action === 'start') {
      // Check for existing running batch
      const existingBatch = await getBatchStatus();
      if (existingBatch?.status === 'running') {
        return new Response(
          JSON.stringify({ 
            error: 'A batch is already running. Please wait for it to complete or stop it first.' 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const itemsToProcess = await getItemsToProcess(mediaTypes, minConfidence);
      
      if (itemsToProcess.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No items found to process' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use exactly what the user configured - no forced overrides
      const optimizedBatchSize = batchSize;
      const optimizedDelay = delaySeconds;

      if (dryRun) {
        return new Response(
          JSON.stringify({ 
            message: `Dry run completed. Found ${itemsToProcess.length} items to process`,
            batchSize: optimizedBatchSize,
            delaySeconds: optimizedDelay,
            items: itemsToProcess.slice(0, 10).map(item => ({ 
              id: item.id, 
              type: item.media_type, 
              artist: item.artist, 
              title: item.title,
              confidence: item.confidence_score 
            }))
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Start batch processing in background with EdgeRuntime.waitUntil for proper lifecycle
      EdgeRuntime.waitUntil(
        processBatches(itemsToProcess, optimizedBatchSize, optimizedDelay).catch(async (error) => {
          console.error('Batch processing failed:', error);
          try {
            await updateBatchStatus({ 
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: error.message
            });
          } catch (statusError) {
            console.error('Failed to update batch status after error:', statusError);
          }
        })
      );

      return new Response(
        JSON.stringify({ 
          message: `Started batch processing ${itemsToProcess.length} items`, 
          batchSize: optimizedBatchSize,
          delaySeconds: optimizedDelay
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'status') {
      const status = await getBatchStatus();
      return new Response(JSON.stringify(status), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'stop') {
      await updateBatchStatus({ status: 'stopped', stopped_at: new Date().toISOString() });
      return new Response(JSON.stringify({ success: true, message: 'Batch processing stopped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
        items.push({ ...scan, media_type: 'cd' });
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
        items.push({ ...scan, media_type: 'vinyl' });
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
        items.push(scan);
      }
    }
  }

  // Sort by priority: CD, vinyl, then AI by confidence
  return items.sort((a, b) => {
    const priorityOrder = { cd: 1, vinyl: 2, ai: 3 };
    if (a.media_type !== b.media_type) {
      return priorityOrder[a.media_type] - priorityOrder[b.media_type];
    }
    if (a.media_type === 'ai' && b.media_type === 'ai') {
      return (b.confidence_score || 0) - (a.confidence_score || 0);
    }
    return 0;
  });
}

async function processBatches(items: any[], batchSize: number, delaySeconds: number) {
  console.log(`Processing ${items.length} items in batches of ${batchSize} with ${delaySeconds}s delay`);

  let status = await updateBatchStatus({
    status: 'running',
    total_items: items.length,
    processed_items: 0,
    successful_items: 0,
    failed_items: 0,
    started_at: new Date().toISOString(),
    current_batch: 0,
    failed_details: []
  });

  const startTime = Date.now();
  const maxProcessingTime = 4 * 60 * 60 * 1000; // 4 hours max processing time (increased for single-item batches)
  let processed = 0;
  let successful = 0;
  let failed = 0;
  const failedItems = [];

  for (let i = 0; i < items.length; i += batchSize) {
    // Check for timeout
    if (Date.now() - startTime > maxProcessingTime) {
      console.error('Batch processing timeout - stopping');
      try {
        await updateBatchStatus({ 
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Processing timeout after 4 hours'
        });
      } catch (statusError) {
        console.error('Failed to update timeout status:', statusError);
      }
      return { success: false, message: 'Batch processing timed out' };
    }

    // Check if batch should be stopped
    const currentStatus = await getBatchStatus();
    if (currentStatus?.status === 'stopped') {
      await updateBatchStatus({ 
        status: 'stopped',
        completed_at: new Date().toISOString()
      });
      return { success: true, message: 'Batch stopped by user' };
    }

    const batch = items.slice(i, i + batchSize);
    const currentBatch = Math.floor(i / batchSize) + 1;
    console.log(`Processing batch ${currentBatch}/${Math.ceil(items.length/batchSize)}:`, batch.map(item => item.id));

    // Update heartbeat with error handling
    try {
      await updateBatchStatus({ 
        current_batch: currentBatch,
        current_items: batch.map(item => `${item.artist} - ${item.title}`),
        updated_at: new Date().toISOString()
      });
    } catch (statusError) {
      console.error('Failed to update batch heartbeat:', statusError);
      // Continue processing despite status update failure
    }

    // Process batch items with retry logic
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        let attempts = 0;
        const maxAttempts = 2;
        
        while (attempts < maxAttempts) {
          try {
            console.log(`Generating blog for ${item.media_type} item: ${item.id} (attempt ${attempts + 1})`);
            
            const { data, error } = await supabase.functions.invoke('plaat-verhaal-generator', {
              body: {
                albumId: item.id,
                albumType: item.media_type === 'ai' ? 'cd' : item.media_type,
                autoPublish: true,
                forceRegenerate: false
              }
            });

            if (error) throw error;

            console.log(`Successfully generated blog for item ${item.id}`);
            return { success: true, item };
          } catch (error) {
            attempts++;
            console.error(`Attempt ${attempts} failed for item ${item.id}:`, error);
            
            if (attempts >= maxAttempts) {
              return { success: false, item, error: error.message };
            }
            
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          }
        }
      })
    );

    // Update status with results
    const successCount = batchResults.filter(r => r.success).length;
    const failedResults = batchResults.filter(r => !r.success);
    
    processed += batch.length;
    successful += successCount;
    failed += failedResults.length;
    failedItems.push(...failedResults.map(r => ({ item: r.item, error: r.error })));
    
    try {
      await updateBatchStatus({
        processed_items: processed,
        successful_items: successful,
        failed_items: failed,
        failed_details: failedItems
      });
    } catch (statusError) {
      console.error('Failed to update batch progress:', statusError);
      // Continue processing despite status update failure
    }

    // Delay between batches (except for the last batch)
    if (i + batchSize < items.length) {
      console.log(`Waiting ${delaySeconds} seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    }
  }

  await updateBatchStatus({ 
    status: 'completed',
    completed_at: new Date().toISOString()
  });

  return { success: true, message: 'Batch processing completed' };
}

async function getBatchStatus() {
  const { data, error } = await supabase
    .from('batch_processing_status')
    .select('*')
    .eq('process_type', 'blog_generation')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || { status: 'idle' };
}

async function updateBatchStatus(updates: any) {
  const currentStatus = await getBatchStatus();
  
  if (currentStatus.id) {
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