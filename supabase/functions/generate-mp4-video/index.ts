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
  const charWidth = 6;
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
  return text.length * 6;
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
  
  const image = await decode(imageData);
  console.log(`✅ Decoded image: ${image.width}x${image.height}`);
  
  return image as Image;
}

// Create blurred background from image
function createBlurredBackground(sourceImage: Image, width: number, height: number): Image {
  // Create background by scaling and cropping source image to fill
  const scale = Math.max(width / sourceImage.width, height / sourceImage.height);
  const scaledWidth = Math.floor(sourceImage.width * scale);
  const scaledHeight = Math.floor(sourceImage.height * scale);
  
  const scaled = sourceImage.clone().resize(scaledWidth, scaledHeight);
  
  // Crop to center
  const cropX = Math.floor((scaledWidth - width) / 2);
  const cropY = Math.floor((scaledHeight - height) / 2);
  const background = scaled.crop(cropX + 1, cropY + 1, width, height);
  
  // Apply simple blur by averaging pixels (3x3 box blur)
  const blurred = new Image(width, height);
  for (let y = 1; y <= height; y++) {
    for (let x = 1; x <= width; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = Math.max(1, Math.min(width, x + dx));
          const py = Math.max(1, Math.min(height, y + dy));
          const pixel = background.getPixelAt(px, py);
          r += (pixel >> 24) & 0xFF;
          g += (pixel >> 16) & 0xFF;
          b += (pixel >> 8) & 0xFF;
          a += pixel & 0xFF;
          count++;
        }
      }
      
      const avgR = Math.floor(r / count);
      const avgG = Math.floor(g / count);
      const avgB = Math.floor(b / count);
      const avgA = Math.floor(a / count);
      blurred.setPixelAt(x, y, (avgR << 24) | (avgG << 16) | (avgB << 8) | avgA);
    }
  }
  
  // Darken the blurred background for better contrast
  for (let y = 1; y <= height; y++) {
    for (let x = 1; x <= width; x++) {
      const pixel = blurred.getPixelAt(x, y);
      const r = Math.floor(((pixel >> 24) & 0xFF) * 0.5);
      const g = Math.floor(((pixel >> 16) & 0xFF) * 0.5);
      const b = Math.floor(((pixel >> 8) & 0xFF) * 0.5);
      const a = pixel & 0xFF;
      blurred.setPixelAt(x, y, (r << 24) | (g << 16) | (b << 8) | a);
    }
  }
  
  return blurred;
}

async function generateGifVideo(
  imageUrl: string,
  artist: string = '',
  title: string = ''
): Promise<{ gifData: Uint8Array }> {
  console.log(`🎬 Generating GIF video with album cover background`);
  console.log(`📝 Artist: "${artist}", Title: "${title}"`);
  
  // Download source image
  const sourceImage = await downloadAndDecodeImage(imageUrl);
  
  // Output dimensions (9:16 vertical format for TikTok)
  const outputWidth = 160;
  const outputHeight = 284;
  
  // Create blurred background from source image
  const background = createBlurredBackground(sourceImage, outputWidth, outputHeight);
  
  // Create square overlay (album artwork with frame)
  const squareSize = 90;
  const frameWidth = 4;
  const framedSize = squareSize + (frameWidth * 2);
  
  // Center crop source image
  const minDim = Math.min(sourceImage.width, sourceImage.height);
  const cropX = Math.floor((sourceImage.width - minDim) / 2);
  const cropY = Math.floor((sourceImage.height - minDim) / 2);
  const croppedImage = sourceImage.clone()
    .crop(cropX + 1, cropY + 1, minDim, minDim)
    .resize(squareSize, squareSize);
  
  // Create framed overlay with painting-style border
  const framedOverlay = new Image(framedSize, framedSize);
  
  // Draw outer frame (dark gold/brown)
  framedOverlay.fill(0x8B6914FF);
  
  // Draw inner frame highlight (lighter gold)
  for (let y = 2; y < framedSize - 2; y++) {
    for (let x = 2; x < framedSize - 2; x++) {
      if (x < frameWidth || x >= framedSize - frameWidth || 
          y < frameWidth || y >= framedSize - frameWidth) {
        framedOverlay.setPixelAt(x + 1, y + 1, 0xD4A017FF);
      }
    }
  }
  
  // Draw inner shadow line
  for (let y = frameWidth - 1; y < framedSize - frameWidth + 1; y++) {
    for (let x = frameWidth - 1; x < framedSize - frameWidth + 1; x++) {
      if (x === frameWidth - 1 || x === framedSize - frameWidth || 
          y === frameWidth - 1 || y === framedSize - frameWidth) {
        framedOverlay.setPixelAt(x + 1, y + 1, 0x5C4A0AFF);
      }
    }
  }
  
  // Composite the cropped image onto the frame
  framedOverlay.composite(croppedImage, frameWidth + 1, frameWidth + 1);
  
  // Calculate center position for framed overlay
  const overlayX = Math.floor((outputWidth - framedSize) / 2);
  const overlayY = Math.floor((outputHeight - framedSize) / 2);
  
  // Prepare text
  const maxTextWidth = outputWidth - 10;
  const artistText = artist ? truncateText(artist.toUpperCase(), maxTextWidth) : '';
  const titleText = title ? truncateText(title.toUpperCase(), maxTextWidth) : '';
  
  // Calculate text positions (centered)
  const artistWidth = getTextWidth(artistText);
  const titleWidth = getTextWidth(titleText);
  const artistX = Math.floor((outputWidth - artistWidth) / 2);
  const titleX = Math.floor((outputWidth - titleWidth) / 2);
  
  // Text Y positions
  const artistY = overlayY - 15;
  const titleY = overlayY + framedSize + 8;
  
  console.log(`📹 Creating GIF with blurred album background`);
  
  // Generate multiple frames with subtle zoom animation
  const frameCount = 30; // 5 seconds at 6fps
  const frames: Frame[] = [];
  
  for (let i = 0; i < frameCount; i++) {
    // Create frame from background
    const outputImage = background.clone() as Image;
    
    // Calculate subtle zoom for overlay (1.0 to 1.05 and back)
    const progress = i / frameCount;
    const zoomPhase = Math.sin(progress * Math.PI * 2) * 0.02; // Subtle 2% oscillation
    const zoomScale = 1.0 + zoomPhase;
    
    // Scale overlay if zooming
    let currentOverlay = framedOverlay;
    let currentOverlayX = overlayX;
    let currentOverlayY = overlayY;
    
    if (zoomScale !== 1.0) {
      const newSize = Math.floor(framedSize * zoomScale);
      currentOverlay = framedOverlay.clone().resize(newSize, newSize) as Image;
      currentOverlayX = Math.floor((outputWidth - newSize) / 2);
      currentOverlayY = Math.floor((outputHeight - newSize) / 2);
    }
    
    // Composite the framed overlay
    outputImage.composite(currentOverlay, currentOverlayX + 1, currentOverlayY + 1);
    
    // Draw artist name
    if (artistText) {
      drawText(outputImage, artistText, artistX, artistY, 0xFFFFFFFF, 0x000000FF);
    }
    
    // Draw title
    if (titleText) {
      drawText(outputImage, titleText, titleX, titleY, 0xFFFFFFFF, 0x000000FF);
    }
    
    // Add frame (166ms = 6fps)
    frames.push(Frame.from(outputImage, 16));
  }
  
  const gif = new GIF(frames);
  const gifData = await gif.encode();
  
  console.log(`✅ GIF generated: ${gifData.byteLength} bytes, ${frameCount} frames`);
  
  return { gifData };
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

    const { imageUrl, queueItemId, artist = '', title = '' } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎥 Processing GIF for queue item: ${queueItemId || 'manual'}`);

    // Generate GIF with album cover background
    const { gifData } = await generateGifVideo(imageUrl, artist, title);

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
          template_used: 'album-cover-blur',
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
        template_used: 'album-cover-blur',
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
