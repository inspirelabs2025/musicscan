import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchId, photoUrls, metadata } = await req.json();

    console.log(`🚀 Starting bulk batch processing for ${photoUrls.length} photos`);
    console.log('ℹ️ bulk-photo-batch-processor version: v2025-11-12-1');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update batch status to processing
    await supabase
      .from('batch_uploads')
      .update({ status: 'processing' })
      .eq('id', batchId);

    // Start background processing
    EdgeRuntime.waitUntil(
      processAllPhotos(supabase, batchId, photoUrls, metadata)
    );

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processing ${photoUrls.length} photos in background`,
        batchId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Bulk batch processor error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Retry logic for network errors
async function invokeWithRetry(
  supabase: any,
  functionName: string,
  body: any,
  maxRetries: number = 3
) {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, { body });
      
      if (error) {
        // Check if error is retryable (network/timeout)
        if (error.message?.includes('timeout') || 
            error.message?.includes('network') ||
            error.message?.includes('ECONNREFUSED')) {
          console.log(`⚠️ Retryable error on attempt ${attempt}/${maxRetries}: ${error.message}`);
          lastError = error;
          
          // Exponential backoff: 5s, 10s, 20s
          const delay = 5000 * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          // Non-retryable error (e.g., invalid data)
          throw error;
        }
      }
      
      return { data, error: null };
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }
  
  throw lastError;
}

// Monitor batch completion in background
async function monitorBatchCompletion(
  supabase: any,
  batchId: string,
  totalPhotos: number
) {
  const maxChecks = 120; // 2 hours max (60s intervals)
  let checks = 0;

  while (checks < maxChecks) {
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute interval
    checks++;

    // Check how many photos are complete
    const { data: queueItems } = await supabase
      .from('batch_queue_items')
      .select('status')
      .eq('batch_id', batchId);

    if (!queueItems) continue;

    const completed = queueItems.filter(
      (item: any) => item.status === 'completed'
    ).length;
    const failed = queueItems.filter(
      (item: any) => item.status === 'failed'
    ).length;
    const processing = queueItems.filter(
      (item: any) => item.status === 'processing'
    ).length;

    console.log(`📊 Batch ${batchId} progress: ${completed}/${totalPhotos} completed, ${failed} failed, ${processing} processing`);

    // If all photos are done (completed or failed), update batch status
    if (completed + failed === totalPhotos) {
      const finalStatus = failed === totalPhotos ? 'failed' : 
                         failed > 0 ? 'completed_with_errors' : 'completed';

      await supabase
        .from('batch_uploads')
        .update({
          status: finalStatus,
          processing_results: {
            totalPhotos,
            completedPhotos: completed,
            failedPhotos: failed
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);

      console.log(`✅ Batch ${batchId} monitoring complete: ${finalStatus}`);
      break;
    }
  }
}

async function processAllPhotos(
  supabase: any,
  batchId: string,
  photoUrls: string[],
  metadata: any[]
) {
  console.log(`📸 Starting ${photoUrls.length} photo batches (background processing)`);

  for (let i = 0; i < photoUrls.length; i++) {
    const photoUrl = photoUrls[i];
    const photoMetadata = metadata[i];

    console.log(`\n🎨 [${i + 1}/${photoUrls.length}] Starting batch: ${photoMetadata.title}`);

    try {
      // Call existing photo-batch-processor with retry logic to start the batch
      const { data: batchResult, error: batchError } = await invokeWithRetry(
        supabase,
        'photo-batch-processor',
        {
          action: 'start',
          photoUrl,
          artist: photoMetadata.artist,
          title: photoMetadata.title,
          description: photoMetadata.description || ''
        }
      );

      if (batchError) throw batchError;

      const photoBatchId = batchResult.batchId;
      console.log(`  ↳ Photo batch started: ${photoBatchId}`);

      // Create queue item now that we have the photo batch ID
      await supabase
        .from('batch_queue_items')
        .insert({
          batch_id: batchId,
          item_id: photoBatchId,
          item_type: 'ai',
          status: 'processing'
        });

      // 5 second delay before next photo to avoid rate limits
      if (i < photoUrls.length - 1) {
        console.log(`  ⏳ Waiting 5 seconds before next photo...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

    } catch (error) {
      console.error(`  ❌ Photo ${i + 1} failed to start:`, error.message);

      // Insert failed queue item (no photo_batch_id available)
      await supabase
        .from('batch_queue_items')
        .insert({
          batch_id: batchId,
          item_id: `failed-${Date.now()}-${i}`, // Temp ID for failed items
          item_type: 'ai',
          status: 'failed',
          error_message: error.message,
          processed_at: new Date().toISOString()
        });
    }
  }

  // Update batch status to 'processing' after all batches started
  await supabase
    .from('batch_uploads')
    .update({ 
      status: 'processing',
      processing_results: {
        totalPhotos: photoUrls.length,
        startedPhotos: photoUrls.length,
        message: 'All photo batches started, processing in background...'
      },
      updated_at: new Date().toISOString()
    })
    .eq('id', batchId);

  console.log(`\n✅ Bulk batch started all ${photoUrls.length} photo batches!`);
  console.log(`   Photo batches are now processing independently in background.`);

  // Start background monitor for final status
  EdgeRuntime.waitUntil(monitorBatchCompletion(supabase, batchId, photoUrls.length));
}
