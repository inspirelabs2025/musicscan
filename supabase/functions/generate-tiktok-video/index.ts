import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Replicate from 'https://esm.sh/replicate@0.25.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateVideoRequest {
  queueItemId?: string;
  blogId?: string;
  albumCoverUrl: string;
  artist: string;
  title: string;
}

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

    const body: GenerateVideoRequest = await req.json();
    const { queueItemId, blogId, albumCoverUrl, artist, title } = body;

    console.log('🎬 Generating TikTok video with Wan 2.5 for:', { artist, title, albumCoverUrl });

    // Update queue status to processing if we have a queue item
    if (queueItemId) {
      await supabase
        .from('tiktok_video_queue')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItemId);
    }

    // Create prediction using Replicate Wan 2.5 Image-to-Video
    console.log('📹 Starting Replicate Wan 2.5 prediction...');
    
    const prediction = await replicate.predictions.create({
      model: "wan-video/wan-2.5-i2v-fast",
      input: {
        image: albumCoverUrl,
        prompt: `Cinematic Ken Burns zoom effect on this album artwork. Slow, professional camera movement with subtle parallax. Music video aesthetic. Dark, moody lighting. High quality. Album: ${artist} - ${title}`,
        num_frames: 81,
        frames_per_second: 16,
        aspect_ratio: "9:16",
        resolution: "720p",
        go_fast: true,
        sample_shift: 10
      }
    });

    console.log('✅ Replicate prediction created:', prediction.id);

    // Store the prediction ID for polling
    if (queueItemId) {
      await supabase
        .from('tiktok_video_queue')
        .update({ 
          operation_name: prediction.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItemId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video generation started with Wan 2.5',
        predictionId: prediction.id,
        queueItemId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error generating TikTok video:', error);

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
