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

async function processAllPhotos(
  supabase: any,
  batchId: string,
  photoUrls: string[],
  metadata: any[]
) {
  console.log(`📸 Processing ${photoUrls.length} photos sequentially`);

  const results = [];
  let completedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < photoUrls.length; i++) {
    const photoUrl = photoUrls[i];
    const photoMetadata = metadata[i];

    console.log(`\n🎨 [${i + 1}/${photoUrls.length}] Processing: ${photoMetadata.title}`);

    try {
      // Get corresponding queue item
      const { data: queueItems } = await supabase
        .from('batch_queue_items')
        .select('id')
        .eq('batch_id', batchId)
        .eq('metadata->photo_url', photoUrl)
        .limit(1);

      const queueItemId = queueItems?.[0]?.id;

      if (queueItemId) {
        // Update status to processing
        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'processing',
            started_at: new Date().toISOString()
          })
          .eq('id', queueItemId);
      }

      // Call existing photo-batch-processor for this photo
      const { data: batchResult, error: batchError } = await supabase.functions.invoke(
        'photo-batch-processor',
        {
          body: {
            action: 'start',
            photoUrl,
            artist: photoMetadata.artist,
            title: photoMetadata.title,
            description: photoMetadata.description || ''
          }
        }
      );

      if (batchError) throw batchError;

      const photoBatchId = batchResult.batchId;
      console.log(`  ↳ Photo batch started: ${photoBatchId}`);

      // Poll until photo batch completes (max 5 minutes)
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      let attempts = 0;
      let photoBatchComplete = false;

      while (attempts < maxAttempts && !photoBatchComplete) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay

        const { data: statusResult } = await supabase.functions.invoke(
          'photo-batch-processor',
          {
            body: {
              action: 'status',
              batchId: photoBatchId
            }
          }
        );

        if (statusResult?.status === 'completed' || statusResult?.status === 'failed') {
          photoBatchComplete = true;
          
          if (statusResult.status === 'completed') {
            console.log(`  ✅ Photo ${i + 1} completed successfully`);
            completedCount++;

            // Update queue item with results
            if (queueItemId) {
              await supabase
                .from('batch_queue_items')
                .update({ 
                  status: 'completed',
                  processed_at: new Date().toISOString(),
                  results: statusResult.results
                })
                .eq('id', queueItemId);
            }

            results.push({
              photoUrl,
              metadata: photoMetadata,
              status: 'completed',
              results: statusResult.results
            });
          } else {
            throw new Error(statusResult.error || 'Photo batch processing failed');
          }
        }

        attempts++;
      }

      if (!photoBatchComplete) {
        throw new Error('Photo batch processing timeout');
      }

      // 5 second delay before next photo to avoid rate limits
      if (i < photoUrls.length - 1) {
        console.log(`  ⏳ Waiting 5 seconds before next photo...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

    } catch (error) {
      console.error(`  ❌ Photo ${i + 1} failed:`, error.message);
      failedCount++;

      // Update queue item as failed
      const { data: queueItems } = await supabase
        .from('batch_queue_items')
        .select('id')
        .eq('batch_id', batchId)
        .eq('metadata->photo_url', photoUrl)
        .limit(1);

      const queueItemId = queueItems?.[0]?.id;
      
      if (queueItemId) {
        await supabase
          .from('batch_queue_items')
          .update({ 
            status: 'failed',
            processed_at: new Date().toISOString(),
            error_message: error.message
          })
          .eq('id', queueItemId);
      }

      results.push({
        photoUrl,
        metadata: photoMetadata,
        status: 'failed',
        error: error.message
      });
    }
  }

  // Update final batch status
  const finalStatus = failedCount === photoUrls.length ? 'failed' : 
                     failedCount > 0 ? 'completed_with_errors' : 'completed';

  await supabase
    .from('batch_uploads')
    .update({ 
      status: finalStatus,
      processing_results: {
        totalPhotos: photoUrls.length,
        completedPhotos: completedCount,
        failedPhotos: failedCount,
        results
      },
      completed_at: new Date().toISOString()
    })
    .eq('id', batchId);

  console.log(`\n✅ Bulk batch processing complete!`);
  console.log(`   Total: ${photoUrls.length} | Completed: ${completedCount} | Failed: ${failedCount}`);
}
