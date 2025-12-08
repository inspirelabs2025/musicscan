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

    console.log('🎬 Processing TikTok video queue (server-side MP4)...');

    // Get pending items
    const { data: pendingItems, error: fetchError } = await supabase
      .from('tiktok_video_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(1); // Process 1 at a time for server-side video generation

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
        console.log(`🎥 Processing: ${item.artist} - ${item.title}`);

        // Update status to processing
        await supabase
          .from('tiktok_video_queue')
          .update({
            status: 'processing',
            attempts: item.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (!item.album_cover_url) {
          throw new Error('No album cover URL available');
        }

        // Call the generate-mp4-video edge function
        console.log(`📹 Calling generate-mp4-video for ${item.id}...`);
        
        const { data: videoResult, error: videoError } = await supabase.functions.invoke('generate-mp4-video', {
          body: {
            imageUrl: item.album_cover_url,
            queueItemId: item.id,
            durationSeconds: 10,
            fps: 5
          }
        });

        if (videoError) {
          throw new Error(`Video generation failed: ${videoError.message}`);
        }

        if (!videoResult?.success) {
          throw new Error(videoResult?.error || 'Video generation returned no success');
        }

        const videoUrl = videoResult.video_url;
        console.log(`✅ MP4 video generated: ${videoUrl} (${videoResult.size_bytes} bytes)`);

        // Update blog post if linked
        if (item.blog_id) {
          await supabase
            .from('blog_posts')
            .update({ tiktok_video_url: videoUrl })
            .eq('id', item.blog_id);
          console.log(`✅ Updated blog post ${item.blog_id} with video URL`);
        }

        successCount++;
        console.log(`✅ Completed: ${item.artist} - ${item.title}`);

      } catch (itemError) {
        console.error(`❌ Error processing item ${item.id}:`, itemError);

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

      processedCount++;
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
    console.error('Error in process-tiktok-video-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
