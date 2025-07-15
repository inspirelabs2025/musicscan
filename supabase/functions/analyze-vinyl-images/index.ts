import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// ========== VINYL ANALYSIS FUNCTION V3.0 - MAJOR CACHE INVALIDATION ==========
// VERSION: 3.0.0 - ABSOLUTELY NO DATABASE SAVES - FRONTEND HANDLES ALL SAVES
// TIMESTAMP: 2025-07-15-V3-COMPLETE-RESTRUCTURE
// DEPLOYMENT ID: vinyl-analysis-v3-no-db-saves

const VINYL_FUNCTION_VERSION = "V3.0.0-NO-DB-SAVES-CACHE-BUST";
const VINYL_DEPLOYMENT_TIMESTAMP = Date.now();

console.log(`🚀 VINYL ANALYSIS FUNCTION ${VINYL_FUNCTION_VERSION} INITIALIZING`);
console.log(`📋 DEPLOYMENT TIMESTAMP: ${VINYL_DEPLOYMENT_TIMESTAMP}`);
console.log(`⚠️  CRITICAL: NO DATABASE SAVES IN THIS VERSION!`);

const corsHeadersV3 = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIKeyV3 = Deno.env.get('OPENAI_API_KEY');
const supabaseUrlV3 = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKeyV3 = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const discogsConsumerKeyV3 = Deno.env.get('DISCOGS_CONSUMER_KEY');
const discogsConsumerSecretV3 = Deno.env.get('DISCOGS_CONSUMER_SECRET');
const discogsTokenV3 = Deno.env.get('DISCOGS_TOKEN');

// Function to clean JSON from markdown code blocks
function cleanJsonFromMarkdownV3(text: string): string {
  let cleaned = text.replace(/```json\s*\n/g, '').replace(/```\s*\n/g, '').replace(/\n```/g, '').replace(/```/g, '');
  cleaned = cleaned.trim();
  
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

// Helper function to normalize text for comparison
const normalizeTextV3 = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// Helper function to calculate Levenshtein distance
const levenshteinDistanceV3 = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Helper function to calculate similarity score
const calculateSimilarityV3 = (str1: string, str2: string): number => {
  const distance = levenshteinDistanceV3(normalizeTextV3(str1), normalizeTextV3(str2));
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
};

// Helper function to generate catalog number variants
const generateCatalogVariantsV3 = (catalogNumber: string): string[] => {
  if (!catalogNumber) return [];
  
  const variants = new Set<string>();
  const cleaned = catalogNumber.trim();
  
  variants.add(cleaned);
  variants.add(cleaned.replace(/\s+/g, ''));
  variants.add(cleaned.replace(/[.\-_]/g, ' '));
  variants.add(cleaned.replace(/\s+/g, '.'));
  variants.add(cleaned.replace(/\s+/g, '-'));
  variants.add(cleaned.replace(/\s+/g, '_'));
  variants.add(cleaned.replace(/([.\-_])/g, ' $1 ').replace(/\s+/g, ' '));
  
  return Array.from(variants);
};

// Function to search Discogs for releases
async function searchDiscogsReleaseV3(artist: string, title: string, catalogNumber: string | null) {
  console.log(`🔐 [${VINYL_FUNCTION_VERSION}] Checking Discogs API credentials...`, {
    hasKey: !!discogsConsumerKeyV3,
    hasSecret: !!discogsConsumerSecretV3,
    keyLength: discogsConsumerKeyV3?.length || 0,
    secretLength: discogsConsumerSecretV3?.length || 0
  });
  
  if (!discogsConsumerKeyV3 || !discogsConsumerSecretV3) {
    console.log(`⚠️ [${VINYL_FUNCTION_VERSION}] Discogs API keys not configured, skipping search`);
    return null;
  }

  try {
    console.log(`🔍 [${VINYL_FUNCTION_VERSION}] Searching Discogs for:`, { artist, title, catalogNumber });
    
    const normalizedArtist = artist ? normalizeTextV3(artist) : '';
    const normalizedTitle = title ? normalizeTextV3(title) : '';
    
    const catalogVariants = catalogNumber ? generateCatalogVariantsV3(catalogNumber) : [];
    console.log(`📋 [${VINYL_FUNCTION_VERSION}] Catalog variants to try:`, catalogVariants);
    
    const searchStrategies = [];
    
    // Strategy 1: Try all catalog number variants
    for (const catalogVariant of catalogVariants) {
      searchStrategies.push({
        query: catalogVariant,
        params: { catno: catalogVariant },
        name: `catalog-variant-${catalogVariant}`,
        priority: 1
      });
    }
    
    // Strategy 2: Normalized artist + title with catalog variants
    if (artist && title) {
      for (const catalogVariant of catalogVariants) {
        searchStrategies.push({
          query: `${artist} ${title}`,
          params: { catno: catalogVariant, artist, release_title: title },
          name: `full-match-original-${catalogVariant}`,
          priority: 2
        });
        
        searchStrategies.push({
          query: `${normalizedArtist} ${normalizedTitle}`,
          params: { catno: catalogVariant, artist: normalizedArtist, release_title: normalizedTitle },
          name: `full-match-normalized-${catalogVariant}`,
          priority: 2
        });
      }
    }
    
    // Strategy 3: Artist + Title only
    if (artist && title) {
      searchStrategies.push({
        query: `${artist} ${title}`,
        params: { artist, release_title: title },
        name: 'artist-title-original',
        priority: 3
      });
      
      searchStrategies.push({
        query: `${normalizedArtist} ${normalizedTitle}`,
        params: { artist: normalizedArtist, release_title: normalizedTitle },
        name: 'artist-title-normalized',
        priority: 3
      });
    }
    
    // Strategy 4: General search variations
    if (artist || title) {
      const queries = [
        `${artist || ''} ${title || ''}`.trim(),
        `${normalizedArtist || ''} ${normalizedTitle || ''}`.trim()
      ].filter(q => q.length > 0);
      
      for (const query of queries) {
        searchStrategies.push({
          query,
          params: {},
          name: `general-${queries.indexOf(query)}`,
          priority: 4
        });
      }
    }
    
    searchStrategies.sort((a, b) => a.priority - b.priority);
    
    console.log(`🎯 [${VINYL_FUNCTION_VERSION}] Will try ${searchStrategies.length} search strategies`);
    
    for (const strategy of searchStrategies) {
      console.log(`🎯 [${VINYL_FUNCTION_VERSION}] Trying search strategy: ${strategy.name} (priority ${strategy.priority})`);
      
      const params = new URLSearchParams({
        q: strategy.query,
        type: 'release',
        per_page: '25',
        ...strategy.params
      });
      
      const searchUrl = `https://api.discogs.com/database/search?${params.toString()}`;
      console.log(`🔗 [${VINYL_FUNCTION_VERSION}] Search URL: ${searchUrl}`);
      
      const headers: Record<string, string> = {
        'User-Agent': 'VinylScanner/1.0',
        'Authorization': `Discogs key=${discogsConsumerKeyV3}, secret=${discogsConsumerSecretV3}`
      };
      
      const response = await fetch(searchUrl, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [${VINYL_FUNCTION_VERSION}] Discogs search failed for ${strategy.name}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        continue;
      }
      
      const data = await response.json();
      console.log(`📊 [${VINYL_FUNCTION_VERSION}] Strategy ${strategy.name} returned ${data.results?.length || 0} results`);
      
      if (data.results && data.results.length > 0) {
        let bestMatch = null;
        let bestScore = 0;
        
        for (const result of data.results) {
          let score = 0;
          
          if (catalogNumber && result.catno) {
            const catalogSimilarity = calculateSimilarityV3(catalogNumber, result.catno);
            score += catalogSimilarity * 40;
            console.log(`📋 [${VINYL_FUNCTION_VERSION}] Catalog similarity for "${result.catno}": ${catalogSimilarity.toFixed(2)}`);
          }
          
          if (artist && result.artist) {
            const artistSimilarity = calculateSimilarityV3(artist, result.title.split(' - ')[0] || result.artist);
            score += artistSimilarity * 30;
            console.log(`🎤 [${VINYL_FUNCTION_VERSION}] Artist similarity for "${result.title}": ${artistSimilarity.toFixed(2)}`);
          }
          
          if (title && result.title) {
            const titlePart = result.title.includes(' - ') ? result.title.split(' - ')[1] : result.title;
            const titleSimilarity = calculateSimilarityV3(title, titlePart);
            score += titleSimilarity * 30;
            console.log(`🎵 [${VINYL_FUNCTION_VERSION}] Title similarity for "${titlePart}": ${titleSimilarity.toFixed(2)}`);
          }
          
          console.log(`📊 [${VINYL_FUNCTION_VERSION}] Result "${result.title}" (ID: ${result.id}) scored: ${score.toFixed(2)}`);
          
          if (score > bestScore && score > 50) {
            bestScore = score;
            bestMatch = result;
          }
        }
        
        if (!bestMatch && data.results.length > 0) {
          bestMatch = data.results[0];
          console.log(`🔄 [${VINYL_FUNCTION_VERSION}] Using fallback to first result`);
        }
        
        if (bestMatch) {
          console.log(`✅ [${VINYL_FUNCTION_VERSION}] Found Discogs release using ${strategy.name} with score ${bestScore.toFixed(2)}:`, bestMatch.id);
          return {
            discogs_id: bestMatch.id,
            discogs_url: `https://www.discogs.com/release/${bestMatch.id}`,
            strategy_used: strategy.name,
            match_score: bestScore
          };
        }
      }
      
      console.log(`📭 [${VINYL_FUNCTION_VERSION}] No suitable results for strategy: ${strategy.name}`);
    }
    
    console.log(`📭 [${VINYL_FUNCTION_VERSION}] No Discogs results found with any strategy`);
    return null;
  } catch (error) {
    console.error(`❌ [${VINYL_FUNCTION_VERSION}] Error searching Discogs:`, error);
    return null;
  }
}

// Interface for Discogs listing data
interface DiscogsListingV3 {
  price: number;
  currency: string;
  condition: string;
  sleeve_condition: string;
  shipping_price?: number;
  seller_location?: string;
}

// Helper function for flexible condition matching
function flexibleConditionsMatchV3(requestedCondition: string, discogsCondition: string): boolean {
  if (!requestedCondition || !discogsCondition) return false;
  
  const normalize = (str: string) => str.toLowerCase().trim();
  const requested = normalize(requestedCondition);
  const discogs = normalize(discogsCondition);
  
  if (requested === discogs) return true;
  if (requested.includes(discogs) || discogs.includes(requested)) return true;
  
  const conditionMap: Record<string, string[]> = {
    'mint': ['m', 'mint (m)', 'nm', 'near mint', 'near mint (nm)'],
    'near mint': ['nm', 'near mint (nm)', 'mint', 'm', 'mint (m)'],
    'very good': ['vg', 'very good (vg)', 'vg+', 'very good plus', 'very good plus (vg+)'],
    'good': ['g', 'good (g)', 'vg', 'very good'],
    'fair': ['f', 'fair (f)', 'poor'],
    'poor': ['p', 'poor (p)', 'fair']
  };
  
  for (const [key, variants] of Object.entries(conditionMap)) {
    if ((requested.includes(key) || variants.some(v => requested.includes(v))) &&
        (discogs.includes(key) || variants.some(v => discogs.includes(v)))) {
      return true;
    }
  }
  
  return false;
}

// Enhanced function to get comprehensive pricing data from Discogs
async function getDiscogsPriceAnalysisByIdV3(
  releaseId: number, 
  condition: string = 'Very Good'
) {
  if (!releaseId || !discogsConsumerKeyV3 || !discogsConsumerSecretV3) {
    console.log(`❌ [${VINYL_FUNCTION_VERSION}] Missing releaseId or Discogs API keys for price analysis`);
    return null;
  }

  try {
    console.log(`🔍 [${VINYL_FUNCTION_VERSION}] Starting price analysis for release ${releaseId}`);
    
    // Try marketplace stats endpoint first
    const statsUrl = `https://api.discogs.com/marketplace/stats/${releaseId}`;
    
    const statsRes = await fetch(statsUrl, {
      headers: {
        "Authorization": `Discogs token=${discogsTokenV3}`,
        "User-Agent": "VinylVoyager/1.0",
        "Accept": "application/json"
      }
    });

    if (!statsRes.ok) {
      const errorText = await statsRes.text();
      console.warn(`❌ [${VINYL_FUNCTION_VERSION}] Discogs stats error: ${statsRes.status} ${statsRes.statusText}`, errorText);
      return await fallbackToMarketplaceListingsV3(releaseId, condition);
    }

    const statsData = await statsRes.json();
    
    console.log(`📊 [${VINYL_FUNCTION_VERSION}] Raw marketplace stats response:`, JSON.stringify(statsData, null, 2));

    const result = {
      lowest_price: statsData.lowest_price?.value || null,
      median_price: statsData.median_price?.value || null, 
      highest_price: statsData.highest_price?.value || null,
      num_for_sale: statsData.num_for_sale || 0,
      currency: statsData.lowest_price?.currency || 'EUR'
    };

    console.log(`💰 [${VINYL_FUNCTION_VERSION}] Stats API result: Low: ${result.lowest_price}, Median: ${result.median_price}, High: ${result.highest_price}, For Sale: ${result.num_for_sale}`);

    if (!result.median_price) {
      console.log(`🔄 [${VINYL_FUNCTION_VERSION}] Stats API missing median_price, falling back to listings`);
      const listingsResult = await fallbackToMarketplaceListingsV3(releaseId, condition);
      
      if (listingsResult) {
        return {
          lowest_price: result.lowest_price || listingsResult.lowest_price,
          median_price: listingsResult.median_price,
          highest_price: result.highest_price || listingsResult.highest_price,
          num_for_sale: result.num_for_sale || listingsResult.num_for_sale,
          currency: result.currency || listingsResult.currency
        };
      }
    }

    return result;
  } catch (err) {
    console.error(`❌ [${VINYL_FUNCTION_VERSION}] Discogs price analysis by ID failed:`, err);
    return await fallbackToMarketplaceListingsV3(releaseId, condition);
  }
}

// Fallback function to get pricing from marketplace listings
async function fallbackToMarketplaceListingsV3(releaseId: number, condition: string = 'Very Good') {
  try {
    console.log(`🔄 [${VINYL_FUNCTION_VERSION}] Fetching marketplace listings for release ${releaseId}`);
    
    const listingsUrl = `https://api.discogs.com/marketplace/listings?release_id=${releaseId}&page=1&per_page=100`;
    
    const listingsRes = await fetch(listingsUrl, {
      headers: {
        "Authorization": `Discogs token=${discogsTokenV3}`,
        "User-Agent": "VinylVoyager/1.0",
        "Accept": "application/json"
      }
    });

    if (!listingsRes.ok) {
      const errorText = await listingsRes.text();
      console.warn(`❌ [${VINYL_FUNCTION_VERSION}] Discogs listings error: ${listingsRes.status} ${listingsRes.statusText}`, errorText);
      return null;
    }

    const listingsData = await listingsRes.json();
    console.log(`📋 [${VINYL_FUNCTION_VERSION}] Found ${listingsData.listings?.length || 0} listings`);

    if (!listingsData.listings || listingsData.listings.length === 0) {
      console.log(`📭 [${VINYL_FUNCTION_VERSION}] No listings found for release ${releaseId}`);
      return null;
    }

    const prices: number[] = [];
    
    for (const listing of listingsData.listings) {
      if (listing.price?.value && typeof listing.price.value === 'number') {
        prices.push(listing.price.value);
      }
    }

    if (prices.length === 0) {
      console.log(`💰 [${VINYL_FUNCTION_VERSION}] No valid prices found in listings`);
      return null;
    }

    prices.sort((a, b) => a - b);
    
    const lowest_price = prices[0];
    const highest_price = prices[prices.length - 1];
    const median_price = prices.length % 2 === 0 
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

    const currency = listingsData.listings[0]?.price?.currency || 'EUR';

    const result = {
      lowest_price,
      median_price,
      highest_price,
      num_for_sale: prices.length,
      currency
    };

    console.log(`💰 [${VINYL_FUNCTION_VERSION}] Calculated from listings: Low: ${result.lowest_price}, Median: ${result.median_price}, High: ${result.highest_price}, For Sale: ${result.num_for_sale}`);
    
    return result;
  } catch (err) {
    console.error(`❌ [${VINYL_FUNCTION_VERSION}] Marketplace listings fallback failed:`, err);
    return null;
  }
}

// ========== MAIN SERVE FUNCTION - V3.0 ==========
serve(async (req) => {
  console.log(`🚀 [${VINYL_FUNCTION_VERSION}] REQUEST RECEIVED AT: ${new Date().toISOString()}`);
  console.log(`📋 [${VINYL_FUNCTION_VERSION}] DEPLOYMENT TIMESTAMP: ${VINYL_DEPLOYMENT_TIMESTAMP}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeadersV3 });
  }

  // Mobile-optimized timeout
  const VINYL_FUNCTION_TIMEOUT = 45000;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Function timeout after 45s in ${VINYL_FUNCTION_VERSION}`)), VINYL_FUNCTION_TIMEOUT);
  });

  try {
    const analysisResult = await Promise.race([
      executeVinylAnalysisV3(req),
      timeoutPromise
    ]);
    return analysisResult;
  } catch (error) {
    console.error(`❌ [${VINYL_FUNCTION_VERSION}] FUNCTION ERROR:`, error);
    return new Response(JSON.stringify({ 
      error: 'Vinyl analysis failed', 
      details: error.message,
      version: VINYL_FUNCTION_VERSION,
      deployment: VINYL_DEPLOYMENT_TIMESTAMP,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeadersV3, 'Content-Type': 'application/json' }
    });
  }
});

// ========== MAIN ANALYSIS FUNCTION - V3.0 ==========
async function executeVinylAnalysisV3(req: Request) {
  try {
    console.log(`🎵 [${VINYL_FUNCTION_VERSION}] Starting vinyl image analysis...`);
    
    // Check if OpenAI API key is available
    if (!openAIKeyV3) {
      console.error(`❌ [${VINYL_FUNCTION_VERSION}] OpenAI API key not found`);
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured', version: VINYL_FUNCTION_VERSION }),
        { 
          status: 500, 
          headers: { ...corsHeadersV3, 'Content-Type': 'application/json' }
        }
      );
    }

    const { imageUrls } = await req.json();
    
    console.log(`📸 [${VINYL_FUNCTION_VERSION}] Processing ${imageUrls?.length || 0} images`);
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.error(`❌ [${VINYL_FUNCTION_VERSION}] No valid image URLs provided`);
      return new Response(
        JSON.stringify({ error: 'No valid image URLs provided', version: VINYL_FUNCTION_VERSION }),
        { 
          status: 400, 
          headers: { ...corsHeadersV3, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 [${VINYL_FUNCTION_VERSION}] Analyzing images with OpenAI Vision...`);
    
    // Process each image with specific prompts
    const imageAnalysisResults = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      console.log(`📸 [${VINYL_FUNCTION_VERSION}] Processing image ${i + 1}/${imageUrls.length}...`);
      
      let prompt = '';
      if (i === 0) {
        prompt = `Analyze this vinyl record label image. Extract the following information as JSON:
        {
          "catalog_number": "catalog number if visible",
          "label": "record label name if visible", 
          "additional_codes": ["any additional codes visible"],
          "confidence": 0.95
        }
        Focus on finding catalog numbers, label names, and any production codes. Return clean JSON only.`;
      } else if (i === 1) {
        prompt = `Analyze this vinyl record matrix/runout groove area. Extract the following information as JSON:
        {
          "matrix_number": "matrix number if visible",
          "side": "A or B or 1 or 2 if visible",
          "stamper_codes": ["any stamper or pressing codes"],
          "confidence": 0.95
        }
        Look for etched or stamped codes in the runout area. Return clean JSON only.`;
      } else {
        prompt = `Analyze this vinyl record image for any additional information. Extract as JSON:
        {
          "artist": "artist name",
          "title": "album/release title",
          "year": "release year if visible",
          "format": "LP/12\"/7\"/etc",
          "genre": "genre if determinable",
          "country": "country of release if visible",
          "barcode": "barcode if visible",
          "additional_info": "any other relevant information",
          "confidence": 0.95
        }
        Return clean JSON only.`;
      }

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKeyV3}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageUrls[i] } }
                ]
              }
            ],
            max_tokens: 500,
            temperature: 0.1
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [${VINYL_FUNCTION_VERSION}] OpenAI API error for image ${i + 1}:`, response.status, errorText);
          continue;
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        if (content) {
          try {
            const cleanedJson = cleanJsonFromMarkdownV3(content);
            const parsedResult = JSON.parse(cleanedJson);
            
            console.log(`✅ [${VINYL_FUNCTION_VERSION}] Image ${i + 1} analysis result:`, parsedResult);
            console.log(`🧹 [${VINYL_FUNCTION_VERSION}] Cleaned result for image ${i + 1}:`, JSON.stringify(parsedResult, null, 2));
            
            imageAnalysisResults.push(parsedResult);
          } catch (parseError) {
            console.error(`❌ [${VINYL_FUNCTION_VERSION}] Failed to parse JSON for image ${i + 1}:`, parseError);
            console.log(`📄 [${VINYL_FUNCTION_VERSION}] Raw content for image ${i + 1}:`, content);
          }
        }
      } catch (error) {
        console.error(`❌ [${VINYL_FUNCTION_VERSION}] Error processing image ${i + 1}:`, error);
      }
    }

    console.log(`🎵 [${VINYL_FUNCTION_VERSION}] Starting Discogs search and pricing lookup...`);
    
    // Combine results from all images
    const combinedResult = {
      catalog_number: null as string | null,
      matrix_number: null as string | null,
      artist: null as string | null,
      title: null as string | null,
      year: null as string | null,
      format: null as string | null,
      label: null as string | null,
      barcode: null as string | null,
      genre: null as string | null,
      country: null as string | null,
      additional_info: null as string | null
    };

    // Extract data from each image analysis
    for (const result of imageAnalysisResults) {
      if (result.catalog_number && !combinedResult.catalog_number) {
        combinedResult.catalog_number = result.catalog_number;
      }
      if (result.matrix_number && !combinedResult.matrix_number) {
        combinedResult.matrix_number = result.matrix_number;
      }
      if (result.artist && !combinedResult.artist) {
        combinedResult.artist = result.artist;
      }
      if (result.title && !combinedResult.title) {
        combinedResult.title = result.title;
      }
      if (result.year && !combinedResult.year) {
        combinedResult.year = result.year;
      }
      if (result.format && !combinedResult.format) {
        combinedResult.format = result.format;
      }
      if (result.label && !combinedResult.label) {
        combinedResult.label = result.label;
      }
      if (result.barcode && !combinedResult.barcode) {
        combinedResult.barcode = result.barcode;
      }
      if (result.genre && !combinedResult.genre) {
        combinedResult.genre = result.genre;
      }
      if (result.country && !combinedResult.country) {
        combinedResult.country = result.country;
      }
      if (result.additional_info && !combinedResult.additional_info) {
        combinedResult.additional_info = result.additional_info;
      }
    }

    console.log(`🎯 [${VINYL_FUNCTION_VERSION}] Combined OCR results:`, JSON.stringify(combinedResult, null, 2));

    console.log(`🔍 [${VINYL_FUNCTION_VERSION}] Search params: Artist="${combinedResult.artist}", Title="${combinedResult.title}", Catalog="${combinedResult.catalog_number}"`);

    // Search Discogs
    let discogsResult = null;
    let pricingData = null;

    if (combinedResult.artist || combinedResult.title || combinedResult.catalog_number) {
      console.log(`🔍 [${VINYL_FUNCTION_VERSION}] Searching Discogs for: {
  artist: "${combinedResult.artist}",
  title: "${combinedResult.title}",
  catalogNumber: "${combinedResult.catalog_number}"
}`);

      discogsResult = await searchDiscogsReleaseV3(
        combinedResult.artist || '',
        combinedResult.title || '',
        combinedResult.catalog_number
      );

      if (discogsResult) {
        console.log(`🎯 [${VINYL_FUNCTION_VERSION}] Discogs search result:`, JSON.stringify(discogsResult, null, 2));
        
        console.log(`💰 [${VINYL_FUNCTION_VERSION}] Getting pricing data for release ${discogsResult.discogs_id}`);
        pricingData = await getDiscogsPriceAnalysisByIdV3(discogsResult.discogs_id);
        
        if (pricingData) {
          console.log(`💰 [${VINYL_FUNCTION_VERSION}] Pricing data retrieved:`, JSON.stringify(pricingData, null, 2));
        } else {
          console.log(`💰 [${VINYL_FUNCTION_VERSION}] No pricing data available for this release`);
        }
      } else {
        console.log(`📭 [${VINYL_FUNCTION_VERSION}] No Discogs results found`);
      }
    } else {
      console.log(`⚠️ [${VINYL_FUNCTION_VERSION}] Insufficient data for Discogs search`);
    }

    // CRITICAL: NO DATABASE SAVE - ONLY RETURN DATA
    console.log(`✅ [${VINYL_FUNCTION_VERSION}] VINYL ANALYSIS COMPLETED - ABSOLUTELY NO DATABASE SAVE!`);
    console.log(`🔒 [${VINYL_FUNCTION_VERSION}] Frontend will handle all saves after condition selection.`);
    
    return new Response(JSON.stringify({ 
      success: true,
      version: VINYL_FUNCTION_VERSION,
      deployment: VINYL_DEPLOYMENT_TIMESTAMP,
      ocr_results: combinedResult,
      discogs_data: discogsResult,
      pricing_data: pricingData,
      message: `Analysis completed with ${VINYL_FUNCTION_VERSION} - NO database save performed`
    }), {
      headers: { ...corsHeadersV3, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`❌ [${VINYL_FUNCTION_VERSION}] ANALYSIS ERROR:`, error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Analysis failed',
      version: VINYL_FUNCTION_VERSION,
      deployment: VINYL_DEPLOYMENT_TIMESTAMP
    }), {
      status: 500,
      headers: { ...corsHeadersV3, 'Content-Type': 'application/json' }
    });
  }
}