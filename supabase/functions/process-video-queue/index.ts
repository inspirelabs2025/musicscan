import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🎬 Processing video queue...');

    // Get pending items from tiktok_video_queue
    const { data: pendingItems, error: fetchError } = await supabase
      .from('tiktok_video_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(2);

    if (fetchError) {
      console.error('Error fetching pending items:', fetchError);
      throw fetchError;
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('✅ No pending video items to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending items', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${pendingItems.length} pending video items`);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const item of pendingItems) {
      try {
        console.log(`🎥 Processing video for: ${item.artist} - ${item.title}`);

        // Update status to processing
        await supabase
          .from('tiktok_video_queue')
          .update({
            status: 'processing',
            attempts: item.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Call image-to-video function
        const { data: videoResult, error: videoError } = await supabase.functions.invoke('image-to-video', {
          body: {
            images: [item.album_cover_url],
            fps: 1,
            style: 'blurred-background',
            duration_per_image: 5,
            queueItemId: item.id
          }
        });

        if (videoError) {
          throw videoError;
        }

        if (videoResult?.error) {
          throw new Error(videoResult.error);
        }

        if (videoResult?.video_url) {
          // Success - update with video URL
          await supabase
            .from('tiktok_video_queue')
            .update({
              status: 'completed',
              video_url: videoResult.video_url,
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          // Update blog post if linked
          if (item.blog_id) {
            await supabase
              .from('blog_posts')
              .update({ tiktok_video_url: videoResult.video_url })
              .eq('id', item.blog_id);
          }

          successCount++;
          console.log(`✅ Video completed: ${item.artist} - ${item.title}`);
        } else if (videoResult?.status === 'processing') {
          // Still processing - will be picked up by next run
          console.log(`⏳ Video still processing: ${item.artist} - ${item.title}`);
        }

        processedCount++;

        // Rate limiting - wait 2 seconds between items
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (itemError) {
        console.error(`❌ Error processing item ${item.id}:`, itemError);

        // Update item as failed
        await supabase
          .from('tiktok_video_queue')
          .update({
            status: item.attempts >= 2 ? 'failed' : 'pending',
            error_message: itemError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        failedCount++;
      }
    }

    console.log(`📊 Queue processing complete: ${processedCount} processed, ${successCount} success, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        succeeded: successCount,
        failed: failedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-video-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
