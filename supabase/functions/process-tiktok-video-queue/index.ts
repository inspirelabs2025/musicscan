import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Replicate from 'https://esm.sh/replicate@0.25.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const replicateApiKey = Deno.env.get('REPLICATE_API_KEY');

    if (!replicateApiKey) {
      throw new Error('REPLICATE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const replicate = new Replicate({ auth: replicateApiKey });

    // 1. First, check for items that are processing and poll their status
    const { data: processingItems } = await supabase
      .from('tiktok_video_queue')
      .select('*')
      .eq('status', 'processing')
      .not('operation_name', 'is', null)
      .limit(5);

    let processedCount = 0;
    let completedCount = 0;

    if (processingItems && processingItems.length > 0) {
      console.log(`🔄 Found ${processingItems.length} items in processing state`);

      for (const item of processingItems) {
        try {
          // Poll Replicate prediction status
          const prediction = await replicate.predictions.get(item.operation_name);
          console.log(`📊 Prediction ${item.operation_name} status: ${prediction.status}`);

          if (prediction.status === 'succeeded') {
            // Get video URL from output
            const videoUri = prediction.output;
            console.log('✅ Video generated, downloading from:', videoUri);

            // Download the video
            const videoResponse = await fetch(videoUri);
            if (!videoResponse.ok) {
              throw new Error(`Failed to download video: ${videoResponse.status}`);
            }

            const videoBlob = await videoResponse.blob();
            const videoBuffer = await videoBlob.arrayBuffer();
            const fileName = `${item.id}.mp4`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from('tiktok-videos')
              .upload(fileName, videoBuffer, {
                contentType: 'video/mp4',
                upsert: true
              });

            if (uploadError) {
              throw new Error(`Failed to upload video: ${uploadError.message}`);
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('tiktok-videos')
              .getPublicUrl(fileName);

            const videoUrl = urlData.publicUrl;
            console.log('📤 Video uploaded to:', videoUrl);

            // Update queue item as completed
            await supabase
              .from('tiktok_video_queue')
              .update({
                status: 'completed',
                video_url: videoUrl,
                processed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id);

            // Update blog post with video URL if we have a blog_id
            if (item.blog_id) {
              await supabase
                .from('blog_posts')
                .update({ tiktok_video_url: videoUrl })
                .eq('id', item.blog_id);
            }

            completedCount++;
          } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
            // Operation failed
            await supabase
              .from('tiktok_video_queue')
              .update({
                status: 'failed',
                error_message: prediction.error || 'Video generation failed',
                attempts: item.attempts + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id);
          }
          // If status is 'starting' or 'processing', we just wait for next poll

          processedCount++;
        } catch (error) {
          console.error(`❌ Error processing item ${item.id}:`, error);
        }
      }
    }

    // 2. Then, start new video generations for pending items
    const { data: pendingItems } = await supabase
      .from('tiktok_video_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(2);

    let startedCount = 0;

    if (pendingItems && pendingItems.length > 0) {
      console.log(`📋 Found ${pendingItems.length} pending items to process`);

      for (const item of pendingItems) {
        try {
          // Invoke the generate-tiktok-video function
          const { error: invokeError } = await supabase.functions.invoke('generate-tiktok-video', {
            body: {
              queueItemId: item.id,
              blogId: item.blog_id,
              albumCoverUrl: item.album_cover_url,
              artist: item.artist,
              title: item.title
            }
          });

          if (invokeError) {
            console.error(`❌ Error invoking generate-tiktok-video for ${item.id}:`, invokeError);
            await supabase
              .from('tiktok_video_queue')
              .update({
                attempts: item.attempts + 1,
                error_message: invokeError.message,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id);
          } else {
            startedCount++;
          }

          // Rate limiting - wait 2 seconds between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Error starting video generation for ${item.id}:`, error);
        }
      }
    }

    console.log(`✅ Queue processed: polled=${processedCount}, completed=${completedCount}, started=${startedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Queue processed with Replicate Wan 2.5',
        polled: processedCount,
        completed: completedCount,
        started: startedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error processing TikTok video queue:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
