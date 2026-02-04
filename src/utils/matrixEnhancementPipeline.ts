/**
 * CD Matrix Enhancement Pipeline
 * 
 * Advanced image processing for extracting matrix codes from CDs.
 * Handles rainbow reflections, low contrast engravings, and specular glare.
 */

export interface MatrixEnhancementParams {
  claheClipLimit: number;      // 1-5, default 2.0
  claheTileSize: number;       // 8, 16, 24, default 16
  highlightStrength: number;   // 0-100, default 50
  unsharpRadius: number;       // 0.3-1.2, default 0.7
  unsharpAmount: number;       // 0-2, default 1.0
  adaptiveBlockSize: number;   // 11-51 odd, default 31
  adaptiveC: number;           // -10 to +10, default 5
}

export const DEFAULT_PARAMS: MatrixEnhancementParams = {
  claheClipLimit: 2.0,
  claheTileSize: 16,
  highlightStrength: 50,
  unsharpRadius: 0.7,
  unsharpAmount: 1.0,
  adaptiveBlockSize: 31,
  adaptiveC: 5,
};

export interface MatrixProcessingResult {
  enhancedPreview: string;
  ocrLayer: string;
  ocrLayerInverted: string;
  zoomedRing: string;           // Zoomed crop of the matrix ring area (outer - for catalog/matrix)
  zoomedRingEnhanced: string;   // Enhanced version of zoomed ring
  zoomedIfpiRing: string;       // Zoomed crop of inner ring area (for IFPI codes)
  zoomedIfpiRingEnhanced: string; // Enhanced version of IFPI ring
  superZoomIfpi: string;        // Super-zoomed crop of innermost ring (3-15% radius, 5x zoom)
  superZoomIfpiEnhanced: string; // Enhanced version with embossed-text filters
  roi: RingDetectionResult | null;
  processingTimeMs: number;
  params: MatrixEnhancementParams;
  quality: QualityAssessment;
}

export interface RingDetectionResult {
  detected: boolean;
  center: { x: number; y: number };
  innerRadius: number;
  outerRadius: number;
  confidence: number;
  method: 'hub' | 'edge' | 'gradient' | 'fallback';
}

export interface QualityAssessment {
  brightness: number;
  contrast: number;
  sharpness: number;
  reflectionLevel: number;
  score: 'excellent' | 'good' | 'fair' | 'poor';
  feedback: string;
}

// ============== MAIN PIPELINE ==============

/**
 * Process a CD matrix image through the full enhancement pipeline
 */
export async function processMatrixImage(
  input: File | string,
  params: Partial<MatrixEnhancementParams> = {}
): Promise<MatrixProcessingResult> {
  const startTime = performance.now();
  const fullParams = { ...DEFAULT_PARAMS, ...params };
  
  // Load image
  const img = await loadImage(input);
  
  // Create working canvas
  const maxDim = 1800;
  let width = img.width;
  let height = img.height;
  
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  
  // Step 1: Detect ring (optional ROI)
  const roi = detectMatrixRing(ctx, width, height);
  
  // Create enhanced canvas (grayscale path)
  const enhancedCanvas = document.createElement('canvas');
  enhancedCanvas.width = width;
  enhancedCanvas.height = height;
  const enhancedCtx = enhancedCanvas.getContext('2d')!;
  enhancedCtx.drawImage(canvas, 0, 0);
  
  // Step 2: Convert to luminance-weighted grayscale
  applyLuminanceGrayscale(enhancedCtx, width, height);
  
  // Step 3: Highlight suppression
  applyHighlightSuppression(enhancedCtx, width, height, fullParams.highlightStrength);
  
  // Step 4: CLAHE (Contrast Limited Adaptive Histogram Equalization)
  applyCLAHE(enhancedCtx, width, height, {
    clipLimit: fullParams.claheClipLimit,
    tileSize: fullParams.claheTileSize
  });
  
  // Step 5: Bilateral-like denoise
  applyBilateralDenoise(enhancedCtx, width, height);
  
  // Step 6: Unsharp mask
  applyUnsharpMask(enhancedCtx, width, height, {
    radius: fullParams.unsharpRadius,
    amount: fullParams.unsharpAmount
  });
  
  // Step 7: Radial gradient removal
  removeRadialGradient(enhancedCtx, width, height);
  
  // Assess quality before creating OCR layer
  const quality = assessQuality(enhancedCtx.getImageData(0, 0, width, height));
  
  // Export enhanced preview
  const enhancedPreview = enhancedCanvas.toDataURL('image/jpeg', 0.9);
  
  // Step 8: Create OCR layer (adaptive threshold)
  const ocrCanvas = document.createElement('canvas');
  ocrCanvas.width = width;
  ocrCanvas.height = height;
  const ocrCtx = ocrCanvas.getContext('2d')!;
  ocrCtx.drawImage(enhancedCanvas, 0, 0);
  
  applyGaussianAdaptiveThreshold(ocrCtx, width, height, {
    blockSize: fullParams.adaptiveBlockSize,
    C: fullParams.adaptiveC
  });
  
  const ocrLayer = ocrCanvas.toDataURL('image/png', 1.0);
  
  // Create inverted OCR layer
  const ocrInvertedCanvas = document.createElement('canvas');
  ocrInvertedCanvas.width = width;
  ocrInvertedCanvas.height = height;
  const ocrInvertedCtx = ocrInvertedCanvas.getContext('2d')!;
  ocrInvertedCtx.drawImage(ocrCanvas, 0, 0);
  invertImage(ocrInvertedCtx, width, height);
  
  const ocrLayerInverted = ocrInvertedCanvas.toDataURL('image/png', 1.0);
  
  // Step 9: Create zoomed ring crop (focus on matrix text area - outer ring)
  const { zoomedRing, zoomedRingEnhanced } = createZoomedRingCrop(
    canvas, enhancedCanvas, roi, width, height
  );
  
  // Step 10: Create zoomed IFPI ring crop (inner ring closer to center hole)
  const { zoomedIfpiRing, zoomedIfpiRingEnhanced } = createZoomedIfpiRingCrop(
    canvas, enhancedCanvas, roi, width, height
  );
  
  // Step 11: Create super-zoom IFPI crop (innermost ring, 5x zoom for tiny embossed text)
  const { superZoomIfpi, superZoomIfpiEnhanced } = createSuperZoomIfpiCrop(
    canvas, enhancedCanvas, roi, width, height
  );
  
  const processingTimeMs = performance.now() - startTime;
  
  console.log(`🔬 Matrix enhancement complete: ${processingTimeMs.toFixed(0)}ms, quality: ${quality.score}`);
  
  return {
    enhancedPreview,
    ocrLayer,
    ocrLayerInverted,
    zoomedRing,
    zoomedRingEnhanced,
    zoomedIfpiRing,
    zoomedIfpiRingEnhanced,
    superZoomIfpi,
    superZoomIfpiEnhanced,
    roi,
    processingTimeMs,
    params: fullParams,
    quality
  };
}

/**
 * Create a zoomed crop of the matrix ring area
 * This focuses on the dark ring between the center hole and the rainbow data area
 */
function createZoomedRingCrop(
  originalCanvas: HTMLCanvasElement,
  enhancedCanvas: HTMLCanvasElement,
  roi: RingDetectionResult | null,
  width: number,
  height: number
): { zoomedRing: string; zoomedRingEnhanced: string } {
  // Calculate crop region - the matrix text ring
  const centerX = roi?.center.x ?? width / 2;
  const centerY = roi?.center.y ?? height / 2;
  
  // Matrix text is typically in a ring between 8-22% of image size from center
  // Just outside the center hole, before the rainbow data area
  const minSize = Math.min(width, height);
  const outerRadius = minSize * 0.25;  // Capture the matrix ring area
  
  // Create a crop that captures this ring area
  const cropSize = outerRadius * 2.2;
  const cropX = Math.max(0, centerX - cropSize / 2);
  const cropY = Math.max(0, centerY - cropSize / 2);
  const actualCropWidth = Math.min(cropSize, width - cropX);
  const actualCropHeight = Math.min(cropSize, height - cropY);
  
  // Create zoomed canvas at higher resolution for better OCR
  const zoomFactor = 2.5;
  const zoomedWidth = Math.round(actualCropWidth * zoomFactor);
  const zoomedHeight = Math.round(actualCropHeight * zoomFactor);
  
  // Create zoomed original
  const zoomedCanvas = document.createElement('canvas');
  zoomedCanvas.width = zoomedWidth;
  zoomedCanvas.height = zoomedHeight;
  const zoomedCtx = zoomedCanvas.getContext('2d')!;
  
  // Use high-quality interpolation
  zoomedCtx.imageSmoothingEnabled = true;
  zoomedCtx.imageSmoothingQuality = 'high';
  
  // Draw cropped and zoomed region from original
  zoomedCtx.drawImage(
    originalCanvas,
    cropX, cropY, actualCropWidth, actualCropHeight,
    0, 0, zoomedWidth, zoomedHeight
  );
  
  const zoomedRing = zoomedCanvas.toDataURL('image/jpeg', 0.95);
  
  // Create zoomed enhanced version
  const zoomedEnhancedCanvas = document.createElement('canvas');
  zoomedEnhancedCanvas.width = zoomedWidth;
  zoomedEnhancedCanvas.height = zoomedHeight;
  const zoomedEnhancedCtx = zoomedEnhancedCanvas.getContext('2d')!;
  
  zoomedEnhancedCtx.imageSmoothingEnabled = true;
  zoomedEnhancedCtx.imageSmoothingQuality = 'high';
  
  // Draw cropped and zoomed region from enhanced
  zoomedEnhancedCtx.drawImage(
    enhancedCanvas,
    cropX, cropY, actualCropWidth, actualCropHeight,
    0, 0, zoomedWidth, zoomedHeight
  );
  
  // Apply additional sharpening to zoomed version
  applyUnsharpMask(zoomedEnhancedCtx, zoomedWidth, zoomedHeight, {
    radius: 0.5,
    amount: 1.2,
    threshold: 2
  });
  
  const zoomedRingEnhanced = zoomedEnhancedCanvas.toDataURL('image/jpeg', 0.95);
  
  console.log(`🔍 Zoomed ring crop: ${zoomedWidth}x${zoomedHeight} from region (${Math.round(cropX)},${Math.round(cropY)}) size ${Math.round(actualCropWidth)}x${Math.round(actualCropHeight)}`);
  
  return { zoomedRing, zoomedRingEnhanced };
}

/**
 * Create a zoomed crop of the IFPI ring area (inner ring, closer to center hole)
 * IFPI codes are typically located between the center hole and the matrix text
 */
function createZoomedIfpiRingCrop(
  originalCanvas: HTMLCanvasElement,
  enhancedCanvas: HTMLCanvasElement,
  roi: RingDetectionResult | null,
  width: number,
  height: number
): { zoomedIfpiRing: string; zoomedIfpiRingEnhanced: string } {
  const centerX = roi?.center.x ?? width / 2;
  const centerY = roi?.center.y ?? height / 2;
  
  const minSize = Math.min(width, height);
  
  // IFPI codes can be in the inner/middle ring area - typically between mirror band and matrix
  // Mould SID (IFPI L-xxx) is often stamped in the mirror band at 10-25% from center
  // Mastering SID (IFPI xxxx) can be anywhere between 15-40% from center
  const innerRadius = minSize * 0.08;  // Start just outside center hole/mirror band
  const outerRadius = minSize * 0.40;  // Extend into the area before outer matrix codes
  
  // Create a larger crop to capture the full IFPI zone
  const cropSize = outerRadius * 2.0;
  const cropX = Math.max(0, centerX - cropSize / 2);
  const cropY = Math.max(0, centerY - cropSize / 2);
  const actualCropWidth = Math.min(cropSize, width - cropX);
  const actualCropHeight = Math.min(cropSize, height - cropY);
  
  // Higher zoom for tiny IFPI text
  const zoomFactor = 3.0;
  const zoomedWidth = Math.round(actualCropWidth * zoomFactor);
  const zoomedHeight = Math.round(actualCropHeight * zoomFactor);
  
  // Create zoomed original
  const zoomedCanvas = document.createElement('canvas');
  zoomedCanvas.width = zoomedWidth;
  zoomedCanvas.height = zoomedHeight;
  const zoomedCtx = zoomedCanvas.getContext('2d')!;
  
  zoomedCtx.imageSmoothingEnabled = true;
  zoomedCtx.imageSmoothingQuality = 'high';
  
  zoomedCtx.drawImage(
    originalCanvas,
    cropX, cropY, actualCropWidth, actualCropHeight,
    0, 0, zoomedWidth, zoomedHeight
  );
  
  const zoomedIfpiRing = zoomedCanvas.toDataURL('image/jpeg', 0.95);
  
  // Create zoomed enhanced version
  const zoomedEnhancedCanvas = document.createElement('canvas');
  zoomedEnhancedCanvas.width = zoomedWidth;
  zoomedEnhancedCanvas.height = zoomedHeight;
  const zoomedEnhancedCtx = zoomedEnhancedCanvas.getContext('2d')!;
  
  zoomedEnhancedCtx.imageSmoothingEnabled = true;
  zoomedEnhancedCtx.imageSmoothingQuality = 'high';
  
  zoomedEnhancedCtx.drawImage(
    enhancedCanvas,
    cropX, cropY, actualCropWidth, actualCropHeight,
    0, 0, zoomedWidth, zoomedHeight
  );
  
  // Extra sharpening for tiny IFPI text
  applyUnsharpMask(zoomedEnhancedCtx, zoomedWidth, zoomedHeight, {
    radius: 0.4,
    amount: 1.5,
    threshold: 1
  });
  
  const zoomedIfpiRingEnhanced = zoomedEnhancedCanvas.toDataURL('image/jpeg', 0.95);
  
  console.log(`🔍 Zoomed IFPI ring crop: ${zoomedWidth}x${zoomedHeight} (radius 8-40% for IFPI/SID codes)`);
  
  return { zoomedIfpiRing, zoomedIfpiRingEnhanced };
}

/**
 * Create a SUPER-ZOOMED crop of the innermost IFPI ring area
 * This targets the tiny embossed/stamped IFPI codes near the center hole
 * 
 * Parameters optimized for tiny text:
 * - Inner radius: 3% (very close to center hole)
 * - Outer radius: 15% (only the innermost ring)
 * - Zoom factor: 5.0x (aggressive magnification)
 * - Enhanced contrast for embossed/stamped text
 */
function createSuperZoomIfpiCrop(
  originalCanvas: HTMLCanvasElement,
  enhancedCanvas: HTMLCanvasElement,
  roi: RingDetectionResult | null,
  width: number,
  height: number
): { superZoomIfpi: string; superZoomIfpiEnhanced: string } {
  const centerX = roi?.center.x ?? width / 2;
  const centerY = roi?.center.y ?? height / 2;
  
  const minSize = Math.min(width, height);
  
  // Super-focused on the innermost ring where IFPI mould SID codes are located
  // This is the "mirror band" area just outside the center hole
  const innerRadius = minSize * 0.03;  // Very close to center (3%)
  const outerRadius = minSize * 0.15;  // Only innermost ring (15%)
  
  // Create a tight crop around this narrow zone
  const cropSize = outerRadius * 2.2;
  const cropX = Math.max(0, centerX - cropSize / 2);
  const cropY = Math.max(0, centerY - cropSize / 2);
  const actualCropWidth = Math.min(cropSize, width - cropX);
  const actualCropHeight = Math.min(cropSize, height - cropY);
  
  // Very high zoom for tiny text (5x)
  const zoomFactor = 5.0;
  const zoomedWidth = Math.round(actualCropWidth * zoomFactor);
  const zoomedHeight = Math.round(actualCropHeight * zoomFactor);
  
  // Create zoomed original
  const zoomedCanvas = document.createElement('canvas');
  zoomedCanvas.width = zoomedWidth;
  zoomedCanvas.height = zoomedHeight;
  const zoomedCtx = zoomedCanvas.getContext('2d')!;
  
  zoomedCtx.imageSmoothingEnabled = true;
  zoomedCtx.imageSmoothingQuality = 'high';
  
  zoomedCtx.drawImage(
    originalCanvas,
    cropX, cropY, actualCropWidth, actualCropHeight,
    0, 0, zoomedWidth, zoomedHeight
  );
  
  const superZoomIfpi = zoomedCanvas.toDataURL('image/jpeg', 0.95);
  
  // Create super-enhanced version for embossed text detection
  const zoomedEnhancedCanvas = document.createElement('canvas');
  zoomedEnhancedCanvas.width = zoomedWidth;
  zoomedEnhancedCanvas.height = zoomedHeight;
  const zoomedEnhancedCtx = zoomedEnhancedCanvas.getContext('2d')!;
  
  zoomedEnhancedCtx.imageSmoothingEnabled = true;
  zoomedEnhancedCtx.imageSmoothingQuality = 'high';
  
  zoomedEnhancedCtx.drawImage(
    enhancedCanvas,
    cropX, cropY, actualCropWidth, actualCropHeight,
    0, 0, zoomedWidth, zoomedHeight
  );
  
  // Apply CLAHE with higher clip limit for embossed text shadows
  applyCLAHE(zoomedEnhancedCtx, zoomedWidth, zoomedHeight, {
    clipLimit: 3.5,  // Higher than normal for maximum local contrast
    tileSize: 8      // Smaller tiles for fine detail
  });
  
  // Apply aggressive sharpening for tiny text
  applyUnsharpMask(zoomedEnhancedCtx, zoomedWidth, zoomedHeight, {
    radius: 0.3,     // Tight radius for small text
    amount: 2.0,     // Strong sharpening
    threshold: 1     // Low threshold to catch faint details
  });
  
  // Apply embossed text shadow enhancement
  applyEmbossedTextEnhancement(zoomedEnhancedCtx, zoomedWidth, zoomedHeight);
  
  const superZoomIfpiEnhanced = zoomedEnhancedCanvas.toDataURL('image/jpeg', 0.95);
  
  console.log(`🔬 Super-zoom IFPI crop: ${zoomedWidth}x${zoomedHeight} (radius 3-15%, 5x zoom for tiny embossed IFPI codes)`);
  
  return { superZoomIfpi, superZoomIfpiEnhanced };
}

/**
 * Enhance embossed/stamped text by amplifying subtle shadows
 * This helps make raised/debossed text more visible
 */
function applyEmbossedTextEnhancement(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Create a copy for edge detection
  const edgeData = new Uint8ClampedArray(data);
  
  // Apply directional Sobel-like operator to detect embossed shadows
  // Embossed text creates directional shadows at consistent angles
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Get surrounding pixel values
      const topLeft = data[((y - 1) * width + (x - 1)) * 4];
      const top = data[((y - 1) * width + x) * 4];
      const topRight = data[((y - 1) * width + (x + 1)) * 4];
      const left = data[(y * width + (x - 1)) * 4];
      const center = data[idx];
      const right = data[(y * width + (x + 1)) * 4];
      const bottomLeft = data[((y + 1) * width + (x - 1)) * 4];
      const bottom = data[((y + 1) * width + x) * 4];
      const bottomRight = data[((y + 1) * width + (x + 1)) * 4];
      
      // Calculate directional gradient (favoring top-left to bottom-right shadows)
      // This is typical for embossed text lit from above
      const gradient = Math.abs(
        (topLeft + 2 * top + topRight) - (bottomLeft + 2 * bottom + bottomRight) +
        (topLeft + 2 * left + bottomLeft) - (topRight + 2 * right + bottomRight)
      ) / 8;
      
      // Enhance edges while preserving midtones
      const enhanced = Math.min(255, center + gradient * 0.5);
      
      edgeData[idx] = enhanced;
      edgeData[idx + 1] = enhanced;
      edgeData[idx + 2] = enhanced;
    }
  }
  
  // Blend edge-enhanced back with original with higher weight on edges
  for (let i = 0; i < data.length; i += 4) {
    const original = data[i];
    const edge = edgeData[i];
    
    // Use edge detection to boost local contrast
    const diff = Math.abs(edge - original);
    const boost = diff > 10 ? 0.4 : 0.2;  // Boost more in edge areas
    
    const blended = Math.min(255, Math.max(0, original + (edge - original) * boost));
    
    data[i] = blended;
    data[i + 1] = blended;
    data[i + 2] = blended;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// ============== FILTER IMPLEMENTATIONS ==============

/**
 * Convert to luminance-weighted grayscale (ITU-R BT.709)
 */
function applyLuminanceGrayscale(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Suppress highlights (specular glare) using tone mapping
 */
export function applyHighlightSuppression(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number = 50
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Find luminance percentiles
  const luminances: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    luminances.push(data[i]); // Already grayscale
  }
  luminances.sort((a, b) => a - b);
  
  // Get threshold at 95th-98th percentile based on strength
  const percentile = 0.95 + (strength / 100) * 0.03;
  const thresholdIdx = Math.floor(luminances.length * percentile);
  const highlightThreshold = luminances[thresholdIdx];
  
  // Apply tone mapping rolloff to highlights
  const factor = strength / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i];
    
    if (lum > highlightThreshold) {
      // Compress highlights using soft rolloff
      const excess = lum - highlightThreshold;
      const range = 255 - highlightThreshold;
      const compressed = highlightThreshold + excess * (1 - factor * 0.7) * Math.pow(1 - excess / range, 0.5);
      
      data[i] = Math.round(compressed);
      data[i + 1] = Math.round(compressed);
      data[i + 2] = Math.round(compressed);
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * CLAHE - Contrast Limited Adaptive Histogram Equalization
 * Improves local contrast without creating artifacts
 */
export function applyCLAHE(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: { clipLimit?: number; tileSize?: number } = {}
): void {
  const { clipLimit = 2.0, tileSize = 16 } = options;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Get grayscale values
  const grayscale = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    grayscale[i / 4] = data[i];
  }
  
  // Calculate number of tiles
  const numTilesX = Math.ceil(width / tileSize);
  const numTilesY = Math.ceil(height / tileSize);
  
  // Calculate histogram and CDF for each tile
  const tileCDFs: Float32Array[] = [];
  
  for (let ty = 0; ty < numTilesY; ty++) {
    for (let tx = 0; tx < numTilesX; tx++) {
      const x1 = tx * tileSize;
      const y1 = ty * tileSize;
      const x2 = Math.min(x1 + tileSize, width);
      const y2 = Math.min(y1 + tileSize, height);
      
      // Build histogram
      const histogram = new Uint32Array(256);
      let pixelCount = 0;
      
      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          histogram[grayscale[y * width + x]]++;
          pixelCount++;
        }
      }
      
      // Clip histogram
      const clipThreshold = Math.floor((clipLimit * pixelCount) / 256);
      let excess = 0;
      
      for (let i = 0; i < 256; i++) {
        if (histogram[i] > clipThreshold) {
          excess += histogram[i] - clipThreshold;
          histogram[i] = clipThreshold;
        }
      }
      
      // Redistribute excess
      const increment = Math.floor(excess / 256);
      for (let i = 0; i < 256; i++) {
        histogram[i] += increment;
      }
      
      // Build CDF
      const cdf = new Float32Array(256);
      cdf[0] = histogram[0];
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
      }
      
      // Normalize CDF
      const cdfMin = cdf[0];
      const cdfMax = cdf[255];
      const cdfRange = cdfMax - cdfMin || 1;
      
      for (let i = 0; i < 256; i++) {
        cdf[i] = ((cdf[i] - cdfMin) / cdfRange) * 255;
      }
      
      tileCDFs.push(cdf);
    }
  }
  
  // Apply CLAHE with bilinear interpolation between tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const grayIdx = y * width + x;
      const value = grayscale[grayIdx];
      
      // Find surrounding tiles
      const fx = (x + 0.5) / tileSize - 0.5;
      const fy = (y + 0.5) / tileSize - 0.5;
      
      const tx1 = Math.max(0, Math.floor(fx));
      const ty1 = Math.max(0, Math.floor(fy));
      const tx2 = Math.min(numTilesX - 1, tx1 + 1);
      const ty2 = Math.min(numTilesY - 1, ty1 + 1);
      
      const dx = fx - tx1;
      const dy = fy - ty1;
      
      // Get values from surrounding tiles
      const v11 = tileCDFs[ty1 * numTilesX + tx1][value];
      const v12 = tileCDFs[ty1 * numTilesX + tx2][value];
      const v21 = tileCDFs[ty2 * numTilesX + tx1][value];
      const v22 = tileCDFs[ty2 * numTilesX + tx2][value];
      
      // Bilinear interpolation
      const v1 = v11 * (1 - dx) + v12 * dx;
      const v2 = v21 * (1 - dx) + v22 * dx;
      const result = v1 * (1 - dy) + v2 * dy;
      
      data[idx] = Math.round(result);
      data[idx + 1] = Math.round(result);
      data[idx + 2] = Math.round(result);
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Edge-preserving bilateral-like denoise
 * Reduces rainbow noise while keeping edges sharp
 */
export function applyBilateralDenoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: { spatialSigma?: number; rangeSigma?: number; radius?: number } = {}
): void {
  const { spatialSigma = 3, rangeSigma = 25, radius = 3 } = options;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data.length);
  
  // Precompute spatial weights
  const spatialWeights: number[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const d2 = dx * dx + dy * dy;
      spatialWeights.push(Math.exp(-d2 / (2 * spatialSigma * spatialSigma)));
    }
  }
  
  const kernelSize = 2 * radius + 1;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const centerValue = data[idx];
      
      let sum = 0;
      let weightSum = 0;
      let kernelIdx = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          kernelIdx += kernelSize;
          continue;
        }
        
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) {
            kernelIdx++;
            continue;
          }
          
          const neighborIdx = (ny * width + nx) * 4;
          const neighborValue = data[neighborIdx];
          
          const rangeDiff = centerValue - neighborValue;
          const rangeWeight = Math.exp(-(rangeDiff * rangeDiff) / (2 * rangeSigma * rangeSigma));
          const weight = spatialWeights[kernelIdx] * rangeWeight;
          
          sum += neighborValue * weight;
          weightSum += weight;
          kernelIdx++;
        }
      }
      
      const result = Math.round(sum / weightSum);
      output[idx] = result;
      output[idx + 1] = result;
      output[idx + 2] = result;
      output[idx + 3] = data[idx + 3];
    }
  }
  
  imageData.data.set(output);
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Unsharp mask for edge-aware sharpening
 */
export function applyUnsharpMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: { radius?: number; amount?: number; threshold?: number } = {}
): void {
  const { radius = 0.7, amount = 1.0, threshold = 3 } = options;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Create blurred version using simple box blur approximation of Gaussian
  const blurred = new Float32Array(width * height);
  const kernelRadius = Math.max(1, Math.round(radius * 3));
  const kernelSize = 2 * kernelRadius + 1;
  const kernelArea = kernelSize * kernelSize;
  
  // Horizontal pass
  const horizontal = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
        const nx = x + dx;
        if (nx >= 0 && nx < width) {
          sum += data[(y * width + nx) * 4];
          count++;
        }
      }
      horizontal[y * width + x] = sum / count;
    }
  }
  
  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
        const ny = y + dy;
        if (ny >= 0 && ny < height) {
          sum += horizontal[ny * width + x];
          count++;
        }
      }
      blurred[y * width + x] = sum / count;
    }
  }
  
  // Apply unsharp mask
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const original = data[idx];
    const blur = blurred[i];
    const diff = original - blur;
    
    if (Math.abs(diff) > threshold) {
      const sharpened = Math.round(original + amount * diff);
      const clamped = Math.max(0, Math.min(255, sharpened));
      data[idx] = clamped;
      data[idx + 1] = clamped;
      data[idx + 2] = clamped;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Remove radial gradient (uneven illumination)
 */
export function removeRadialGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Downsample to estimate background illumination
  const downsampleFactor = 16;
  const smallWidth = Math.ceil(width / downsampleFactor);
  const smallHeight = Math.ceil(height / downsampleFactor);
  const background = new Float32Array(smallWidth * smallHeight);
  
  // Calculate average brightness in each block
  for (let sy = 0; sy < smallHeight; sy++) {
    for (let sx = 0; sx < smallWidth; sx++) {
      let sum = 0;
      let count = 0;
      
      const x1 = sx * downsampleFactor;
      const y1 = sy * downsampleFactor;
      const x2 = Math.min(x1 + downsampleFactor, width);
      const y2 = Math.min(y1 + downsampleFactor, height);
      
      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          sum += data[(y * width + x) * 4];
          count++;
        }
      }
      
      background[sy * smallWidth + sx] = sum / count;
    }
  }
  
  // Apply correction with bilinear interpolation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Find position in background grid
      const fx = x / downsampleFactor;
      const fy = y / downsampleFactor;
      
      const sx1 = Math.max(0, Math.min(smallWidth - 1, Math.floor(fx)));
      const sy1 = Math.max(0, Math.min(smallHeight - 1, Math.floor(fy)));
      const sx2 = Math.min(smallWidth - 1, sx1 + 1);
      const sy2 = Math.min(smallHeight - 1, sy1 + 1);
      
      const dx = fx - sx1;
      const dy = fy - sy1;
      
      // Bilinear interpolation
      const v11 = background[sy1 * smallWidth + sx1];
      const v12 = background[sy1 * smallWidth + sx2];
      const v21 = background[sy2 * smallWidth + sx1];
      const v22 = background[sy2 * smallWidth + sx2];
      
      const v1 = v11 * (1 - dx) + v12 * dx;
      const v2 = v21 * (1 - dx) + v22 * dx;
      const backgroundValue = v1 * (1 - dy) + v2 * dy;
      
      // Normalize: divide by background and rescale
      const original = data[idx];
      const targetMean = 128;
      const corrected = (original / (backgroundValue || 1)) * targetMean;
      const clamped = Math.max(0, Math.min(255, Math.round(corrected)));
      
      data[idx] = clamped;
      data[idx + 1] = clamped;
      data[idx + 2] = clamped;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Gaussian adaptive threshold for OCR layer
 */
export function applyGaussianAdaptiveThreshold(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: { blockSize?: number; C?: number } = {}
): void {
  let { blockSize = 31, C = 5 } = options;
  
  // Ensure blockSize is odd
  if (blockSize % 2 === 0) blockSize += 1;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Get grayscale values
  const grayscale = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    grayscale[i / 4] = data[i];
  }
  
  // Calculate integral image for fast Gaussian approximation (box blur)
  const integral = new Float64Array((width + 1) * (height + 1));
  
  for (let y = 1; y <= height; y++) {
    let rowSum = 0;
    for (let x = 1; x <= width; x++) {
      rowSum += grayscale[(y - 1) * width + (x - 1)];
      integral[y * (width + 1) + x] = integral[(y - 1) * (width + 1) + x] + rowSum;
    }
  }
  
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
      
      // Binarize
      const output = pixelValue > threshold ? 255 : 0;
      data[idx] = output;
      data[idx + 1] = output;
      data[idx + 2] = output;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Invert image colors
 */
function invertImage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// ============== RING DETECTION ==============

/**
 * Detect CD matrix ring using multiple methods
 */
export function detectMatrixRing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): RingDetectionResult {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2;
  
  // Try hub detection first (find darkest region near center)
  let bestCx = centerX;
  let bestCy = centerY;
  let darkestSum = Infinity;
  
  const searchRadius = maxRadius * 0.2;
  const step = Math.max(4, Math.floor(searchRadius / 10));
  
  for (let dy = -searchRadius; dy <= searchRadius; dy += step) {
    for (let dx = -searchRadius; dx <= searchRadius; dx += step) {
      const testX = Math.round(centerX + dx);
      const testY = Math.round(centerY + dy);
      
      if (testX < 0 || testX >= width || testY < 0 || testY >= height) continue;
      
      let sum = 0;
      let count = 0;
      const sampleRadius = 10;
      
      for (let sy = -sampleRadius; sy <= sampleRadius; sy += 2) {
        for (let sx = -sampleRadius; sx <= sampleRadius; sx += 2) {
          const px = testX + sx;
          const py = testY + sy;
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          
          const idx = (py * width + px) * 4;
          sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
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
  
  const detected = darkestSum < 100;
  const hubRadius = maxRadius * 0.12;
  const innerRadius = maxRadius * 0.15;
  const outerRadius = maxRadius * 0.45;
  
  return {
    detected,
    center: { x: bestCx, y: bestCy },
    innerRadius,
    outerRadius,
    confidence: detected ? 0.8 : 0.3,
    method: detected ? 'hub' : 'fallback'
  };
}

// ============== QUALITY ASSESSMENT ==============

/**
 * Assess image quality for feedback
 */
function assessQuality(imageData: ImageData): QualityAssessment {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const totalPixels = width * height;
  
  // Calculate brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += data[i];
  }
  const brightness = totalBrightness / totalPixels / 255;
  
  // Calculate contrast (std dev of luminance)
  const mean = brightness * 255;
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    variance += Math.pow(data[i] - mean, 2);
  }
  const contrast = Math.sqrt(variance / totalPixels) / 128;
  
  // Estimate sharpness
  let sharpness = 0;
  const step = 4;
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const center = data[idx];
      const laplacian = Math.abs(
        4 * center 
        - data[idx - 4] 
        - data[idx + 4] 
        - data[idx - width * 4] 
        - data[idx + width * 4]
      );
      sharpness += laplacian;
    }
  }
  sharpness = sharpness / ((width / step) * (height / step)) / 255;
  
  // Calculate reflection level (color variation - for non-grayscale input)
  // For grayscale, use brightness variance as proxy
  const reflectionLevel = contrast * 100;
  
  // Determine score
  let score: QualityAssessment['score'] = 'good';
  let feedback = '';
  
  if (brightness < 0.15) {
    score = 'poor';
    feedback = '⚠️ Te donker - gebruik meer licht';
  } else if (brightness > 0.85) {
    score = 'fair';
    feedback = '⚠️ Te licht - verminder belichting';
  } else if (contrast < 0.1) {
    score = 'fair';
    feedback = '⚠️ Weinig contrast - probeer schuine belichting';
  } else if (sharpness < 0.02) {
    score = 'fair';
    feedback = '⚠️ Onscherp - houd camera stabiel';
  } else if (contrast > 0.3 && sharpness > 0.05) {
    score = 'excellent';
    feedback = '✓ Uitstekende kwaliteit';
  } else {
    feedback = '✓ Goede kwaliteit';
  }
  
  return { brightness, contrast, sharpness, reflectionLevel, score, feedback };
}

// ============== HELPERS ==============

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
