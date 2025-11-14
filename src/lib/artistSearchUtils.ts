/**
 * Artist Search Utilities
 * Helper functions for artist search functionality
 */

/**
 * Sanitizes search input by trimming whitespace and removing special characters
 */
export const sanitizeArtistSearch = (term: string): string => {
  return term.trim().replace(/[(),]/g, ' ').toLowerCase();
};

/**
 * Highlights matching text in search results
 */
export const highlightMatch = (text: string, searchTerm: string): string => {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-vinyl-gold/30 text-foreground">$1</mark>');
};

/**
 * Truncates text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Formats result count for display
 */
export const formatResultCount = (count: number, singular: string, plural: string): string => {
  return `${count} ${count === 1 ? singular : plural}`;
};
