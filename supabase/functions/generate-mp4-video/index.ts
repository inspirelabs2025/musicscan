import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode, Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import HME from "https://esm.sh/h264-mp4-encoder@1.0.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Download image and decode to RGBA pixels
async function downloadAndDecodeImage(url: string): Promise<Image> {
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
  const imageData = new Uint8Array(arrayBuffer);
  console.log(`✅ Downloaded ${imageData.byteLength} bytes`);
  
  // Decode image to RGBA
  const image = await decode(imageData);
  console.log(`✅ Decoded image: ${image.width}x${image.height}`);
  
  return image as Image;
}

// Generate zoom animation frame - returns RGBA buffer
function generateZoomFrame(
  sourceImage: Image,
  frameIndex: number,
  totalFrames: number,
  outputWidth: number,
  outputHeight: number
): Uint8Array {
  // Calculate zoom scale (1.0 -> 1.5 -> 1.0 for smooth zoom in/out)
  const progress = frameIndex / (totalFrames - 1);
  const zoomCycle = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
  const scale = 1.0 + (zoomCycle * 0.5); // 1.0 -> 1.5 -> 1.0
  
  // Create output image with black background
  const outputImage = new Image(outputWidth, outputHeight);
  outputImage.fill(0x000000FF); // Black background
  
  // Calculate aspect ratios
  const sourceAspect = sourceImage.width / sourceImage.height;
  const outputAspect = outputWidth / outputHeight;
  
  let fitWidth: number, fitHeight: number;
  
  if (sourceAspect > outputAspect) {
    // Source is wider - fit to height
    fitHeight = outputHeight;
    fitWidth = Math.floor(fitHeight * sourceAspect);
  } else {
    // Source is taller or same - fit to width
    fitWidth = outputWidth;
    fitHeight = Math.floor(fitWidth / sourceAspect);
  }
  
  // Apply zoom to fit dimensions
  const zoomedWidth = Math.floor(fitWidth * scale);
  const zoomedHeight = Math.floor(fitHeight * scale);
  
  // Resize source image
  const resizedImage = sourceImage.clone().resize(zoomedWidth, zoomedHeight);
  
  // Center the image
  const offsetX = Math.floor((outputWidth - zoomedWidth) / 2);
  const offsetY = Math.floor((outputHeight - zoomedHeight) / 2);
  
  // Composite onto output (manually copy pixels)
  for (let y = 0; y < zoomedHeight; y++) {
    for (let x = 0; x < zoomedWidth; x++) {
      const destX = offsetX + x;
      const destY = offsetY + y;
      
      if (destX >= 0 && destX < outputWidth && destY >= 0 && destY < outputHeight) {
        const pixel = resizedImage.getPixelAt(x + 1, y + 1); // 1-indexed
        outputImage.setPixelAt(destX + 1, destY + 1, pixel);
      }
    }
  }
  
  // Return RGBA buffer
  return outputImage.bitmap;
}

async function generateMp4Video(
  imageUrl: string,
  durationSeconds: number = 3,
  fps: number = 10 // Reduced to 10 fps for edge function CPU limits
): Promise<Uint8Array> {
  console.log(`🎬 Generating MP4 video: ${durationSeconds}s @ ${fps}fps`);
  
  // Download and decode source image
  const sourceImage = await downloadAndDecodeImage(imageUrl);
  
  // TikTok format: 540x960 (9:16) - reduced from 720x1280 for edge function CPU limits
  const outputWidth = 540;
  const outputHeight = 960;
  const totalFrames = durationSeconds * fps; // 45 frames instead of 90
  
  console.log(`📹 Creating ${totalFrames} frames at ${outputWidth}x${outputHeight}`);
  
  // Initialize encoder
  console.log(`📦 Loading H264 encoder...`);
  const encoder = await HME.createH264MP4Encoder();
  console.log(`✅ Encoder created`);
  
  encoder.width = outputWidth;
  encoder.height = outputHeight;
  encoder.frameRate = fps;
  encoder.quantizationParameter = 28; // Quality (lower = better, 10-51)
  encoder.speed = 5; // Speed preset (0-10, higher = faster)
  encoder.initialize();
  
  console.log(`✅ Encoder initialized`);
  
  // Generate and encode frames
  for (let i = 0; i < totalFrames; i++) {
    if (i % 10 === 0) {
      console.log(`🎞️ Processing frame ${i + 1}/${totalFrames}`);
    }
    
    const frameData = generateZoomFrame(
      sourceImage,
      i,
      totalFrames,
      outputWidth,
      outputHeight
    );
    
    encoder.addFrameRgba(frameData);
  }
  
  console.log(`✅ All frames added, finalizing...`);
  
  // Finalize and get MP4 data
  encoder.finalize();
  const mp4Data = encoder.FS.readFile(encoder.outputFilename);
  encoder.delete();
  
  console.log(`✅ MP4 generated: ${mp4Data.byteLength} bytes`);
  
  return mp4Data;
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

    const { imageUrl, queueItemId, durationSeconds = 3, fps = 30 } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎥 Processing video for queue item: ${queueItemId || 'manual'}`);

    // Generate MP4 video
    const mp4Data = await generateMp4Video(imageUrl, durationSeconds, fps);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `videos/${timestamp}_${queueItemId?.substring(0, 8) || 'manual'}.mp4`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tiktok-videos')
      .upload(filename, mp4Data, {
        contentType: 'video/mp4',
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

    console.log(`✅ Video uploaded: ${urlData.publicUrl}`);

    // Update queue item if provided
    if (queueItemId) {
      const { error: updateError } = await supabase
        .from('tiktok_video_queue')
        .update({
          status: 'completed',
          video_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', queueItemId);

      if (updateError) {
        console.error('⚠️ Failed to update queue item:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        video_url: urlData.publicUrl,
        format: 'mp4',
        size_bytes: mp4Data.byteLength,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in generate-mp4-video:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
