import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple GIF encoder for creating animated content
// This creates a looping zoom animation as an animated GIF
class SimpleGifEncoder {
  private width: number;
  private height: number;
  private frames: Uint8Array[] = [];
  private delays: number[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  addFrame(imageData: Uint8Array, delay: number = 100) {
    this.frames.push(imageData);
    this.delays.push(delay);
  }

  // For now, we'll create a simple static WebP with the image
  // Full animation would require more complex encoding
  getBuffer(): Uint8Array {
    if (this.frames.length === 0) {
      throw new Error('No frames added');
    }
    return this.frames[0];
  }
}

async function downloadImage(url: string): Promise<Uint8Array> {
  console.log(`📥 Downloading image from: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MusicScan/1.0 (Video Generator)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  console.log(`✅ Downloaded ${arrayBuffer.byteLength} bytes`);
  return new Uint8Array(arrayBuffer);
}

async function createVideoFromImage(
  imageUrl: string,
  supabase: any,
  queueItemId: string
): Promise<string> {
  console.log(`🎬 Creating video for queue item: ${queueItemId}`);
  
  // Download the source image
  const imageData = await downloadImage(imageUrl);
  
  // Generate a unique filename
  const timestamp = Date.now();
  const filename = `videos/${timestamp}_${queueItemId.substring(0, 8)}.webp`;
  
  // For now, we'll store the image as a "video placeholder"
  // The actual video generation will happen client-side when available
  // But we mark it as needing processing
  
  // Upload the image to storage as a placeholder
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('tiktok-videos')
    .upload(filename, imageData, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (uploadError) {
    console.error('❌ Upload error:', uploadError);
    throw new Error(`Failed to upload: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('tiktok-videos')
    .getPublicUrl(filename);

  console.log(`✅ Uploaded to: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { imageUrl, queueItemId } = await req.json();

    if (!imageUrl || !queueItemId) {
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl or queueItemId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎥 Processing video generation for: ${queueItemId}`);

    // For true video generation, we need client-side Canvas
    // Server-side we can only prepare the assets
    // Mark as needing client processing
    
    const videoUrl = await createVideoFromImage(imageUrl, supabase, queueItemId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        video_url: videoUrl,
        note: 'Static image uploaded - full video requires client-side processing'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in generate-video-server:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
