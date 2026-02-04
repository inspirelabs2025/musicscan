import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscogsIdentifier {
  type: string;
  value: string;
  description?: string;
}

interface DiscogsLabel {
  name: string;
  catno: string;
  id: number;
}

interface DiscogsArtist {
  name: string;
  id: number;
}

interface DiscogsRelease {
  id: number;
  title: string;
  artists: DiscogsArtist[];
  artists_sort: string;
  labels: DiscogsLabel[];
  identifiers: DiscogsIdentifier[];
  year: number;
  country: string;
  genres: string[];
  styles: string[];
  images?: { uri: string; type: string }[];
  uri: string;
}

interface DiscogsSearchResult {
  id: number;
  title: string;
  format: string[];
  country: string;
  year: string;
  cover_image: string;
  thumb: string;
  resource_url: string;
}

interface LookupResult {
  success: boolean;
  discogs_id: number | null;
  discogs_url: string | null;
  artist: string | null;
  title: string | null;
  catalog_number: string | null;
  label: string | null;
  year: number | null;
  country: string | null;
  genre: string | null;
  cover_image: string | null;
  match_confidence: number;
  match_reasons: string[];
  format?: string; // 'CD' or 'Vinyl'
  all_candidates?: Array<{
    id: number;
    artist: string;
    title: string;
    catalog_number: string | null;
    year: number | null;
    match_score: number;
  }>;
  error?: string;
}

// Clean matrix for search - remove special chars but keep structure
function cleanMatrixForSearch(matrix: string): string {
  return matrix
    .replace(/[#*~°]/g, '')      // Remove common OCR artifacts
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim();
}

// Extract searchable parts from matrix
function extractSearchTerms(matrix: string): string[] {
  const clean = cleanMatrixForSearch(matrix);
  const terms: string[] = [];
  
  // SONY DADC pattern: "SONY DADC S0100503344-0101 12 A00"
  // The unique identifier is the S-number (e.g., S0100503344)
  const sonyDadcMatch = clean.match(/S\d{10,}/i);
  if (sonyDadcMatch) {
    terms.push(sonyDadcMatch[0]); // Most specific - the S-number alone
    console.log(`[matrix-discogs-lookup] SONY DADC detected: ${sonyDadcMatch[0]}`);
  }
  
  // Warner/WEA pattern: numeric codes like "5050466-8723-2-3"
  const weaMatch = clean.match(/\d{7}-\d{4}-\d/);
  if (weaMatch) {
    terms.push(weaMatch[0]);
    console.log(`[matrix-discogs-lookup] WEA pattern detected: ${weaMatch[0]}`);
  }
  
  // Universal pattern: often has catalog-like codes
  const catalogMatch = clean.match(/[A-Z]{2,4}[\s-]?\d{4,}/i);
  if (catalogMatch) {
    terms.push(catalogMatch[0].replace(/\s+/g, ''));
  }
  
  // Fallback: try parts of the matrix
  const parts = clean.split(/\s+/);
  
  // Skip generic plant names for search
  const genericParts = ['SONY', 'DADC', 'EMI', 'SWINDON', 'UDEN', 'MPO', 'PMDC'];
  const significantParts = parts.filter(p => !genericParts.includes(p.toUpperCase()));
  
  if (significantParts.length > 0) {
    terms.push(significantParts[0]); // First non-generic part
    if (significantParts.length > 1) {
      terms.push(significantParts.slice(0, 2).join(' ')); // First two significant
    }
  }
  
  // Full clean matrix as last resort
  if (terms.length === 0) {
    terms.push(clean);
  }
  
  return [...new Set(terms)];
}

// Calculate match score between search matrix and release identifiers
function calculateMatchScore(
  searchMatrix: string,
  release: DiscogsRelease,
  ifpiMastering?: string,
  ifpiMould?: string
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  const cleanSearch = cleanMatrixForSearch(searchMatrix).toLowerCase();
  const searchPrefix = cleanSearch.slice(0, 8);
  
  // Check identifiers for matrix match
  for (const identifier of release.identifiers || []) {
    if (identifier.type === 'Matrix / Runout') {
      const identValue = identifier.value.toLowerCase();
      
      // Exact prefix match (strongest signal)
      if (identValue.includes(searchPrefix)) {
        score += 0.50;
        reasons.push('matrix_prefix_match');
        break;
      }
      
      // Partial match (weaker but useful)
      const searchWords = cleanSearch.split(/\s+/);
      const matchedWords = searchWords.filter(w => identValue.includes(w));
      if (matchedWords.length >= 2) {
        score += 0.30;
        reasons.push('matrix_partial_match');
        break;
      }
    }
  }
  
  // IFPI validation bonus
  if (ifpiMastering || ifpiMould) {
    const ifpiIdentifiers = (release.identifiers || [])
      .filter(id => id.type === 'Mould SID Code' || id.type === 'Mastering SID Code')
      .map(id => id.value.toLowerCase());
    
    if (ifpiMastering && ifpiIdentifiers.some(v => v.includes(ifpiMastering.toLowerCase().replace('ifpi', '').trim()))) {
      score += 0.15;
      reasons.push('ifpi_mastering_match');
    }
    
    if (ifpiMould && ifpiIdentifiers.some(v => v.includes(ifpiMould.toLowerCase().replace('ifpi', '').trim()))) {
      score += 0.15;
      reasons.push('ifpi_mould_match');
    }
  }
  
  // Has catalog number (required for useful result)
  if (release.labels?.[0]?.catno && release.labels[0].catno !== 'none') {
    score += 0.10;
    reasons.push('has_catalog');
  }
  
  return { score, reasons };
}

/**
 * STRICT CD format check - returns true ONLY for CDs, never for vinyl
 */
function isCDFormat(formats: string[]): boolean {
  if (!formats || formats.length === 0) return false;
  
  const formatStr = formats.join(' ').toUpperCase();
  
  // FIRST: Explicitly reject if it has ANY vinyl keywords
  const vinylKeywords = ['VINYL', 'LP', '12"', '12 "', '7"', '7 "', '10"', '10 "', '78 RPM', '45 RPM', '33 RPM', '33⅓'];
  for (const vinyl of vinylKeywords) {
    if (formatStr.includes(vinyl)) {
      console.log(`[isCDFormat] REJECTED: Contains vinyl keyword "${vinyl}"`);
      return false;
    }
  }
  
  // SECOND: Accept only if it has CD keywords
  const cdKeywords = ['CD', 'CD-ROM', 'CDR', 'HDCD', 'SACD', 'CD+G', 'ENHANCED CD', 'MINI CD', 'MINIDISC', 'DTS'];
  for (const cd of cdKeywords) {
    if (formatStr.includes(cd)) {
      return true;
    }
  }
  
  return false;
}

/**
 * STRICT Vinyl format check - returns true ONLY for vinyl, never for CDs
 */
function isVinylFormat(formats: string[]): boolean {
  if (!formats || formats.length === 0) return false;
  
  const formatStr = formats.join(' ').toUpperCase();
  
  // FIRST: Explicitly reject if it has ANY CD keywords
  const cdKeywords = ['CD', 'CD-ROM', 'CDR', 'HDCD', 'SACD', 'CD+G', 'ENHANCED CD', 'MINI CD', 'MINIDISC', 'DTS'];
  for (const cd of cdKeywords) {
    if (formatStr.includes(cd)) {
      console.log(`[isVinylFormat] REJECTED: Contains CD keyword "${cd}"`);
      return false;
    }
  }
  
  // SECOND: Accept only if it has vinyl keywords
  const vinylKeywords = ['VINYL', 'LP', '12"', '12 "', '7"', '7 "', '10"', '10 "', '78 RPM', '45 RPM', '33 RPM', '33⅓', 'ALBUM', 'SINGLE', 'EP', 'MAXI'];
  for (const vinyl of vinylKeywords) {
    if (formatStr.includes(vinyl)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check format based on mediaType parameter
 */
function matchesMediaType(formats: string[], mediaType: 'cd' | 'vinyl'): boolean {
  if (mediaType === 'cd') {
    return isCDFormat(formats);
  }
  return isVinylFormat(formats);
}

async function searchDiscogs(query: string, token: string, mediaType: 'cd' | 'vinyl'): Promise<DiscogsSearchResult[]> {
  // Use correct format parameter for Discogs API
  const formatParam = mediaType === 'vinyl' ? 'Vinyl' : 'CD';
  const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&format=${formatParam}&per_page=25`;
  
  console.log(`[matrix-discogs-lookup] Searching (${mediaType}): ${query}`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Discogs token=${token}`,
      'User-Agent': 'MusicScan/1.0',
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error(`[matrix-discogs-lookup] Search failed: ${response.status} - ${text}`);
    throw new Error(`Discogs search failed: ${response.status}`);
  }
  
  const data = await response.json();
  const results = data.results || [];
  
  // STRICT filter - Discogs API format filter isn't 100% reliable
  const filteredResults = results.filter((r: DiscogsSearchResult) => {
    const matches = matchesMediaType(r.format, mediaType);
    if (!matches) {
      console.log(`[matrix-discogs-lookup] FILTERED OUT (${mediaType}): ${r.id} - ${r.title} (format: ${r.format?.join(', ')})`);
    }
    return matches;
  });
  
  console.log(`[matrix-discogs-lookup] ${results.length} results -> ${filteredResults.length} ${mediaType} matches`);
  return filteredResults;
}

async function fetchRelease(releaseId: number, token: string): Promise<DiscogsRelease | null> {
  const url = `https://api.discogs.com/releases/${releaseId}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Discogs token=${token}`,
      'User-Agent': 'MusicScan/1.0',
    },
  });
  
  if (!response.ok) {
    console.error(`[matrix-discogs-lookup] Release fetch failed: ${releaseId}`);
    return null;
  }
  
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matrixNumber, ifpiMastering, ifpiMould, mediaType = 'cd' } = await req.json();
    
    // Validate mediaType
    const validMediaType: 'cd' | 'vinyl' = mediaType === 'vinyl' ? 'vinyl' : 'cd';
    
    if (!matrixNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'matrixNumber is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`[matrix-discogs-lookup] Input: matrix="${matrixNumber}", mediaType="${validMediaType}", ifpiMastering="${ifpiMastering || ''}", ifpiMould="${ifpiMould || ''}"`);

    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    if (!discogsToken) {
      throw new Error('DISCOGS_TOKEN not configured');
    }

    // Generate search terms from matrix
    const searchTerms = extractSearchTerms(matrixNumber);
    console.log(`[matrix-discogs-lookup] Search terms: ${searchTerms.join(' | ')}`);
    
    // Search with multiple strategies
    const allResults: DiscogsSearchResult[] = [];
    const seenIds = new Set<number>();
    
    for (const term of searchTerms.slice(0, 3)) { // Limit to 3 searches to save API calls
      const results = await searchDiscogs(term, discogsToken, validMediaType);
      
      for (const r of results) {
        if (!seenIds.has(r.id)) {
          seenIds.add(r.id);
          allResults.push(r);
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Early exit if we have enough candidates
      if (allResults.length >= 10) break;
    }
    
    console.log(`[matrix-discogs-lookup] Found ${allResults.length} unique candidates (${validMediaType})`);
    
    if (allResults.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `No ${validMediaType.toUpperCase()} releases found for this matrix`,
          match_confidence: 0,
          match_reasons: [],
          format: validMediaType === 'vinyl' ? 'Vinyl' : 'CD',
        } as LookupResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch full details for top candidates and score them
    const scoredReleases: Array<{
      release: DiscogsRelease;
      score: number;
      reasons: string[];
      searchResult: DiscogsSearchResult;
    }> = [];
    
    for (const searchResult of allResults.slice(0, 5)) { // Fetch max 5 full releases
      const release = await fetchRelease(searchResult.id, discogsToken);
      
      if (release) {
        const { score, reasons } = calculateMatchScore(matrixNumber, release, ifpiMastering, ifpiMould);
        scoredReleases.push({ release, score, reasons, searchResult });
        console.log(`[matrix-discogs-lookup] Scored ${release.id}: ${score.toFixed(2)} (${reasons.join(', ')})`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Sort by score descending
    scoredReleases.sort((a, b) => b.score - a.score);
    
    // Build candidates list for response
    const candidates = scoredReleases.map(sr => ({
      id: sr.release.id,
      artist: sr.release.artists_sort || sr.release.artists?.[0]?.name || 'Unknown',
      title: sr.release.title,
      catalog_number: sr.release.labels?.[0]?.catno || null,
      year: sr.release.year || null,
      match_score: sr.score,
    }));
    
    // Check if we have a good match
    const bestMatch = scoredReleases[0];
    
    if (!bestMatch || bestMatch.score < 0.30) {
      console.log(`[matrix-discogs-lookup] No confident match. Best score: ${bestMatch?.score.toFixed(2) || 0}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `No confident ${validMediaType.toUpperCase()} match found (best: ${(bestMatch?.score * 100 || 0).toFixed(0)}%)`,
          match_confidence: bestMatch?.score || 0,
          match_reasons: bestMatch?.reasons || [],
          format: validMediaType === 'vinyl' ? 'Vinyl' : 'CD',
          all_candidates: candidates,
        } as LookupResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const release = bestMatch.release;
    const coverImage = release.images?.find(img => img.type === 'primary')?.uri
      || release.images?.[0]?.uri
      || bestMatch.searchResult.cover_image
      || null;
    
    const result: LookupResult = {
      success: true,
      discogs_id: release.id,
      discogs_url: `https://www.discogs.com/release/${release.id}`,
      artist: release.artists_sort || release.artists?.[0]?.name || 'Unknown Artist',
      title: release.title,
      catalog_number: release.labels?.[0]?.catno || null,
      label: release.labels?.[0]?.name || null,
      year: release.year || null,
      country: release.country || null,
      genre: release.genres?.[0] || null,
      cover_image: coverImage,
      match_confidence: bestMatch.score,
      match_reasons: bestMatch.reasons,
      format: validMediaType === 'vinyl' ? 'Vinyl' : 'CD',
      all_candidates: candidates,
    };
    
    console.log(`[matrix-discogs-lookup] Match found: ${result.artist} - ${result.title} (${result.catalog_number}) @ ${(result.match_confidence * 100).toFixed(0)}% [${result.format}]`);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[matrix-discogs-lookup] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        match_confidence: 0,
        match_reasons: [],
      } as LookupResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
