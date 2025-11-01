export interface ArtworkQuality {
  quality: 'high' | 'medium' | 'low' | 'none';
  dimensions: string | null;
  needsRefetch: boolean;
  estimatedWidth: number | null;
  estimatedHeight: number | null;
}

export const checkArtworkQuality = (imageUrl: string | null): ArtworkQuality => {
  if (!imageUrl) {
    return { 
      quality: 'none', 
      dimensions: null, 
      needsRefetch: true,
      estimatedWidth: null,
      estimatedHeight: null
    };
  }

  let width: number | null = null;
  let height: number | null = null;

  // Parse dimensions from iTunes URLs (e.g., "1200x1200bb")
  const itunesMatch = imageUrl.match(/(\d+)x(\d+)bb/);
  if (itunesMatch) {
    width = parseInt(itunesMatch[1], 10);
    height = parseInt(itunesMatch[2], 10);
  }

  // Parse dimensions from generic URLs (e.g., "1200x1200")
  if (!width) {
    const genericMatch = imageUrl.match(/(\d+)x(\d+)/);
    if (genericMatch) {
      width = parseInt(genericMatch[1], 10);
      height = parseInt(genericMatch[2], 10);
    }
  }

  // If we found dimensions, categorize quality
  if (width && height) {
    const minDimension = Math.min(width, height);
    
    let quality: 'high' | 'medium' | 'low';
    let needsRefetch: boolean;
    
    if (minDimension >= 1000) {
      quality = 'high';
      needsRefetch = false;
    } else if (minDimension >= 600) {
      quality = 'medium';
      needsRefetch = false;
    } else {
      quality = 'low';
      needsRefetch = true;
    }

    return {
      quality,
      dimensions: `${width}x${height}`,
      needsRefetch,
      estimatedWidth: width,
      estimatedHeight: height
    };
  }

  // Check for known high-quality sources
  if (imageUrl.includes('coverartarchive.org')) {
    return {
      quality: 'high',
      dimensions: 'Cover Art Archive (typically 1200x1200+)',
      needsRefetch: false,
      estimatedWidth: 1200,
      estimatedHeight: 1200
    };
  }

  if (imageUrl.includes('discogs.com')) {
    // Discogs images vary in quality
    return {
      quality: 'medium',
      dimensions: 'Discogs (varies)',
      needsRefetch: false,
      estimatedWidth: null,
      estimatedHeight: null
    };
  }

  // Unknown source, assume might need refetch
  return {
    quality: 'medium',
    dimensions: 'Unknown',
    needsRefetch: true,
    estimatedWidth: null,
    estimatedHeight: null
  };
};

export const filterProductsNeedingRefetch = (products: any[]): any[] => {
  return products.filter(product => {
    const quality = checkArtworkQuality(product.primary_image);
    return quality.needsRefetch;
  });
};
