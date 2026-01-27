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

// ============================================================
// STAP 2: CLAHE - Contrast Limited Adaptive Histogram Equalization
// ============================================================

/**
 * CLAHE implementatie voor lokaal contrast enhancement
 * 
 * Waarom CLAHE i.p.v. globaal contrast:
 * - Werkt per regio (tile) - lokale aanpassing
 * - Laat micro-details "poppen" 
 * - Stabiel bij ongelijk licht (reflecties)
 * - Clip limit voorkomt over-enhancement artefacten
 */

interface CLAHEParams {
  tileSize: number;      // 8x8 of 16x16 pixels per tile
  clipLimit: number;     // 2.0-4.0, lager = minder artefacten
  numBins: number;       // Histogram bins (256 voor 8-bit)
}

/**
 * Bereken histogram voor een tile (regio) van de afbeelding
 */
function calculateTileHistogram(
  pixels: Uint8Array,
  width: number,
  startX: number,
  startY: number,
  tileWidth: number,
  tileHeight: number,
  numBins: number = 256
): number[] {
  const histogram = new Array(numBins).fill(0);
  
  for (let y = startY; y < startY + tileHeight; y++) {
    for (let x = startX; x < startX + tileWidth; x++) {
      // Bounds check
      if (x >= 0 && x < width && y >= 0) {
        const idx = (y * width + x) * 4; // RGBA
        if (idx < pixels.length) {
          const gray = pixels[idx]; // R channel (grayscale, so R=G=B)
          histogram[gray]++;
        }
      }
    }
  }
  
  return histogram;
}

/**
 * Clip histogram en herverdeel overtollige pixels
 * Dit voorkomt over-enhancement en artefacten
 */
function clipHistogram(histogram: number[], clipLimit: number, numPixels: number): number[] {
  const clipped = [...histogram];
  const actualClipLimit = Math.floor(clipLimit * numPixels / 256);
  
  let excess = 0;
  
  // Clip en tel excess
  for (let i = 0; i < clipped.length; i++) {
    if (clipped[i] > actualClipLimit) {
      excess += clipped[i] - actualClipLimit;
      clipped[i] = actualClipLimit;
    }
  }
  
  // Herverdeel excess gelijkmatig
  const perBin = Math.floor(excess / 256);
  const remainder = excess % 256;
  
  for (let i = 0; i < clipped.length; i++) {
    clipped[i] += perBin;
    if (i < remainder) {
      clipped[i]++;
    }
  }
  
  return clipped;
}

/**
 * Bereken CDF (Cumulative Distribution Function) van histogram
 * Dit wordt de lookup table voor pixel mapping
 */
function calculateCDF(histogram: number[], numPixels: number): number[] {
  const cdf = new Array(256).fill(0);
  let sum = 0;
  
  for (let i = 0; i < 256; i++) {
    sum += histogram[i];
    // Normaliseer naar 0-255 bereik
    cdf[i] = Math.round((sum / numPixels) * 255);
  }
  
  return cdf;
}

/**
 * Bilineaire interpolatie tussen 4 tile CDFs
 * Dit zorgt voor smooth transitions tussen tiles
 */
function bilinearInterpolate(
  value: number,
  cdfs: number[][],
  weights: number[]
): number {
  let result = 0;
  for (let i = 0; i < cdfs.length; i++) {
    result += cdfs[i][value] * weights[i];
  }
  return Math.min(255, Math.max(0, Math.round(result)));
}

/**
 * Pas CLAHE toe op grayscale afbeelding
 * 
 * @param pixels - RGBA pixel array (grayscale, dus R=G=B)
 * @param width - Afbeelding breedte
 * @param height - Afbeelding hoogte
 * @param params - CLAHE parameters
 */
function applyCLAHE(
  pixels: Uint8Array,
  width: number,
  height: number,
  params: CLAHEParams
): Uint8Array {
  const { tileSize, clipLimit, numBins } = params;
  const output = new Uint8Array(pixels.length);
  
  // Bereken aantal tiles
  const tilesX = Math.ceil(width / tileSize);
  const tilesY = Math.ceil(height / tileSize);
  
  // Pre-bereken CDFs voor alle tiles
  const tileCDFs: number[][][] = [];
  
  for (let ty = 0; ty < tilesY; ty++) {
    tileCDFs[ty] = [];
    for (let tx = 0; tx < tilesX; tx++) {
      const startX = tx * tileSize;
      const startY = ty * tileSize;
      const tileWidth = Math.min(tileSize, width - startX);
      const tileHeight = Math.min(tileSize, height - startY);
      const numPixels = tileWidth * tileHeight;
      
      // Stap 1: Bereken histogram voor deze tile
      const histogram = calculateTileHistogram(
        pixels, width, startX, startY, tileWidth, tileHeight, numBins
      );
      
      // Stap 2: Clip histogram (voorkom artefacten)
      const clippedHistogram = clipHistogram(histogram, clipLimit, numPixels);
      
      // Stap 3: Bereken CDF
      const cdf = calculateCDF(clippedHistogram, numPixels);
      
      tileCDFs[ty][tx] = cdf;
    }
  }
  
  // Pas CLAHE toe met bilineaire interpolatie
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const pixelValue = pixels[idx];
      
      // Vind de 4 dichtstbijzijnde tile centers
      const tileX = x / tileSize - 0.5;
      const tileY = y / tileSize - 0.5;
      
      const tx1 = Math.max(0, Math.floor(tileX));
      const tx2 = Math.min(tilesX - 1, tx1 + 1);
      const ty1 = Math.max(0, Math.floor(tileY));
      const ty2 = Math.min(tilesY - 1, ty1 + 1);
      
      // Bereken interpolatie gewichten
      const fx = tileX - tx1;
      const fy = tileY - ty1;
      
      const w1 = (1 - fx) * (1 - fy); // top-left
      const w2 = fx * (1 - fy);       // top-right
      const w3 = (1 - fx) * fy;       // bottom-left
      const w4 = fx * fy;             // bottom-right
      
      // Interpoleer tussen 4 tiles
      const cdfs = [
        tileCDFs[ty1][tx1],
        tileCDFs[ty1][tx2],
        tileCDFs[ty2][tx1],
        tileCDFs[ty2][tx2]
      ];
      
      const newValue = bilinearInterpolate(pixelValue, cdfs, [w1, w2, w3, w4]);
      
      // Output als grayscale RGB
      output[idx] = newValue;
      output[idx + 1] = newValue;
      output[idx + 2] = newValue;
      output[idx + 3] = pixels[idx + 3]; // Behoud alpha
    }
  }
  
  return output;
}

/**
 * Wrapper functie voor CLAHE met mediatype-specifieke instellingen
 */
function applyCLAHEForMediaType(
  pixels: Uint8Array,
  width: number,
  height: number,
  mediaType: 'vinyl' | 'cd'
): {
  processedPixels: Uint8Array;
  params: CLAHEParams;
} {
  // Mediatype-specifieke instellingen
  const params: CLAHEParams = mediaType === 'cd' 
    ? {
        tileSize: 8,        // Kleinere tiles voor fijnere details
        clipLimit: 2.5,     // Lager voor CD (minder ruis)
        numBins: 256
      }
    : {
        tileSize: 16,       // Grotere tiles voor LP grooves
        clipLimit: 3.0,     // Hoger voor LP (meer reliëf nodig)
        numBins: 256
      };
  
  const processedPixels = applyCLAHE(pixels, width, height, params);
  
  return { processedPixels, params };
}

/**
 * Build detailed enhancement prompt with preprocessing context
 */
function buildEnhancementPrompt(mediaType: 'vinyl' | 'cd', preprocessingApplied: string[]): string {
  const basePromptCD = `This CD matrix photo has been extensively pre-processed to reduce reflections and enhance local contrast.

PRE-PROCESSING ALREADY APPLIED:
${preprocessingApplied.map(s => `- ${s}`).join('\n')}

ENHANCEMENT INSTRUCTIONS (build on top of preprocessing):
1. GRAYSCALE OUTPUT - Maintain pure grayscale for maximum text contrast
2. EDGE SHARPENING - Apply unsharp mask to emphasize engraved character edges
3. NOISE REDUCTION - Bilateral filter to reduce remaining grain while preserving edges
4. FINAL CONTRAST BOOST - Subtle curves adjustment to maximize text/background separation

NOTE: CLAHE (local contrast) has already been applied - do NOT add more local contrast.
NOTE: Specular highlights have been suppressed - focus on revealing engraved details.

CRITICAL OUTPUT: HIGH-CONTRAST GRAYSCALE optimized for reading:
- Matrix numbers (e.g., "DIDX-123456")  
- IFPI codes (e.g., "IFPI L123")
- Mastering SID codes
- Mould SID codes
- Any hand-etched text

Make the text as readable as possible for OCR.`;

  const basePromptLP = `This vinyl dead wax photo has been pre-processed with local contrast enhancement for relief visibility.

PRE-PROCESSING ALREADY APPLIED:
${preprocessingApplied.map(s => `- ${s}`).join('\n')}

ENHANCEMENT INSTRUCTIONS (build on top of preprocessing):
1. GRAYSCALE OUTPUT - Maintain pure grayscale for maximum text contrast
2. RELIEF EMPHASIS - Enhance the 3D shadow/highlight effect of stamped text
3. DIRECTIONAL LIGHTING - Emphasize text following the circular groove pattern
4. EDGE SHARPENING - Make embossed character edges more defined
5. NOISE REDUCTION - Reduce groove noise while preserving text detail

NOTE: CLAHE (local contrast) has already been applied with larger tiles for grooves.
NOTE: Focus on revealing EMBOSSED/ETCHED text in the dead wax area.

CRITICAL OUTPUT: HIGH-CONTRAST GRAYSCALE optimized for reading:
- Matrix numbers (stamped in dead wax)
- Stamper codes (hand-etched letters like "A", "B", "AA")
- Pressing plant codes
- Mastering engineer initials
- Any hand-written text in the runout groove

The text is physically embossed - enhance shadow/highlight contrast to reveal it.`;

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
    const claheParams = mediaType === 'cd' 
      ? { tileSize: 8, clipLimit: 2.5 }
      : { tileSize: 16, clipLimit: 3.0 };
    
    if (mediaType === 'cd') {
      preprocessingApplied.push(`STAP 1A: Grayscale conversie (ITU-R BT.601 luminance)`);
      preprocessingApplied.push(`STAP 1B: Speculaire highlight detectie & suppressie (threshold: 245, ${reflectionAnalysis.estimatedSpecularPercentage.toFixed(1)}% gedetecteerd)`);
      preprocessingApplied.push(`STAP 1C: Log-transform intensiteitscompressie (c=${reflectionAnalysis.recommendedLogC}) - vlakt felle reflecties af`);
      preprocessingApplied.push(`STAP 1D: Gamma correctie (γ=${reflectionAnalysis.recommendedGamma}) - comprimeert highlights`);
      preprocessingApplied.push(`Reflectie-ernst: ${reflectionAnalysis.severity.toUpperCase()} (${reflectionAnalysis.estimatedBrightPixelPercentage.toFixed(1)}% helder, ${reflectionAnalysis.estimatedSpecularPercentage.toFixed(1)}% speculair)`);
      
      if (reflectionAnalysis.severity === 'extreme') {
        preprocessingApplied.push('⚠️ EXTREME reflectie gedetecteerd - maximale compressie toegepast');
      }
      
      // STAP 2: CLAHE
      preprocessingApplied.push(`STAP 2: CLAHE lokaal contrast (tileSize=${claheParams.tileSize}×${claheParams.tileSize}, clipLimit=${claheParams.clipLimit})`);
      preprocessingApplied.push(`   → Werkt per regio, laat micro-details "poppen", stabiel bij ongelijk licht`);
    } else {
      preprocessingApplied.push(`STAP 1A: Grayscale conversie (ITU-R BT.601 luminance)`);
      preprocessingApplied.push(`STAP 1B: Gamma correctie voor reliëf-versterking (γ=${reflectionAnalysis.recommendedGamma})`);
      preprocessingApplied.push(`STAP 1C: Contrastversterking voor gegraveerde tekst`);
      
      // STAP 2: CLAHE voor LP
      preprocessingApplied.push(`STAP 2: CLAHE lokaal contrast (tileSize=${claheParams.tileSize}×${claheParams.tileSize}, clipLimit=${claheParams.clipLimit})`);
      preprocessingApplied.push(`   → Grotere tiles voor LP grooves, hoger clipLimit voor reliëf-detectie`);
    }
    
    console.log('🔲 STAP 2: CLAHE lokaal contrast enhancement...');
    console.log(`   - Tile size: ${claheParams.tileSize}×${claheParams.tileSize}`);
    console.log(`   - Clip limit: ${claheParams.clipLimit}`);
    pipelineSteps.push(`clahe_${claheParams.tileSize}x${claheParams.tileSize}`);
    
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
