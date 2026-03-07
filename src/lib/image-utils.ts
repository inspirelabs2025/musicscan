export function optimizeImageUrl(url: string, options?: { width?: number; height?: number; quality?: number }): string {
  if (!url || !url.includes('supabase.co/storage')) return url;
  const separator = url.includes('?') ? '&' : '?';
  const params: string[] = [];
  if (options?.width) params.push(`width=${options.width}`);
  if (options?.height) params.push(`height=${options.height}`);
  params.push(`quality=${options?.quality || 75}`);
  params.push('format=webp');
  return url + separator + params.join('&');
}
