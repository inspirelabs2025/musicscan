/**
 * Optimize image URLs with size hints for CDN/Cloudflare caching.
 * Uses standard /object/public/ path (no Image Transformations required).
 */
export function optimizeImageUrl(url: string, options?: { width?: number; height?: number; quality?: number }): string {
  if (!url) return url;

  if (url.includes('supabase.co/storage')) {
    const separator = url.includes('?') ? '&' : '?';
    const params: string[] = [];
    if (options?.width) params.push(`width=${options.width * 2}`);
    if (options?.height) params.push(`height=${options.height * 2}`);
    if (params.length === 0) return url;
    return url + separator + params.join('&');
  }

  if (url.includes('i.discogs.com') && options?.width) {
    const targetW = options.width * 2;
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
