/**
 * Check if we're on a mobile viewport (<768px).
 * Falls back to true during SSR or when window is unavailable.
 */
const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.innerWidth < 768;
};

/**
 * Get mobile-optimized dimensions. Reduces image sizes on mobile for faster loads.
 */
function getMobileOptimizedSize(width?: number, height?: number): { width?: number; height?: number } {
  if (!isMobileViewport()) return { width, height };
  const scale = 0.52; // ~half size for mobile
  return {
    width: width ? Math.round(width * scale) : undefined,
    height: height ? Math.round(height * scale) : undefined,
  };
}

/**
 * Optimize image URLs with size hints and WebP format for CDN/Cloudflare caching.
 * Automatically reduces dimensions on mobile viewports.
 * Appends format=webp for Supabase Storage URLs to serve modern formats.
 */
export function optimizeImageUrl(url: string, options?: { width?: number; height?: number; quality?: number }): string {
  if (!url) return url;

  const { width, height } = getMobileOptimizedSize(options?.width, options?.height);

  if (url.includes('supabase.co/storage')) {
    const separator = url.includes('?') ? '&' : '?';
    const params: string[] = [];
    if (width) params.push(`width=${width * 2}`);
    if (height) params.push(`height=${height * 2}`);
    // Request WebP format for smaller payloads
    params.push('format=webp');
    if (options?.quality) params.push(`quality=${options.quality}`);
    return url + separator + params.join('&');
  }

  if (url.includes('i.discogs.com') && width) {
    const targetW = width * 2;
    return url.replace(/width=\d+/, `width=${targetW}`).replace(/height=\d+/, `height=${targetW}`);
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
