/**
 * Generate SEO-optimized alt tags for images
 */
export const generateAltTag = (
  artist: string,
  title: string,
  year?: string | number,
  format?: string,
  imageType?: string
): string => {
  const parts = [artist, '-', title];
  
  if (year) {
    parts.push(`(${year})`);
  }
  
  if (format) {
    parts.push(format);
  }
  
  // Add specific image type description
  const typeLabel = imageType ? getImageTypeLabel(imageType) : 'Album Cover';
  parts.push(typeLabel);
  
  return parts.join(' ').trim();
};

const getImageTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    front: 'Front Cover',
    back: 'Back Cover',
    catalog: 'Catalog Image',
    matrix: 'Matrix/Runout',
    barcode: 'Barcode',
    additional: 'Additional Image',
    disc: 'Disc Label',
  };
  
  return labels[type] || 'Album Image';
};

/**
 * Generate alt tag for product images
 */
export const generateProductAltTag = (
  productTitle: string,
  artist?: string,
  category?: string
): string => {
  const parts = [];
  
  if (artist) {
    parts.push(artist, '-');
  }
  
  parts.push(productTitle);
  
  if (category) {
    parts.push(category);
  }
  
  return parts.join(' ').trim();
};

/**
 * Generate SEO-optimized alt tag for POSTER products
 */
export const generatePosterAltTag = (
  artist: string,
  title: string,
  style?: string,
  mediaType: 'poster' | 'print' | 'canvas' = 'poster'
): string => {
  const styleLabels: Record<string, string> = {
    posterize: 'Pop Art Posterized',
    vectorcartoon: 'Vectorized Cartoon',
    oilpainting: 'Oil Painting Style',
    watercolor: 'Watercolor Art',
    pencilsketch: 'Pencil Sketch',
    comicbook: 'Comic Book Style',
    abstract: 'Abstract Art'
  };
  
  const styleLabel = style ? styleLabels[style.toLowerCase()] || 'AI-Generated' : 'AI-Generated';
  const mediaLabel = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
  
  return `${artist} - ${title} | ${styleLabel} ${mediaLabel} | MusicScan Art`;
};
