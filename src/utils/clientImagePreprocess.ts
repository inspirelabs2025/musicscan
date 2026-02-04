/**
 * Client-side lightweight image preprocessing
 * 
 * Architecture:
 * - Client: light preprocessing + preview feedback (fast, <100ms)
 * - Server: heavy enhancement + stacking + OCR + Discogs matching
 * 
 * Client handles:
 * - Basic contrast adjustment
 * - Resize for faster upload
 * - Quick preview generation
 * - Orientation correction
 */

export interface ClientPreprocessResult {
  /** Processed image as base64 data URL */
  processedImage: string;
  /** Original image for comparison */
  originalImage: string;
  /** Processing stats */
  stats: {
    originalSize: number;
    processedSize: number;
    processingTimeMs: number;
    wasResized: boolean;
    contrastApplied: boolean;
  };
}

export interface PreprocessOptions {
  /** Max dimension for resize (default: 1600) */
  maxDimension?: number;
  /** Apply light contrast enhancement (default: true) */
  applyContrast?: boolean;
  /** Target JPEG quality (default: 0.85) */
  quality?: number;
}

const DEFAULT_OPTIONS: Required<PreprocessOptions> = {
  maxDimension: 1600,
  applyContrast: true,
  quality: 0.85,
};

/**
 * Lightweight client-side preprocessing for quick preview
 * Heavy processing (stacking, OCR) happens on server
 */
export async function preprocessImageClient(
  imageInput: File | string,
  options: PreprocessOptions = {}
): Promise<ClientPreprocessResult> {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Load image
  const img = await loadImage(imageInput);
  const originalSize = imageInput instanceof File ? imageInput.size : 0;
  
  // Create canvas
  const { canvas, ctx, wasResized } = createOptimizedCanvas(img, opts.maxDimension);
  
  // Draw original
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  // Get original for comparison
  const originalImage = canvas.toDataURL('image/jpeg', opts.quality);
  
  // Apply light contrast if enabled
  let contrastApplied = false;
  if (opts.applyContrast) {
    applyLightContrast(ctx, canvas.width, canvas.height);
    contrastApplied = true;
  }
  
  // Export processed image
  const processedImage = canvas.toDataURL('image/jpeg', opts.quality);
  
  const processingTimeMs = performance.now() - startTime;
  
  console.log(`📸 Client preprocessing: ${processingTimeMs.toFixed(0)}ms, resized: ${wasResized}, contrast: ${contrastApplied}`);
  
  return {
    processedImage,
    originalImage,
    stats: {
      originalSize,
      processedSize: Math.round(processedImage.length * 0.75), // Base64 overhead
      processingTimeMs,
      wasResized,
      contrastApplied,
    },
  };
}

/**
 * Batch preprocess multiple images
 */
export async function preprocessImagesClient(
  images: (File | string)[],
  options: PreprocessOptions = {}
): Promise<{
  results: ClientPreprocessResult[];
  totalTimeMs: number;
}> {
  const startTime = performance.now();
  
  // Process in parallel for speed
  const results = await Promise.all(
    images.map(img => preprocessImageClient(img, options))
  );
  
  const totalTimeMs = performance.now() - startTime;
  console.log(`📸 Batch client preprocessing: ${results.length} images in ${totalTimeMs.toFixed(0)}ms`);
  
  return { results, totalTimeMs };
}

// ============== Helper Functions ==============

async function loadImage(input: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (input instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(input);
    } else {
      img.src = input;
    }
  });
}

function createOptimizedCanvas(
  img: HTMLImageElement,
  maxDimension: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; wasResized: boolean } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  let { width, height } = img;
  let wasResized = false;
  
  // Resize if too large
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    wasResized = true;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  return { canvas, ctx, wasResized };
}

/**
 * Light contrast enhancement - fast and subtle
 * Heavy enhancement happens on server with multi-shot stacking
 */
function applyLightContrast(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate histogram for auto-levels
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const luminance = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[luminance]++;
  }
  
  // Find 1% and 99% percentiles for auto-levels
  const totalPixels = width * height;
  const lowThreshold = totalPixels * 0.01;
  const highThreshold = totalPixels * 0.99;
  
  let low = 0, high = 255;
  let cumulative = 0;
  
  for (let i = 0; i < 256; i++) {
    cumulative += histogram[i];
    if (cumulative >= lowThreshold && low === 0) low = i;
    if (cumulative >= highThreshold) {
      high = i;
      break;
    }
  }
  
  // Clamp to reasonable range
  low = Math.max(0, Math.min(50, low));
  high = Math.max(200, Math.min(255, high));
  
  // Apply subtle auto-levels
  const range = high - low || 1;
  const factor = 255 / range;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, (data[i] - low) * factor));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - low) * factor));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - low) * factor));
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// ============== CD Matrix Specific Filters ==============

/**
 * CD-specifieke preprocessing voor matrix nummer herkenning
 * 
 * Strategie: Min-channel filter
 * - Regenboog reflecties variëren sterk per RGB kanaal
 * - Gegraveerde tekst is uniform grijs (alle kanalen gelijk)
 * - Door het MINIMUM te nemen van R/G/B onderdrukken we kleurrijke reflecties
 * 
 * @param ctx - Canvas context met de afbeelding
 * @param width - Breedte van de afbeelding
 * @param height - Hoogte van de afbeelding
 * @param options - Optionele instellingen voor de filter
 */
export function preprocessCDMatrix(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    /** Boost factor voor het minimum kanaal (default: 1.3) */
    boostFactor?: number;
    /** Extra lokale contrast in hub-gebied (default: true) */
    enhanceHubArea?: boolean;
    /** Hub radius als fractie van kleinste dimensie (default: 0.35) */
    hubRadiusFraction?: number;
  } = {}
): {
  /** Aantal pixels waar reflectie werd gedetecteerd en onderdrukt */
  reflectionPixelsFiltered: number;
  /** Gemiddelde kleurvariatie (hogere waarde = meer reflectie) */
  avgColorVariation: number;
  /** Processing tijd in ms */
  processingTimeMs: number;
} {
  const startTime = performance.now();
  const {
    boostFactor = 1.3,
    enhanceHubArea = true,
    hubRadiusFraction = 0.35
  } = options;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate center and hub radius for optional hub enhancement
  const centerX = width / 2;
  const centerY = height / 2;
  const hubRadius = Math.min(width, height) * hubRadiusFraction;
  
  let reflectionPixelsFiltered = 0;
  let totalColorVariation = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate color variation (indicator of reflection)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const colorVariation = max - min;
      totalColorVariation += colorVariation;
      
      // Min-channel filter: neem het minimum van R/G/B
      // Dit onderdrukt kleurrijke reflecties (die sterk zijn in 1-2 kanalen)
      // terwijl grijze tekst (uniform in alle kanalen) behouden blijft
      let enhanced = min * boostFactor;
      
      // Check if this pixel had significant color variation (reflection)
      if (colorVariation > 30) {
        reflectionPixelsFiltered++;
      }
      
      // Optional: Extra enhancement in hub area (where matrix codes are)
      if (enhanceHubArea) {
        const distFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        
        // If in hub area, apply extra local contrast
        if (distFromCenter < hubRadius) {
          // Contrast stretch factor increases toward center
          const hubFactor = 1 + 0.2 * (1 - distFromCenter / hubRadius);
          enhanced = enhanced * hubFactor;
        }
      }
      
      // Clamp to valid range
      enhanced = Math.min(255, Math.max(0, Math.round(enhanced)));
      
      // Set all channels to the enhanced grayscale value
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
      // Alpha channel unchanged
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  const processingTimeMs = performance.now() - startTime;
  const avgColorVariation = totalColorVariation / (width * height);
  
  console.log(`🔵 CD Matrix preprocessing: ${processingTimeMs.toFixed(0)}ms`);
  console.log(`   - Reflectie pixels gefilterd: ${reflectionPixelsFiltered}`);
  console.log(`   - Gem. kleurvariatie: ${avgColorVariation.toFixed(1)}`);
  
  return {
    reflectionPixelsFiltered,
    avgColorVariation,
    processingTimeMs
  };
}

/**
 * Volledige CD preprocessing pipeline
 * Combineert basis preprocessing met CD-specifieke matrix filtering
 */
export async function preprocessCDImageClient(
  imageInput: File | string,
  options: PreprocessOptions & {
    /** Apply CD-specific matrix filter (default: true) */
    applyCDMatrixFilter?: boolean;
  } = {}
): Promise<ClientPreprocessResult & {
  cdFilterStats?: {
    reflectionPixelsFiltered: number;
    avgColorVariation: number;
  };
}> {
  const startTime = performance.now();
  const {
    maxDimension = 1600,
    applyContrast = true,
    quality = 0.85,
    applyCDMatrixFilter = true
  } = options;
  
  // Load image
  const img = await loadImage(imageInput);
  const originalSize = imageInput instanceof File ? imageInput.size : 0;
  
  // Create canvas
  const { canvas, ctx, wasResized } = createOptimizedCanvas(img, maxDimension);
  
  // Draw original
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  // Get original for comparison
  const originalImage = canvas.toDataURL('image/jpeg', quality);
  
  // Apply CD matrix filter if enabled
  let cdFilterStats;
  if (applyCDMatrixFilter) {
    cdFilterStats = preprocessCDMatrix(ctx, canvas.width, canvas.height);
  }
  
  // Apply light contrast on top if enabled
  let contrastApplied = false;
  if (applyContrast) {
    applyLightContrast(ctx, canvas.width, canvas.height);
    contrastApplied = true;
  }
  
  // Export processed image
  const processedImage = canvas.toDataURL('image/jpeg', quality);
  
  const processingTimeMs = performance.now() - startTime;
  
  console.log(`📸 CD preprocessing complete: ${processingTimeMs.toFixed(0)}ms`);
  
  return {
    processedImage,
    originalImage,
    stats: {
      originalSize,
      processedSize: Math.round(processedImage.length * 0.75),
      processingTimeMs,
      wasResized,
      contrastApplied,
    },
    cdFilterStats: cdFilterStats ? {
      reflectionPixelsFiltered: cdFilterStats.reflectionPixelsFiltered,
      avgColorVariation: cdFilterStats.avgColorVariation
    } : undefined
  };
}

/**
 * Quick quality check for preview feedback
 */
export function assessImageQuality(imageData: ImageData): {
  brightness: number;
  contrast: number;
  sharpness: number;
  isAcceptable: boolean;
  feedback: string;
} {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Calculate brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const brightness = totalBrightness / (width * height) / 255;
  
  // Calculate contrast (standard deviation of luminance)
  const mean = brightness * 255;
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    variance += (lum - mean) ** 2;
  }
  const contrast = Math.sqrt(variance / (width * height)) / 128;
  
  // Estimate sharpness using Laplacian
  let sharpness = 0;
  const step = 4; // Sample every 4th pixel for speed
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const center = data[idx];
      const left = data[idx - 4];
      const right = data[idx + 4];
      const top = data[idx - width * 4];
      const bottom = data[idx + width * 4];
      
      const laplacian = Math.abs(4 * center - left - right - top - bottom);
      sharpness += laplacian;
    }
  }
  sharpness = sharpness / ((width / step) * (height / step)) / 255;
  
  // Assess quality
  const isAcceptable = brightness > 0.15 && brightness < 0.85 && contrast > 0.1 && sharpness > 0.02;
  
  let feedback = '';
  if (brightness < 0.15) feedback = '⚠️ Te donker - gebruik meer licht';
  else if (brightness > 0.85) feedback = '⚠️ Te licht - verminder belichting';
  else if (contrast < 0.1) feedback = '⚠️ Te weinig contrast - probeer schuine belichting';
  else if (sharpness < 0.02) feedback = '⚠️ Onscherp - houd camera stabiel';
  else feedback = '✓ Goede kwaliteit';
  
  return { brightness, contrast, sharpness, isAcceptable, feedback };
}
