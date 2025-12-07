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

// Download image and convert to base64 data URL to avoid hotlink protection issues
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  console.log('📥 Downloading image:', imageUrl);
  
  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'image/*',
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  
  console.log('✅ Image downloaded, size:', arrayBuffer.byteLength, 'bytes');
  
  return `data:${contentType};base64,${base64}`;
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

    // Download image and convert to base64 to avoid Discogs/hotlink 403 errors
    let imageData: string;
    try {
      imageData = await fetchImageAsBase64(albumCoverUrl);
    } catch (imgError) {
      console.error('❌ Failed to download image:', imgError);
      throw new Error(`Could not download album cover: ${imgError.message}`);
    }

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

    // Create prediction using Replicate Wan 2.5 Image-to-Video with base64 image
    console.log('📹 Starting Replicate Wan 2.5 prediction with base64 image...');
    
    const prediction = await replicate.predictions.create({
      model: "wan-video/wan-2.5-i2v-fast",
      input: {
        image: imageData, // Use base64 data URL instead of direct URL
        prompt: `Cinematic Ken Burns zoom effect on this album artwork. Slow, professional camera movement with subtle parallax. Music video aesthetic. Dark, moody lighting. High quality. Album: ${artist} - ${title}`,
        num_frames: 81,
        frames_per_second: 16,
        aspect_ratio: "9:16",
        resolution: "480p",
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
