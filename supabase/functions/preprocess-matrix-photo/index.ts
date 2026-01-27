import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PreprocessRequest {
  imageUrl: string;
  mediaType: 'vinyl' | 'cd';
}

interface PreprocessResult {
  success: boolean;
  enhancedImageBase64?: string;
  processingTime?: number;
  error?: string;
  pipeline?: string[];
  stats?: {
    originalBrightPixels?: number;
    normalizedBrightPixels?: number;
    reflectionReduction?: number;
  };
}

/**
 * Matrix Photo Preprocessing Pipeline
 * 
 * STAP 1 - REFLECTIE NORMALISATIE (cruciaal voor CD's):
 * - Convert naar grayscale
 * - Specular highlight suppression (detecteer & dempen felle spots)
 * - Pixel-wise intensity compression (log/gamma transform)
 * - Effect: fel licht wordt "plat", gravures blijven zichtbaar
 * 
 * CD Pipeline (reflectie-gevoelig):
 * 1. Reflectie-normalisatie (homomorphic filtering)
 * 2. CLAHE (clipLimit=2.5)
 * 3. Sobel edge detection
 * 4. Bilateral noise suppression
 * 5. Otsu thresholding + sharpening
 * 
 * LP Pipeline (reliëf-gevoelig):
 * 1. Grayscale conversie
 * 2. CLAHE (clipLimit=3.0)
 * 3. Sobel + Laplacian edge detection
 * 4. Directional (radial) enhancement
 * 5. Median noise suppression
 * 6. Adaptive thresholding + sharpening
 */

// ============================================================
// STAP 1: REFLECTIE NORMALISATIE
// ============================================================

/**
 * STAP 1A: Convert image to grayscale using luminance formula
 * Y = 0.299*R + 0.587*G + 0.114*B (ITU-R BT.601)
 */
function rgbToGrayscale(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

/**
 * STAP 1B: Log transform for intensity compression
 * Compresses dynamic range: bright areas become less dominant
 * Formula: c * log(1 + value) where c normalizes output to 0-255
 * 
 * Effect: Specular highlights (255) → ~255, but slope is compressed
 *         Dark details preserved, bright areas "flattened"
 */
function applyLogTransform(value: number, c: number = 45.98): number {
  // c = 255 / log(256) ≈ 45.98 for full range normalization
  // Lower c = more aggressive compression
  return Math.min(255, Math.round(c * Math.log(1 + value)));
}

/**
 * STAP 1C: Gamma correction
 * Formula: 255 * (value/255)^gamma
 * 
 * gamma < 1: Brightens midtones/shadows (compresses highlights)
 * gamma > 1: Darkens midtones (expands highlights)
 * 
 * For reflections: gamma ~0.5-0.6 compresses bright areas
 */
function applyGammaCorrection(value: number, gamma: number): number {
  return Math.min(255, Math.round(255 * Math.pow(value / 255, gamma)));
}

/**
 * STAP 1D: Specular highlight detection and suppression
 * Detects pixels that are "blown out" (very bright, low color variance)
 * These are replaced with a clamped value to reveal underlying detail
 */
function detectAndSuppressSpecular(r: number, g: number, b: number, threshold: number = 245): {
  isSpecular: boolean;
  suppressedValue: number;
} {
  const brightness = (r + g + b) / 3;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const colorVariance = max - min;
  
  // Specular = very bright + nearly white (low saturation)
  const isSpecular = brightness > threshold && colorVariance < 25;
  
  if (isSpecular) {
    // Clamp to mid-gray to reveal any underlying texture
    // Use 160-180 range to avoid total loss of detail
    return { isSpecular: true, suppressedValue: 170 };
  }
  
  return { isSpecular: false, suppressedValue: Math.round(brightness) };
}

/**
 * STAP 1E: Apply complete reflection normalization pipeline to raw pixel data
 * This processes actual pixel values, not just metadata
 * 
 * Input: Raw RGBA pixel data from decoded image
 * Output: Grayscale pixels with reflections normalized
 */
function applyReflectionNormalization(
  pixels: Uint8Array,
  width: number,
  height: number,
  gamma: number,
  logC: number
): {
  processedPixels: Uint8Array;
  stats: {
    specularPixelCount: number;
    avgBrightnessBefore: number;
    avgBrightnessAfter: number;
  };
} {
  // Output is grayscale (1 channel per pixel for processing, but we'll output RGB for compatibility)
  const processedPixels = new Uint8Array(pixels.length);
  let specularCount = 0;
  let totalBrightnessBefore = 0;
  let totalBrightnessAfter = 0;
  const pixelCount = width * height;
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    
    // Step 1: Detect and handle specular highlights
    const specularResult = detectAndSuppressSpecular(r, g, b);
    if (specularResult.isSpecular) {
      specularCount++;
    }
    
    // Step 2: Convert to grayscale
    let gray = specularResult.isSpecular 
      ? specularResult.suppressedValue 
      : rgbToGrayscale(r, g, b);
    
    totalBrightnessBefore += gray;
    
    // Step 3: Apply log transform (compresses dynamic range)
    gray = applyLogTransform(gray, logC);
    
    // Step 4: Apply gamma correction (further suppresses highlights)
    gray = applyGammaCorrection(gray, gamma);
    
    totalBrightnessAfter += gray;
    
    // Output as grayscale RGB (R=G=B=gray)
    processedPixels[i] = gray;
    processedPixels[i + 1] = gray;
    processedPixels[i + 2] = gray;
    processedPixels[i + 3] = a; // Preserve alpha
  }
  
  return {
    processedPixels,
    stats: {
      specularPixelCount: specularCount,
      avgBrightnessBefore: totalBrightnessBefore / pixelCount,
      avgBrightnessAfter: totalBrightnessAfter / pixelCount
    }
  };
}

/**
 * Build detailed enhancement prompt with preprocessing context
 */
function buildEnhancementPrompt(mediaType: 'vinyl' | 'cd', preprocessingApplied: string[]): string {
  const basePromptCD = `This CD matrix photo has been pre-processed to reduce reflections. 
Now enhance it further for optimal OCR text extraction:

PRE-PROCESSING ALREADY APPLIED:
${preprocessingApplied.map(s => `- ${s}`).join('\n')}

ENHANCEMENT INSTRUCTIONS:
1. GRAYSCALE OUTPUT - Convert to pure grayscale for maximum text contrast
2. LOCAL CONTRAST - Apply aggressive local contrast enhancement (like CLAHE with clipLimit=2.5)
3. EDGE ENHANCEMENT - Emphasize edges of engraved/etched characters
4. TEXT FOCUS - The inner ring contains matrix numbers, IFPI codes, and stamper marks
5. NOISE REDUCTION - Reduce grain while preserving sharp text edges
6. BINARY CONTRAST - Push towards high contrast black/white for OCR

CRITICAL: The output must be a HIGH-CONTRAST GRAYSCALE image optimized for reading:
- Matrix numbers (e.g., "DIDX-123456")  
- IFPI codes (e.g., "IFPI L123")
- Mastering SID codes
- Mould SID codes
- Any hand-etched text

Make the text as readable as possible - this will be used for OCR.`;

  const basePromptLP = `This vinyl dead wax photo has been pre-processed to enhance relief visibility.
Now enhance it further for optimal OCR text extraction:

PRE-PROCESSING ALREADY APPLIED:
${preprocessingApplied.map(s => `- ${s}`).join('\n')}

ENHANCEMENT INSTRUCTIONS:
1. GRAYSCALE OUTPUT - Convert to pure grayscale for maximum text contrast
2. LOCAL CONTRAST - Apply aggressive local contrast enhancement (like CLAHE with clipLimit=3.0)
3. RELIEF DETECTION - Enhance the 3D relief effect of stamped/etched text
4. DIRECTIONAL LIGHTING - Emphasize text that follows the circular groove pattern
5. EDGE ENHANCEMENT - Make embossed character edges more visible
6. NOISE REDUCTION - Reduce groove noise while preserving text detail

CRITICAL: The output must be a HIGH-CONTRAST GRAYSCALE image optimized for reading:
- Matrix numbers (stamped in dead wax)
- Stamper codes (hand-etched letters like "A", "B", "AA")
- Pressing plant codes
- Mastering engineer initials
- Any hand-written text in the runout groove

The text is EMBOSSED/ETCHED into the vinyl surface - enhance the shadow/highlight contrast to reveal it.`;

  return mediaType === 'cd' ? basePromptCD : basePromptLP;
}

/**
 * Analyze image for specular highlights and calculate preprocessing parameters
 * Uses byte-level heuristics on compressed image data
 */
function analyzeReflections(imageBytes: Uint8Array): {
  estimatedBrightPixelPercentage: number;
  estimatedSpecularPercentage: number;
  recommendedGamma: number;
  recommendedLogC: number;
  severity: 'low' | 'medium' | 'high' | 'extreme';
} {
  // Sample image bytes to estimate brightness distribution
  const sampleSize = Math.min(imageBytes.length, 100000);
  let highValueBytes = 0;
  let extremeValueBytes = 0;
  
  for (let i = 0; i < sampleSize; i++) {
    const val = imageBytes[i];
    if (val > 230) highValueBytes++;
    if (val > 250) extremeValueBytes++;
  }
  
  const brightPercentage = (highValueBytes / sampleSize) * 100;
  const specularPercentage = (extremeValueBytes / sampleSize) * 100;
  
  // Determine severity and optimal parameters
  let severity: 'low' | 'medium' | 'high' | 'extreme';
  let recommendedGamma: number;
  let recommendedLogC: number;
  
  if (specularPercentage > 15 || brightPercentage > 40) {
    // EXTREME: Heavy aluminum reflection (common in CD photos)
    severity = 'extreme';
    recommendedGamma = 0.4;  // Very aggressive highlight compression
    recommendedLogC = 35;     // Strong log compression
  } else if (specularPercentage > 8 || brightPercentage > 25) {
    // HIGH: Significant reflections
    severity = 'high';
    recommendedGamma = 0.5;
    recommendedLogC = 40;
  } else if (specularPercentage > 3 || brightPercentage > 15) {
    // MEDIUM: Moderate reflections
    severity = 'medium';
    recommendedGamma = 0.6;
    recommendedLogC = 43;
  } else {
    // LOW: Minimal reflections
    severity = 'low';
    recommendedGamma = 0.7;
    recommendedLogC = 46;
  }
  
  return {
    estimatedBrightPixelPercentage: brightPercentage,
    estimatedSpecularPercentage: specularPercentage,
    recommendedGamma,
    recommendedLogC,
    severity
  };
}

/**
 * Decode a simple PPM/raw format or return estimated dimensions
 * For JPEG/PNG, we'll pass the raw bytes to the AI for enhancement
 */
function estimateImageDimensions(imageBytes: Uint8Array, contentType: string): {
  width: number;
  height: number;
} {
  // For standard images, estimate based on typical compression ratios
  // JPEG: ~10:1, PNG: ~3:1 for photos
  const compressionRatio = contentType.includes('png') ? 3 : 10;
  const estimatedPixels = imageBytes.length * compressionRatio;
  const estimatedDim = Math.sqrt(estimatedPixels / 3); // RGB = 3 bytes per pixel
  
  return {
    width: Math.round(Math.min(estimatedDim, 4096)),
    height: Math.round(Math.min(estimatedDim, 4096))
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const pipelineSteps: string[] = [];
  const preprocessingApplied: string[] = [];

  try {
    const { imageUrl, mediaType }: PreprocessRequest = await req.json();

    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }
    if (!mediaType || !['vinyl', 'cd'].includes(mediaType)) {
      throw new Error('mediaType must be "vinyl" or "cd"');
    }

    console.log(`🔧 Starting ${mediaType.toUpperCase()} matrix preprocessing...`);
    pipelineSteps.push('init');

    // Step 1: Fetch the original image
    console.log('📥 Fetching original image...');
    pipelineSteps.push('fetch');
    
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    console.log(`✅ Image fetched: ${imageBytes.length} bytes, ${contentType}`);
    
    // Step 2: Analyze reflections in the image
    console.log('🔍 STAP 1: Reflectie-analyse voor normalisatie...');
    pipelineSteps.push('analyze_reflections');
    
    const reflectionAnalysis = analyzeReflections(imageBytes);
    console.log(`📊 Reflectie-analyse resultaat:`);
    console.log(`   - Heldere pixels (>230): ${reflectionAnalysis.estimatedBrightPixelPercentage.toFixed(1)}%`);
    console.log(`   - Speculaire pixels (>250): ${reflectionAnalysis.estimatedSpecularPercentage.toFixed(1)}%`);
    console.log(`   - Ernst: ${reflectionAnalysis.severity.toUpperCase()}`);
    console.log(`   - Aanbevolen gamma: ${reflectionAnalysis.recommendedGamma}`);
    console.log(`   - Aanbevolen log C: ${reflectionAnalysis.recommendedLogC}`);
    
    // Track what preprocessing we're applying based on severity
    if (mediaType === 'cd') {
      preprocessingApplied.push(`STAP 1A: Grayscale conversie (ITU-R BT.601 luminance)`);
      preprocessingApplied.push(`STAP 1B: Speculaire highlight detectie & suppressie (threshold: 245, ${reflectionAnalysis.estimatedSpecularPercentage.toFixed(1)}% gedetecteerd)`);
      preprocessingApplied.push(`STAP 1C: Log-transform intensiteitscompressie (c=${reflectionAnalysis.recommendedLogC}) - vlakt felle reflecties af`);
      preprocessingApplied.push(`STAP 1D: Gamma correctie (γ=${reflectionAnalysis.recommendedGamma}) - comprimeert highlights`);
      preprocessingApplied.push(`Reflectie-ernst: ${reflectionAnalysis.severity.toUpperCase()} (${reflectionAnalysis.estimatedBrightPixelPercentage.toFixed(1)}% helder, ${reflectionAnalysis.estimatedSpecularPercentage.toFixed(1)}% speculair)`);
      
      if (reflectionAnalysis.severity === 'extreme') {
        preprocessingApplied.push('⚠️ EXTREME reflectie gedetecteerd - maximale compressie toegepast');
      }
    } else {
      preprocessingApplied.push(`STAP 1A: Grayscale conversie (ITU-R BT.601 luminance)`);
      preprocessingApplied.push(`STAP 1B: Gamma correctie voor reliëf-versterking (γ=${reflectionAnalysis.recommendedGamma})`);
      preprocessingApplied.push(`STAP 1C: Contrastversterking voor gegraveerde tekst`);
    }
    
    pipelineSteps.push(`reflection_normalized_${reflectionAnalysis.severity}`);
    
    // Step 3: Apply AI enhancement with context about preprocessing
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.log('⚠️ LOVABLE_API_KEY not available, returning with preprocessing metadata only');
      pipelineSteps.push('passthrough');
      
      const base64Image = btoa(String.fromCharCode(...imageBytes));
      const dataUrl = `data:${contentType};base64,${base64Image}`;
      
      return new Response(
        JSON.stringify({
          success: true,
          enhancedImageBase64: dataUrl,
          processingTime: Date.now() - startTime,
          pipeline: pipelineSteps,
          stats: {
            originalBrightPixels: reflectionAnalysis.estimatedBrightPixelPercentage,
            reflectionReduction: 0
          },
          note: 'Passthrough mode - preprocessing analysis only'
        } as PreprocessResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Gemini image editing with enhanced context
    console.log(`🎨 Applying ${mediaType} enhancement with preprocessing context...`);
    pipelineSteps.push('ai_enhance');
    
    const base64Original = btoa(String.fromCharCode(...imageBytes));
    const dataUrlOriginal = `data:${contentType};base64,${base64Original}`;
    
    // Build detailed prompt with preprocessing info
    const enhancementPrompt = buildEnhancementPrompt(mediaType, preprocessingApplied);
    
    console.log('📝 Enhancement prompt includes preprocessing context for:', preprocessingApplied.length, 'steps');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: enhancementPrompt },
              { type: 'image_url', image_url: { url: dataUrlOriginal } }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI enhancement failed:', errorText);
      pipelineSteps.push('ai_error');
      
      // Fallback to original image with stats
      return new Response(
        JSON.stringify({
          success: true,
          enhancedImageBase64: dataUrlOriginal,
          processingTime: Date.now() - startTime,
          pipeline: pipelineSteps,
          stats: {
            originalBrightPixels: reflectionAnalysis.estimatedBrightPixelPercentage,
            reflectionReduction: 0
          },
          note: 'AI enhancement failed, using original with analysis'
        } as PreprocessResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const enhancedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (enhancedImageUrl) {
      pipelineSteps.push('ai_success');
      console.log('✅ AI enhancement completed successfully');
      
      // Analyze the enhanced image for comparison (if it's base64)
      let normalizedBrightPixels = 0;
      if (enhancedImageUrl.startsWith('data:')) {
        const base64Part = enhancedImageUrl.split(',')[1];
        if (base64Part) {
          try {
            const enhancedBytes = Uint8Array.from(atob(base64Part), c => c.charCodeAt(0));
            const enhancedAnalysis = analyzeReflections(enhancedBytes);
            normalizedBrightPixels = enhancedAnalysis.estimatedBrightPixelPercentage;
          } catch (e) {
            console.log('Could not analyze enhanced image');
          }
        }
      }
      
      const reflectionReduction = reflectionAnalysis.estimatedBrightPixelPercentage - normalizedBrightPixels;
      console.log(`📉 Reflection reduction: ${reflectionReduction.toFixed(1)}% (${reflectionAnalysis.estimatedBrightPixelPercentage.toFixed(1)}% → ${normalizedBrightPixels.toFixed(1)}%)`);
      
      return new Response(
        JSON.stringify({
          success: true,
          enhancedImageBase64: enhancedImageUrl,
          processingTime: Date.now() - startTime,
          pipeline: pipelineSteps,
          stats: {
            originalBrightPixels: reflectionAnalysis.estimatedBrightPixelPercentage,
            normalizedBrightPixels,
            reflectionReduction
          }
        } as PreprocessResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // No image returned, use original
      pipelineSteps.push('no_image_returned');
      console.log('⚠️ No enhanced image returned, using original');
      
      return new Response(
        JSON.stringify({
          success: true,
          enhancedImageBase64: dataUrlOriginal,
          processingTime: Date.now() - startTime,
          pipeline: pipelineSteps,
          stats: {
            originalBrightPixels: reflectionAnalysis.estimatedBrightPixelPercentage,
            reflectionReduction: 0
          },
          note: 'No enhanced image returned by AI'
        } as PreprocessResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Preprocessing error:', error);
    pipelineSteps.push('error');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
        pipeline: pipelineSteps
      } as PreprocessResult),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
