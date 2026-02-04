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

// ============== EXTREME MATRIX ENHANCEMENT ==============

export interface ExtremeEnhancementResult {
  variants: {
    original: string;
    minChannel: string;
    binarized: string;
  };
  hubDetected: boolean;
  cropApplied: boolean;
  qualityScore: 'excellent' | 'good' | 'fair' | 'poor';
  reflectionLevel: number;
  processingTimeMs: number;
}

/**
 * Detect the CD hub center by finding the darkest circular region
 */
export function detectHubCenter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { cx: number; cy: number; radius: number; detected: boolean } {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Assume center is roughly in the middle of the image
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2;
  
  // Search for the hub hole (darkest region near center)
  let darkestSum = Infinity;
  let bestCx = centerX;
  let bestCy = centerY;
  
  // Sample around the expected center
  const searchRadius = maxRadius * 0.2; // Search within 20% of center
  const step = Math.max(4, Math.floor(searchRadius / 10));
  
  for (let dy = -searchRadius; dy <= searchRadius; dy += step) {
    for (let dx = -searchRadius; dx <= searchRadius; dx += step) {
      const testX = Math.round(centerX + dx);
      const testY = Math.round(centerY + dy);
      
      if (testX < 0 || testX >= width || testY < 0 || testY >= height) continue;
      
      // Sample brightness in a small area around this point
      let sum = 0;
      let count = 0;
      const sampleRadius = 10;
      
      for (let sy = -sampleRadius; sy <= sampleRadius; sy += 2) {
        for (let sx = -sampleRadius; sx <= sampleRadius; sx += 2) {
          const px = testX + sx;
          const py = testY + sy;
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          
          const idx = (py * width + px) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          sum += brightness;
          count++;
        }
      }
      
      const avgBrightness = sum / count;
      if (avgBrightness < darkestSum) {
        darkestSum = avgBrightness;
        bestCx = testX;
        bestCy = testY;
      }
    }
  }
  
  // Estimate hub radius (typically 10-15% of disc radius)
  const hubRadius = maxRadius * 0.12;
  const detected = darkestSum < 100; // Hub should be quite dark
  
  console.log(`🔍 Hub detection: center=(${bestCx}, ${bestCy}), darkness=${darkestSum.toFixed(0)}, detected=${detected}`);
  
  return { cx: bestCx, cy: bestCy, radius: hubRadius, detected };
}

/**
 * Crop the image to the matrix ring area (15-40% of radius from center)
 */
export function cropToMatrixRing(
  sourceCanvas: HTMLCanvasElement,
  hubCenter: { cx: number; cy: number; radius: number }
): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const { cx, cy } = hubCenter;
  
  // Calculate the ring boundaries
  const maxRadius = Math.min(width, height) / 2;
  const innerRadius = maxRadius * 0.12; // Start just outside hub
  const outerRadius = maxRadius * 0.45; // End before outer edge
  
  // Create a square canvas for the ring crop
  const ringSize = Math.ceil(outerRadius * 2);
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = ringSize;
  cropCanvas.height = ringSize;
  const cropCtx = cropCanvas.getContext('2d')!;
  
  // Draw the cropped region centered on the hub
  const sourceX = Math.max(0, cx - outerRadius);
  const sourceY = Math.max(0, cy - outerRadius);
  const sourceW = Math.min(ringSize, width - sourceX);
  const sourceH = Math.min(ringSize, height - sourceY);
  
  cropCtx.drawImage(
    sourceCanvas,
    sourceX, sourceY, sourceW, sourceH,
    0, 0, sourceW, sourceH
  );
  
  console.log(`✂️ Cropped to matrix ring: ${ringSize}x${ringSize}px`);
  
  return cropCanvas;
}

/**
 * Adaptive binarization using local thresholding
 * Makes faint engravings visible by converting to high-contrast black/white
 */
export function adaptiveBinarize(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  blockSize: number = 32,
  C: number = 12
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // First convert to grayscale and calculate local means
  const grayscale = new Float32Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Weighted grayscale
      grayscale[y * width + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
  }
  
  // Calculate integral image for fast local mean computation
  const integral = new Float32Array((width + 1) * (height + 1));
  
  for (let y = 1; y <= height; y++) {
    let rowSum = 0;
    for (let x = 1; x <= width; x++) {
      rowSum += grayscale[(y - 1) * width + (x - 1)];
      integral[y * (width + 1) + x] = integral[(y - 1) * (width + 1) + x] + rowSum;
    }
  }
  
  // Apply adaptive threshold
  const halfBlock = Math.floor(blockSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate local region bounds
      const x1 = Math.max(0, x - halfBlock);
      const y1 = Math.max(0, y - halfBlock);
      const x2 = Math.min(width - 1, x + halfBlock);
      const y2 = Math.min(height - 1, y + halfBlock);
      
      const area = (x2 - x1 + 1) * (y2 - y1 + 1);
      
      // Get sum from integral image
      const sum = integral[(y2 + 1) * (width + 1) + (x2 + 1)]
                - integral[y1 * (width + 1) + (x2 + 1)]
                - integral[(y2 + 1) * (width + 1) + x1]
                + integral[y1 * (width + 1) + x1];
      
      const localMean = sum / area;
      const threshold = localMean - C;
      
      const idx = (y * width + x) * 4;
      const pixelValue = grayscale[y * width + x];
      
      // Binarize: pixel > threshold = white, else black
      const output = pixelValue > threshold ? 255 : 0;
      data[idx] = output;
      data[idx + 1] = output;
      data[idx + 2] = output;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  console.log(`⚫⚪ Adaptive binarization applied (block=${blockSize}, C=${C})`);
}

/**
 * Aggressive min-channel filter for extreme reflections
 */
function applyAggressiveMinChannel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  boostFactor: number = 1.8,
  gamma: number = 0.7
): { avgColorVariation: number } {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  
  let totalColorVariation = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate color variation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const colorVariation = max - min;
      totalColorVariation += colorVariation;
      
      // Take minimum channel (suppresses colored reflections)
      let enhanced = min * boostFactor;
      
      // Apply gamma correction for dark areas
      enhanced = Math.pow(enhanced / 255, gamma) * 255;
      
      // Distance-based boost (more enhancement near center)
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const centerFactor = 1 + 0.3 * (1 - dist / maxDist);
      enhanced *= centerFactor;
      
      // Clamp
      enhanced = Math.min(255, Math.max(0, Math.round(enhanced)));
      
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  return { avgColorVariation: totalColorVariation / (width * height) };
}

/**
 * Full extreme matrix enhancement pipeline
 * Creates 3 variants for multi-variant AI analysis
 */
export async function extremeMatrixEnhancement(
  imageInput: File | string,
  options: {
    autoCrop?: boolean;
    blockSize?: number;
    binarizeC?: number;
    quality?: number;
  } = {}
): Promise<ExtremeEnhancementResult> {
  const startTime = performance.now();
  const {
    autoCrop = true,
    blockSize = 32,
    binarizeC = 12,
    quality = 0.85
  } = options;
  
  // Load image
  const img = await loadImageForExtreme(imageInput);
  
  // Create main canvas
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(img.width, 1800);
  canvas.height = Math.min(img.height, 1800);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  // Step 1: Detect hub and optionally crop
  let workCanvas = canvas;
  let hubDetected = false;
  let cropApplied = false;
  
  if (autoCrop) {
    const hubCenter = detectHubCenter(ctx, canvas.width, canvas.height);
    hubDetected = hubCenter.detected;
    
    if (hubDetected) {
      workCanvas = cropToMatrixRing(canvas, hubCenter);
      cropApplied = true;
    }
  }
  
  // Get working context
  const workCtx = workCanvas.getContext('2d')!;
  const workWidth = workCanvas.width;
  const workHeight = workCanvas.height;
  
  // Variant 1: Original (possibly cropped)
  const originalVariant = workCanvas.toDataURL('image/jpeg', quality);
  
  // Assess quality before processing
  const qualityAssessment = assessImageQuality(workCtx.getImageData(0, 0, workWidth, workHeight));
  
  // Variant 2: Aggressive min-channel
  const minChannelCanvas = document.createElement('canvas');
  minChannelCanvas.width = workWidth;
  minChannelCanvas.height = workHeight;
  const minChannelCtx = minChannelCanvas.getContext('2d')!;
  minChannelCtx.drawImage(workCanvas, 0, 0);
  
  const { avgColorVariation } = applyAggressiveMinChannel(minChannelCtx, workWidth, workHeight, 1.8, 0.7);
  const minChannelVariant = minChannelCanvas.toDataURL('image/jpeg', quality);
  
  // Variant 3: Binarized (from min-channel base)
  const binarizedCanvas = document.createElement('canvas');
  binarizedCanvas.width = workWidth;
  binarizedCanvas.height = workHeight;
  const binarizedCtx = binarizedCanvas.getContext('2d')!;
  binarizedCtx.drawImage(minChannelCanvas, 0, 0);
  
  adaptiveBinarize(binarizedCtx, workWidth, workHeight, blockSize, binarizeC);
  const binarizedVariant = binarizedCanvas.toDataURL('image/png', 1.0); // PNG for crisp B/W
  
  const processingTimeMs = performance.now() - startTime;
  
  // Determine quality score
  let qualityScore: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  if (!qualityAssessment.isAcceptable) {
    qualityScore = qualityAssessment.brightness < 0.2 ? 'poor' : 'fair';
  } else if (avgColorVariation < 20) {
    qualityScore = 'excellent';
  } else if (avgColorVariation > 50) {
    qualityScore = 'fair';
  }
  
  console.log(`🚀 Extreme enhancement complete: ${processingTimeMs.toFixed(0)}ms`);
  console.log(`   Hub: ${hubDetected}, Crop: ${cropApplied}, Quality: ${qualityScore}, Reflections: ${avgColorVariation.toFixed(1)}`);
  
  return {
    variants: {
      original: originalVariant,
      minChannel: minChannelVariant,
      binarized: binarizedVariant
    },
    hubDetected,
    cropApplied,
    qualityScore,
    reflectionLevel: avgColorVariation,
    processingTimeMs
  };
}

// Helper to load image for extreme processing
async function loadImageForExtreme(input: File | string): Promise<HTMLImageElement> {
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
