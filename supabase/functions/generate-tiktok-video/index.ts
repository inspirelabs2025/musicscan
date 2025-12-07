import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

async function imageUrlToBase64(imageUrl: string): Promise<string> {
  console.log('Fetching image from URL:', imageUrl);
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  console.log('Image converted to base64, length:', base64.length);
  return base64;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');

    if (!googleApiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: GenerateVideoRequest = await req.json();
    const { queueItemId, blogId, albumCoverUrl, artist, title } = body;

    console.log('Generating TikTok video for:', { artist, title, albumCoverUrl });

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

    // Convert image URL to base64
    const imageBase64 = await imageUrlToBase64(albumCoverUrl);

    // Call Google Veo 2 API for video generation
    console.log('Calling Google Veo 2 API...');
    const veoResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{
            prompt: `Cinematic Ken Burns zoom effect on this album artwork. Slow, professional movement. Subtle parallax effect. Music video aesthetic. Dark, moody lighting. Professional quality. 5 seconds.`,
            image: { 
              bytesBase64Encoded: imageBase64 
            }
          }],
          parameters: {
            aspectRatio: "9:16",
            durationSeconds: 5,
            personGeneration: "dont_allow",
            sampleCount: 1
          }
        })
      }
    );

    if (!veoResponse.ok) {
      const errorText = await veoResponse.text();
      console.error('Veo API error:', veoResponse.status, errorText);
      throw new Error(`Veo API error: ${veoResponse.status} - ${errorText}`);
    }

    const veoData = await veoResponse.json();
    console.log('Veo API response:', JSON.stringify(veoData, null, 2));

    // Get the operation name for polling
    const operationName = veoData.name;
    if (!operationName) {
      throw new Error('No operation name returned from Veo API');
    }

    // Update queue with operation name for polling
    if (queueItemId) {
      await supabase
        .from('tiktok_video_queue')
        .update({ 
          operation_name: operationName,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItemId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Video generation started',
        operationName,
        queueItemId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating TikTok video:', error);

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
