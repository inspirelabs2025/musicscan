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
      // Get items that need blog posts
      const itemsToProcess = await getItemsToProcess(mediaTypes, minConfidence);
      
      if (dryRun) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Dry run completed',
          itemsFound: itemsToProcess.length,
          items: itemsToProcess.slice(0, 10), // Show first 10 as preview
          estimatedTime: Math.ceil(itemsToProcess.length / batchSize) * delaySeconds,
          estimatedCost: itemsToProcess.length * 0.15 // Rough estimate per item
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Start batch processing in background
      processBatches(itemsToProcess, batchSize, delaySeconds).catch(error => {
        console.error('Background batch processing failed:', error);
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Batch processing started',
        totalItems: itemsToProcess.length,
        estimatedTime: Math.ceil(itemsToProcess.length / batchSize) * delaySeconds
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      .not('title', 'is', null')
      .gte('confidence_score', minConfidence);

    if (aiError) throw aiError;

    for (const scan of aiScans || []) {
      const { data: existingBlog } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('album_id', scan.id)
        .eq('album_type', scan.media_type)
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
  console.log(`Starting batch processing: ${items.length} items, batch size ${batchSize}`);
  
  // Initialize batch status
  await updateBatchStatus({
    status: 'running',
    total_items: items.length,
    processed_items: 0,
    successful_items: 0,
    failed_items: 0,
    started_at: new Date().toISOString(),
    current_batch: 0
  });

  let processed = 0;
  let successful = 0;
  let failed = 0;
  const failedItems = [];

  for (let i = 0; i < items.length; i += batchSize) {
    // Check if processing should stop
    const status = await getBatchStatus();
    if (status.status === 'stopped') {
      console.log('Batch processing stopped by user');
      break;
    }

    const batch = items.slice(i, i + batchSize);
    const currentBatch = Math.floor(i / batchSize) + 1;
    
    console.log(`Processing batch ${currentBatch}: ${batch.length} items`);
    
    // Update status
    await updateBatchStatus({
      current_batch: currentBatch,
      current_items: batch.map(item => `${item.artist} - ${item.title}`)
    });

    // Process batch in parallel
    const batchPromises = batch.map(async (item) => {
      try {
        console.log(`Generating blog for: ${item.artist} - ${item.title} (${item.media_type})`);
        
        const { data, error } = await supabase.functions.invoke('plaat-verhaal-generator', {
          body: {
            albumId: item.id,
            albumType: item.media_type === 'ai' ? item.media_type : item.media_type,
            forceRegenerate: false,
            autoPublish: true
          }
        });

        if (error) {
          console.error(`Failed to generate blog for ${item.id}:`, error);
          failedItems.push({ item, error: error.message });
          return false;
        }

        console.log(`Successfully generated blog for: ${item.artist} - ${item.title}`);
        return true;
      } catch (error) {
        console.error(`Error processing ${item.id}:`, error);
        failedItems.push({ item, error: error.message });
        return false;
      }
    });

    const results = await Promise.all(batchPromises);
    
    processed += batch.length;
    successful += results.filter(r => r === true).length;
    failed += results.filter(r => r === false).length;

    // Update progress
    await updateBatchStatus({
      processed_items: processed,
      successful_items: successful,
      failed_items: failed,
      failed_details: failedItems
    });

    console.log(`Batch ${currentBatch} complete. Progress: ${processed}/${items.length} (${successful} successful, ${failed} failed)`);

    // Delay before next batch (except for last batch)
    if (i + batchSize < items.length) {
      console.log(`Waiting ${delaySeconds} seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    }
  }

  // Mark as completed
  await updateBatchStatus({
    status: 'completed',
    completed_at: new Date().toISOString()
  });

  console.log(`Batch processing completed: ${successful}/${items.length} successful`);
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