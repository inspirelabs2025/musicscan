import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode, Image, GIF, Frame } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple 5x7 bitmap font for basic characters
const FONT: Record<string, number[][]> = {
  'A': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  'B': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
  'C': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]],
  'D': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0]],
  'E': [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  'F': [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
  'G': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  'H': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  'I': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
  'J': [[0,0,1,1,1],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[1,0,0,1,0],[1,0,0,1,0],[0,1,1,0,0]],
  'K': [[1,0,0,0,1],[1,0,0,1,0],[1,0,1,0,0],[1,1,0,0,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
  'L': [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  'N': [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  'O': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  'P': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
  'Q': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,1,0],[0,1,1,0,1]],
  'R': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
  'S': [[0,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,1,1,1,0]],
  'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
  'U': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  'V': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,1,0,1,0],[0,0,1,0,0]],
  'W': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1]],
  'X': [[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[1,0,0,0,1]],
  'Y': [[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
  'Z': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  '0': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,1,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '1': [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0]],
  '2': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,1,1,0],[0,1,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  '3': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,0,1],[0,0,1,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '4': [[0,0,0,1,0],[0,0,1,1,0],[0,1,0,1,0],[1,0,0,1,0],[1,1,1,1,1],[0,0,0,1,0],[0,0,0,1,0]],
  '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '6': [[0,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '7': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0]],
  '8': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  '9': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,0]],
  ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  '-': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[1,1,1,1,1],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  '.': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,1,0,0]],
  "'": [[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  '&': [[0,1,1,0,0],[1,0,0,1,0],[1,0,0,1,0],[0,1,1,0,0],[1,0,0,1,1],[1,0,0,1,0],[0,1,1,0,1]],
  '(': [[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0]],
  ')': [[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0]],
};

// Draw text on image with shadow
function drawText(image: Image, text: string, startX: number, startY: number, color: number, shadowColor: number) {
  const charWidth = 6; // 5 pixels + 1 spacing
  const charHeight = 7;
  const upperText = text.toUpperCase();
  
  for (let c = 0; c < upperText.length; c++) {
    const char = upperText[c];
    const charData = FONT[char] || FONT[' '];
    const charX = startX + (c * charWidth);
    
    for (let y = 0; y < charHeight; y++) {
      for (let x = 0; x < 5; x++) {
        if (charData[y][x] === 1) {
          const px = charX + x;
          const py = startY + y;
          
          // Draw shadow first (offset by 1)
          if (px + 2 > 0 && px + 2 <= image.width && py + 2 > 0 && py + 2 <= image.height) {
            image.setPixelAt(px + 2, py + 2, shadowColor);
          }
          
          // Draw main text
          if (px + 1 > 0 && px + 1 <= image.width && py + 1 > 0 && py + 1 <= image.height) {
            image.setPixelAt(px + 1, py + 1, color);
          }
        }
      }
    }
  }
}

// Calculate text width
function getTextWidth(text: string): number {
  return text.length * 6; // 5px char + 1px spacing
}

// Truncate text to fit within max width
function truncateText(text: string, maxWidth: number): string {
  const charWidth = 6;
  const maxChars = Math.floor(maxWidth / charWidth);
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - 2) + '..';
}

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
  fps: number = 8,
  artist: string = '',
  title: string = ''
): Promise<Uint8Array> {
  console.log(`🎬 Generating GIF: ${durationSeconds}s @ ${fps}fps`);
  console.log(`📝 Artist: "${artist}", Title: "${title}"`);
  
  // Download and decode source image
  const sourceImage = await downloadAndDecodeImage(imageUrl);
  
  // Compact format to stay within CPU limits: 160x284 (9:16)
  const outputWidth = 160;
  const outputHeight = 284;
  const totalFrames = Math.floor(durationSeconds * fps);
  const frameDelay = Math.floor(1000 / fps); // Delay in ms
  
  // Create static square overlay (center crop of source image) - BIGGER!
  const squareSize = 100; // Increased from 80
  const frameWidth = 5;   // Frame border width
  const framedSize = squareSize + (frameWidth * 2); // 110 total
  
  const minDim = Math.min(sourceImage.width, sourceImage.height);
  const cropX = Math.floor((sourceImage.width - minDim) / 2);
  const cropY = Math.floor((sourceImage.height - minDim) / 2);
  const croppedImage = sourceImage.clone()
    .crop(cropX + 1, cropY + 1, minDim, minDim) // ImageScript uses 1-indexed
    .resize(squareSize, squareSize);
  
  // Create framed overlay with painting-style border
  const framedOverlay = new Image(framedSize, framedSize);
  
  // Draw outer frame (dark gold/brown)
  framedOverlay.fill(0x8B6914FF); // Dark gold
  
  // Draw inner frame highlight (lighter gold) - 2px inset
  for (let y = 2; y < framedSize - 2; y++) {
    for (let x = 2; x < framedSize - 2; x++) {
      if (x < frameWidth || x >= framedSize - frameWidth || 
          y < frameWidth || y >= framedSize - frameWidth) {
        framedOverlay.setPixelAt(x + 1, y + 1, 0xD4A017FF); // Golden
      }
    }
  }
  
  // Draw inner shadow line (dark) - just before image
  for (let y = frameWidth - 1; y < framedSize - frameWidth + 1; y++) {
    for (let x = frameWidth - 1; x < framedSize - frameWidth + 1; x++) {
      if (x === frameWidth - 1 || x === framedSize - frameWidth || 
          y === frameWidth - 1 || y === framedSize - frameWidth) {
        framedOverlay.setPixelAt(x + 1, y + 1, 0x5C4A0AFF); // Dark shadow
      }
    }
  }
  
  // Composite the cropped image onto the frame
  framedOverlay.composite(croppedImage, frameWidth + 1, frameWidth + 1);
  
  // Calculate center position for framed overlay
  const overlayX = Math.floor((outputWidth - framedSize) / 2);
  const overlayY = Math.floor((outputHeight - framedSize) / 2);
  
  // Prepare text (truncate if too long)
  const maxTextWidth = outputWidth - 10; // 5px padding on each side
  const artistText = artist ? truncateText(artist.toUpperCase(), maxTextWidth) : '';
  const titleText = title ? truncateText(title.toUpperCase(), maxTextWidth) : '';
  
  // Calculate text positions (centered)
  const artistWidth = getTextWidth(artistText);
  const titleWidth = getTextWidth(titleText);
  const artistX = Math.floor((outputWidth - artistWidth) / 2);
  const titleX = Math.floor((outputWidth - titleWidth) / 2);
  
  // Text Y positions
  const artistY = overlayY - 15; // Above frame
  const titleY = overlayY + framedSize + 5; // Below frame
  
  console.log(`📹 Creating ${totalFrames} frames at ${outputWidth}x${outputHeight} with ${framedSize}x${framedSize} framed overlay`);
  
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
    
    // Composite the framed overlay in the center
    frameImage.composite(framedOverlay, overlayX + 1, overlayY + 1); // 1-indexed
    
    // Draw artist name (white with black shadow)
    if (artistText) {
      drawText(frameImage, artistText, artistX, artistY, 0xFFFFFFFF, 0x000000FF);
    }
    
    // Draw title (white with black shadow)
    if (titleText) {
      drawText(frameImage, titleText, titleX, titleY, 0xFFFFFFFF, 0x000000FF);
    }
    
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

    const { imageUrl, queueItemId, durationSeconds = 3, fps = 8, artist = '', title = '' } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎥 Processing GIF for queue item: ${queueItemId || 'manual'}`);

    // Generate GIF with artist/title text
    const gifData = await generateGifVideo(imageUrl, durationSeconds, fps, artist, title);

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
