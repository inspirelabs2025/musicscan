import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode, Image, GIF, Frame } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Download image and decode to ImageScript Image
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
  
  // Decode image
  const image = await decode(imageData);
  console.log(`✅ Decoded image: ${image.width}x${image.height}`);
  
  return image as Image;
}

// Generate a single frame with zoom effect
function generateZoomFrame(
  sourceImage: Image,
  frameIndex: number,
  totalFrames: number,
  outputWidth: number,
  outputHeight: number
): Image {
  // SLOW LINEAR GROW ZOOM - NO BOUNCE BACK
  // Frame 0: scale = 1.0 (100%)
  // Frame N: scale = 1.2 (120%) - 20% zoom over full duration
  const progress = frameIndex / Math.max(totalFrames - 1, 1);
  const scale = 1.0 + (progress * 0.2);
  
  console.log(`🔍 Frame ${frameIndex}/${totalFrames}: progress=${progress.toFixed(2)}, scale=${scale.toFixed(3)}`);
  
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
  
  return outputImage;
}

async function generateGifVideo(
  imageUrl: string,
  durationSeconds: number = 3,
  fps: number = 8
): Promise<Uint8Array> {
  console.log(`🎬 Generating GIF: ${durationSeconds}s @ ${fps}fps`);
  
  // Download and decode source image
  const sourceImage = await downloadAndDecodeImage(imageUrl);
  
  // Compact format to stay within CPU limits: 160x284 (9:16)
  const outputWidth = 160;
  const outputHeight = 284;
  const totalFrames = Math.floor(durationSeconds * fps);
  const frameDelay = Math.floor(1000 / fps); // Delay in ms
  
  console.log(`📹 Creating ${totalFrames} frames at ${outputWidth}x${outputHeight}`);
  
  console.log(`📹 Creating ${totalFrames} frames at ${outputWidth}x${outputHeight}`);
  
  // Create frames array
  const frames: Frame[] = [];
  
  for (let i = 0; i < totalFrames; i++) {
    if (i % 5 === 0) {
      console.log(`🎞️ Processing frame ${i + 1}/${totalFrames}`);
    }
    
    const frameImage = generateZoomFrame(
      sourceImage,
      i,
      totalFrames,
      outputWidth,
      outputHeight
    );
    
    // Create frame with delay (in 10ms units for GIF)
    const frame = Frame.from(frameImage, frameDelay / 10);
    frames.push(frame);
  }
  
  console.log(`✅ All frames created, encoding GIF...`);
  
  // Create GIF from frames
  const gif = new GIF(frames);
  const gifData = await gif.encode();
  
  console.log(`✅ GIF generated: ${gifData.byteLength} bytes`);
  
  return gifData;
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

    const { imageUrl, queueItemId, durationSeconds = 3, fps = 8 } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎥 Processing GIF for queue item: ${queueItemId || 'manual'}`);

    // Generate GIF
    const gifData = await generateGifVideo(imageUrl, durationSeconds, fps);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `videos/${timestamp}_${queueItemId?.substring(0, 8) || 'manual'}.gif`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tiktok-videos')
      .upload(filename, gifData, {
        contentType: 'image/gif',
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

    console.log(`✅ GIF uploaded: ${urlData.publicUrl}`);

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
        format: 'gif',
        size_bytes: gifData.byteLength,
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
