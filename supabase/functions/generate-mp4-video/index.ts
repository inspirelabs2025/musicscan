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

// Load random template from video-templates bucket
async function loadRandomTemplate(supabase: any): Promise<{ frames: Frame[], templateName: string, frameDelay: number }> {
  console.log('📂 Loading templates from video-templates bucket...');
  
  // List all templates in bucket
  const { data: files, error: listError } = await supabase.storage
    .from('video-templates')
    .list('', { limit: 100 });
  
  if (listError) {
    throw new Error(`Failed to list templates: ${listError.message}`);
  }
  
  // Filter only .gif files
  const templates = (files || []).filter((f: any) => f.name.toLowerCase().endsWith('.gif'));
  
  if (templates.length === 0) {
    throw new Error('No GIF templates found in video-templates bucket. Please upload template GIF files.');
  }
  
  console.log(`📋 Found ${templates.length} templates: ${templates.map((t: any) => t.name).join(', ')}`);
  
  // Random selection
  const selected = templates[Math.floor(Math.random() * templates.length)];
  console.log(`🎲 Selected template: ${selected.name}`);
  
  // Download template
  const { data: templateData, error: downloadError } = await supabase.storage
    .from('video-templates')
    .download(selected.name);
  
  if (downloadError) {
    throw new Error(`Failed to download template: ${downloadError.message}`);
  }
  
  // Decode GIF to frames
  const gifData = new Uint8Array(await templateData.arrayBuffer());
  console.log(`✅ Downloaded template: ${gifData.byteLength} bytes`);
  
  const gif = await GIF.decode(gifData);
  console.log(`✅ Decoded template GIF: ${gif.length} frames`);
  
  // Extract frames and get frame delay from first frame
  const frames: Frame[] = [];
  let frameDelay = 100; // Default 100ms
  
  for (let i = 0; i < gif.length; i++) {
    const frame = gif[i];
    frames.push(frame);
    if (i === 0 && frame.duration) {
      frameDelay = frame.duration;
    }
  }
  
  return { frames, templateName: selected.name, frameDelay };
}

async function generateGifVideo(
  supabase: any,
  imageUrl: string,
  artist: string = '',
  title: string = ''
): Promise<{ gifData: Uint8Array, templateUsed: string }> {
  console.log(`🎬 Generating template-based GIF video`);
  console.log(`📝 Artist: "${artist}", Title: "${title}"`);
  
  // Load random template
  const { frames: templateFrames, templateName, frameDelay } = await loadRandomTemplate(supabase);
  
  // Download and decode source image for overlay
  const sourceImage = await downloadAndDecodeImage(imageUrl);
  
  // Output dimensions (match template: 160x284)
  const outputWidth = 160;
  const outputHeight = 284;
  
  // Create static square overlay (center crop of source image) - BIGGER!
  const squareSize = 100;
  const frameWidth = 5;
  const framedSize = squareSize + (frameWidth * 2); // 110 total
  
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
  
  // Draw inner frame highlight (lighter gold) - 2px inset
  for (let y = 2; y < framedSize - 2; y++) {
    for (let x = 2; x < framedSize - 2; x++) {
      if (x < frameWidth || x >= framedSize - frameWidth || 
          y < frameWidth || y >= framedSize - frameWidth) {
        framedOverlay.setPixelAt(x + 1, y + 1, 0xD4A017FF);
      }
    }
  }
  
  // Draw inner shadow line (dark) - just before image
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
  
  // Prepare text (truncate if too long)
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
  const titleY = overlayY + framedSize + 5;
  
  console.log(`📹 Processing ${templateFrames.length} template frames with ${framedSize}x${framedSize} overlay`);
  
  // Create output frames
  const outputFrames: Frame[] = [];
  
  for (let i = 0; i < templateFrames.length; i++) {
    if (i % 10 === 0) {
      console.log(`🎞️ Processing frame ${i + 1}/${templateFrames.length}`);
    }
    
    // Clone template frame
    const templateFrame = templateFrames[i];
    const frameImage = templateFrame.clone() as Image;
    
    // Composite the framed overlay in the center
    frameImage.composite(framedOverlay, overlayX + 1, overlayY + 1);
    
    // Draw artist name (white with black shadow)
    if (artistText) {
      drawText(frameImage, artistText, artistX, artistY, 0xFFFFFFFF, 0x000000FF);
    }
    
    // Draw title (white with black shadow)
    if (titleText) {
      drawText(frameImage, titleText, titleX, titleY, 0xFFFFFFFF, 0x000000FF);
    }
    
    // Create frame with same delay as template
    const frame = Frame.from(frameImage, templateFrame.duration || frameDelay / 10);
    outputFrames.push(frame);
  }
  
  console.log(`✅ All frames processed, encoding GIF...`);
  
  // Create GIF from frames
  const gif = new GIF(outputFrames);
  const gifData = await gif.encode();
  
  console.log(`✅ GIF generated: ${gifData.byteLength} bytes using template: ${templateName}`);
  
  return { gifData, templateUsed: templateName };
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

    // Generate GIF with template background
    const { gifData, templateUsed } = await generateGifVideo(supabase, imageUrl, artist, title);

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
          template_used: templateUsed,
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
        template_used: templateUsed,
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
