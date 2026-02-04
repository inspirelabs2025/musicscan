/**
 * Matrix Photo Detector
 * 
 * Automatically detects if an uploaded photo is a CD matrix/disc surface photo
 * by analyzing visual characteristics like hub holes and circular patterns.
 */

export interface MatrixPhotoDetectionResult {
  isMatrix: boolean;
  confidence: number;
  features: {
    hasHubHole: boolean;
    hasRainbowReflection: boolean;
    hasCircularStructure: boolean;
    hasConcenticRings: boolean;
  };
  detectionTimeMs: number;
}

/**
 * Detect if an image file is likely a CD matrix/disc surface photo
 * Uses visual feature analysis to identify disc characteristics
 */
export async function detectMatrixPhoto(file: File): Promise<MatrixPhotoDetectionResult> {
  const startTime = performance.now();
  
  // Load image
  const img = await loadImage(file);
  
  // Create analysis canvas
  const maxDim = 400; // Downscale for faster analysis
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
  
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // Run detection algorithms
  const hasHubHole = detectHubHole(imageData, width, height);
  const hasRainbowReflection = detectRainbowReflection(imageData, width, height);
  const hasCircularStructure = detectCircularStructure(imageData, width, height);
  const hasConcenticRings = detectConcentricRings(imageData, width, height);
  
  // Calculate confidence score
  let score = 0;
  if (hasHubHole) score += 0.35;
  if (hasRainbowReflection) score += 0.25;
  if (hasCircularStructure) score += 0.25;
  if (hasConcenticRings) score += 0.15;
  
  const detectionTimeMs = performance.now() - startTime;
  
  console.log(`🔍 Matrix photo detection: ${(score * 100).toFixed(0)}% confidence in ${detectionTimeMs.toFixed(0)}ms`, {
    hasHubHole,
    hasRainbowReflection,
    hasCircularStructure,
    hasConcenticRings
  });
  
  return {
    isMatrix: score >= 0.5,
    confidence: score,
    features: {
      hasHubHole,
      hasRainbowReflection,
      hasCircularStructure,
      hasConcenticRings
    },
    detectionTimeMs
  };
}

/**
 * Load an image from File
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Detect if there's a dark circular hub hole in the center
 * CD hub holes are typically dark/black circles at the exact center
 */
function detectHubHole(imageData: ImageData, width: number, height: number): boolean {
  const data = imageData.data;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Check a small region in the center for darkness
  const hubRadius = Math.min(width, height) * 0.05; // 5% of image size
  let darkPixels = 0;
  let totalPixels = 0;
  
  for (let y = Math.floor(centerY - hubRadius); y <= Math.ceil(centerY + hubRadius); y++) {
    for (let x = Math.floor(centerX - hubRadius); x <= Math.ceil(centerX + hubRadius); x++) {
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= hubRadius) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        totalPixels++;
        if (brightness < 60) { // Dark threshold
          darkPixels++;
        }
      }
    }
  }
  
  const darkRatio = totalPixels > 0 ? darkPixels / totalPixels : 0;
  return darkRatio > 0.5; // >50% dark pixels in center indicates hub hole
}

/**
 * Detect rainbow/iridescent reflections typical of CD surfaces
 * CDs have characteristic spectral reflections with high color variation
 */
function detectRainbowReflection(imageData: ImageData, width: number, height: number): boolean {
  const data = imageData.data;
  
  // Sample pixels in a ring around the center (typical rainbow zone)
  const centerX = width / 2;
  const centerY = height / 2;
  const innerRadius = Math.min(width, height) * 0.15;
  const outerRadius = Math.min(width, height) * 0.4;
  
  let highSaturationCount = 0;
  let sampleCount = 0;
  let hueVariance = 0;
  const hues: number[] = [];
  
  // Sample points in the ring
  for (let angle = 0; angle < 360; angle += 10) {
    const radians = (angle * Math.PI) / 180;
    const radius = (innerRadius + outerRadius) / 2;
    
    const x = Math.round(centerX + Math.cos(radians) * radius);
    const y = Math.round(centerY + Math.sin(radians) * radius);
    
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Convert to HSL to check saturation
    const { h, s } = rgbToHsl(r, g, b);
    
    sampleCount++;
    hues.push(h);
    
    if (s > 0.3) { // Moderate saturation threshold
      highSaturationCount++;
    }
  }
  
  // Calculate hue variance (rainbow = high variance)
  if (hues.length > 5) {
    const meanHue = hues.reduce((a, b) => a + b, 0) / hues.length;
    hueVariance = hues.reduce((acc, h) => {
      const diff = Math.min(Math.abs(h - meanHue), 360 - Math.abs(h - meanHue));
      return acc + diff * diff;
    }, 0) / hues.length;
    hueVariance = Math.sqrt(hueVariance);
  }
  
  const saturationRatio = sampleCount > 0 ? highSaturationCount / sampleCount : 0;
  
  // Rainbow = moderate saturation + high hue variance
  return saturationRatio > 0.2 && hueVariance > 40;
}

/**
 * Detect circular/disc-like structure
 * CD photos typically have a circular object centered in frame
 */
function detectCircularStructure(imageData: ImageData, width: number, height: number): boolean {
  const data = imageData.data;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Sample brightness at multiple radii to detect circular gradient
  const radii = [0.1, 0.2, 0.3, 0.4, 0.45];
  const brightnessAtRadii: number[] = [];
  
  for (const radiusRatio of radii) {
    const radius = Math.min(width, height) * radiusRatio;
    let totalBrightness = 0;
    let samples = 0;
    
    // Sample 16 points around the circle
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const x = Math.round(centerX + Math.cos(angle) * radius);
      const y = Math.round(centerY + Math.sin(angle) * radius);
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const idx = (y * width + x) * 4;
      totalBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      samples++;
    }
    
    brightnessAtRadii.push(samples > 0 ? totalBrightness / samples : 0);
  }
  
  // Check for typical CD pattern: darker center, brighter ring, darker edge
  // Or consistent brightness in the disc area
  if (brightnessAtRadii.length >= 4) {
    const innerBrightness = brightnessAtRadii[0];
    const midBrightness = (brightnessAtRadii[1] + brightnessAtRadii[2]) / 2;
    const outerBrightness = brightnessAtRadii[3];
    
    // Typical CD: dark center (hub), brighter disc
    const hasDarkCenter = innerBrightness < midBrightness * 0.7;
    
    // Or: consistent brightness suggesting reflective surface
    const variance = Math.abs(midBrightness - outerBrightness);
    const isConsistent = variance < 50;
    
    return hasDarkCenter || isConsistent;
  }
  
  return false;
}

/**
 * Detect concentric ring patterns typical of CD data tracks
 */
function detectConcentricRings(imageData: ImageData, width: number, height: number): boolean {
  const data = imageData.data;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Sample brightness along a radial line
  const radialBrightness: number[] = [];
  const maxRadius = Math.min(width, height) * 0.4;
  const steps = 50;
  
  for (let i = 0; i < steps; i++) {
    const radius = (i / steps) * maxRadius;
    const x = Math.round(centerX + radius);
    const y = Math.round(centerY);
    
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    
    const idx = (y * width + x) * 4;
    radialBrightness.push((data[idx] + data[idx + 1] + data[idx + 2]) / 3);
  }
  
  // Count brightness transitions (rings create oscillations)
  let transitions = 0;
  for (let i = 2; i < radialBrightness.length - 2; i++) {
    const prev = radialBrightness[i - 1];
    const curr = radialBrightness[i];
    const next = radialBrightness[i + 1];
    
    // Local minimum or maximum
    if ((curr < prev && curr < next) || (curr > prev && curr > next)) {
      const magnitude = Math.abs(curr - (prev + next) / 2);
      if (magnitude > 10) { // Significant transition
        transitions++;
      }
    }
  }
  
  // Multiple transitions suggest concentric rings
  return transitions >= 3;
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }
  
  return { h, s, l };
}

/**
 * Detect matrix photos in a batch of files
 * Returns the files identified as matrix photos with their detection results
 */
export async function detectMatrixPhotosInBatch(
  files: File[]
): Promise<Array<{ file: File; detection: MatrixPhotoDetectionResult }>> {
  const results: Array<{ file: File; detection: MatrixPhotoDetectionResult }> = [];
  
  for (const file of files) {
    try {
      const detection = await detectMatrixPhoto(file);
      if (detection.isMatrix) {
        results.push({ file, detection });
      }
    } catch (error) {
      console.warn('Matrix detection failed for file:', file.name, error);
    }
  }
  
  // Sort by confidence, highest first
  results.sort((a, b) => b.detection.confidence - a.detection.confidence);
  
  return results;
}
