/**
 * Optimize Supabase Storage image URLs by using the Image Transformation API.
 * Converts /object/public/ to /render/image/public/ and appends resize/format params.
 * For Discogs images, adjusts width/height params in existing URL.
 */
export function optimizeImageUrl(url: string, options?: { width?: number; height?: number; quality?: number }): string {
  if (!url) return url;

  // Supabase Storage images: use render/image endpoint for real transformations
  if (url.includes('supabase.co/storage')) {
    // Convert object URL to render URL for image transformations
    let renderUrl = url.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );

    // Strip any existing query params for clean transformation
    const [base] = renderUrl.split('?');
    const params: string[] = [];

    // Use 2x dimensions for retina displays
    if (options?.width) params.push(`width=${options.width * 2}`);
    if (options?.height) params.push(`height=${options.height * 2}`);
    params.push(`quality=${options?.quality || 75}`);
    params.push('format=webp');
    params.push('resize=contain');

    return base + '?' + params.join('&');
  }

  // Discogs images: adjust existing dimension params
  if (url.includes('i.discogs.com')) {
    if (options?.width) {
      // Replace existing width/height params or append them
      let optimized = url;
      const targetW = options.width * 2; // Retina
      optimized = optimized.replace(/width=\d+/, `width=${targetW}`);
      optimized = optimized.replace(/height=\d+/, `height=${targetW}`);
      return optimized;
    }
    return url;
  }

  return url;
}

/**
 * Generate a descriptive alt tag for artwork images.
 */
export function generateArtworkAlt(artist: string, title: string, type: string = 'artwork'): string {
  const parts = [artist, title].filter(Boolean);
  if (!parts.length) return `Music ${type}`;
  return `${parts.join(' - ')} ${type}`;
}
