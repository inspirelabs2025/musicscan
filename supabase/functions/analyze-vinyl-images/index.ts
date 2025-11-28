// COMPLETE REWRITE - FORCE CACHE BUST V4.0.0-MEGA-CACHE-BUST
// DEPLOYMENT ID: VINYL_ANALYSIS_V4_FORCE_REDEPLOY
// CRITICAL: ABSOLUTELY NO DATABASE SAVES - FRONTEND ONLY SAVES

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// V4.0.0 VERSION CONSTANTS - FORCE NEW DEPLOYMENT
const VINYL_FUNCTION_VERSION_V4: string = "V4.0.0-MEGA-CACHE-BUST-NO-DB-SAVES";
const VINYL_DEPLOYMENT_TIMESTAMP_V4: number = Date.now();

// Environment variables
const OPENAI_API_KEY_V4 = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL_V4 = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY_V4 = Deno.env.get('SUPABASE_ANON_KEY');
const DISCOGS_CONSUMER_KEY_V4 = Deno.env.get('DISCOGS_CONSUMER_KEY');
const DISCOGS_CONSUMER_SECRET_V4 = Deno.env.get('DISCOGS_CONSUMER_SECRET');

console.log(`🚀 VINYL ANALYSIS FUNCTION ${VINYL_FUNCTION_VERSION_V4} INITIALIZING`);
console.log(`⚠️  CRITICAL: NO DATABASE SAVES IN THIS VERSION!`);
console.log(`📋 DEPLOYMENT TIMESTAMP: ${VINYL_DEPLOYMENT_TIMESTAMP_V4}`);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// V4 Helper Functions - All renamed to force cache invalidation
function cleanJsonFromMarkdownV4(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

const normalizeTextV4 = (text: string): string => {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const levenshteinDistanceV4 = (str1: string, str2: string): number => {
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

const calculateSimilarityV4 = (str1: string, str2: string): number => {
  const distance = levenshteinDistanceV4(normalizeTextV4(str1), normalizeTextV4(str2));
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
};

const generateCatalogVariantsV4 = (catalogNumber: string): string[] => {
  const variants = [catalogNumber];
  const cleanCatalog = catalogNumber.replace(/[\s\-_.]/g, '');
  variants.push(cleanCatalog);
  
  if (catalogNumber.includes(' ')) {
    variants.push(catalogNumber.replace(/\s/g, '.'));
    variants.push(catalogNumber.replace(/\s/g, '-'));
    variants.push(catalogNumber.replace(/\s/g, '_'));
  }
  
  return [...new Set(variants)];
};

// V4 Discogs Integration - Completely rewritten
async function searchDiscogsReleaseV4(artist: string, title: string, catalogNumber: string | null) {
  console.log(`🔍 [${VINYL_FUNCTION_VERSION_V4}] Searching Discogs for: {
  artist: "${artist}",
  title: "${title}",
  catalogNumber: "${catalogNumber}"
}`);

  if (!DISCOGS_CONSUMER_KEY_V4 || !DISCOGS_CONSUMER_SECRET_V4) {
    console.log(`🔐 [${VINYL_FUNCTION_VERSION_V4}] Missing Discogs credentials`);
    return null;
  }

  console.log(`🔐 [${VINYL_FUNCTION_VERSION_V4}] Checking Discogs API credentials... { hasKey: ${!!DISCOGS_CONSUMER_KEY_V4}, hasSecret: ${!!DISCOGS_CONSUMER_SECRET_V4}, keyLength: ${DISCOGS_CONSUMER_KEY_V4?.length}, secretLength: ${DISCOGS_CONSUMER_SECRET_V4?.length} }`);

  const searchStrategiesV4: Array<{ strategy: string; query: string; priority: number }> = [];

  // Add catalog variants
  if (catalogNumber) {
    const catalogVariantsV4 = generateCatalogVariantsV4(catalogNumber);
    console.log(`📋 [${VINYL_FUNCTION_VERSION_V4}] Catalog variants to try: ${JSON.stringify(catalogVariantsV4)}`);
    
    catalogVariantsV4.forEach((variant, index) => {
      searchStrategiesV4.push({
        strategy: `catalog-variant-${variant}`,
        query: variant,
        priority: index + 1
      });
    });
  }

  // Add artist strategies
  if (artist) {
    searchStrategiesV4.push({
      strategy: `artist-exact`,
      query: `"${artist}"`,
      priority: 100
    });
  }

  // Add title strategies
  if (title) {
    searchStrategiesV4.push({
      strategy: `title-exact`,
      query: `"${title}"`,
      priority: 101
    });
  }

  // Add combined strategies
  if (artist && title) {
    searchStrategiesV4.push({
      strategy: `artist-title-combined`,
      query: `"${artist}" "${title}"`,
      priority: 102
    });
  }

  searchStrategiesV4.sort((a, b) => a.priority - b.priority);
  console.log(`🎯 [${VINYL_FUNCTION_VERSION_V4}] Will try ${searchStrategiesV4.length} search strategies`);

  for (const { strategy, query, priority } of searchStrategiesV4) {
    console.log(`🎯 [${VINYL_FUNCTION_VERSION_V4}] Trying search strategy: ${strategy} (priority ${priority})`);
    
    const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&per_page=25&catno=${encodeURIComponent(query)}`;
    console.log(`🔗 [${VINYL_FUNCTION_VERSION_V4}] Search URL: ${searchUrl}`);

    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'VinylAnalyzer/1.0 +https://example.com',
          'Authorization': `Discogs key=${DISCOGS_CONSUMER_KEY_V4}, secret=${DISCOGS_CONSUMER_SECRET_V4}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 [${VINYL_FUNCTION_VERSION_V4}] Strategy ${strategy} returned ${data.results?.length || 0} results`);

        if (data.results && data.results.length > 0) {
          for (const result of data.results) {
            let scoreV4 = 0;

            if (catalogNumber && result.catno) {
              const catalogSimilarityV4 = calculateSimilarityV4(catalogNumber, result.catno);
              console.log(`📋 [${VINYL_FUNCTION_VERSION_V4}] Catalog similarity for "${result.catno}": ${catalogSimilarityV4.toFixed(2)}`);
              scoreV4 += catalogSimilarityV4 * 30;
            }

            if (title && result.title) {
              const titleSimilarityV4 = calculateSimilarityV4(title, result.title);
              console.log(`🎵 [${VINYL_FUNCTION_VERSION_V4}] Title similarity for "${result.title}": ${titleSimilarityV4.toFixed(2)}`);
              scoreV4 += titleSimilarityV4 * 30;
            }

            scoreV4 += 10; // Base score

            console.log(`📊 [${VINYL_FUNCTION_VERSION_V4}] Result "${result.title}" (ID: ${result.id}) scored: ${scoreV4.toFixed(2)}`);

            if (scoreV4 >= 50) {
              console.log(`✅ [${VINYL_FUNCTION_VERSION_V4}] Found Discogs release using ${strategy} with score ${scoreV4.toFixed(2)}: ${result.id}`);
              
              const discogsResultV4 = {
                discogs_id: result.id,
                discogs_url: `https://www.discogs.com/release/${result.id}`,
                strategy_used: strategy,
                match_score: Math.round(scoreV4)
              };

              console.log(`🎯 [${VINYL_FUNCTION_VERSION_V4}] Discogs search result: ${JSON.stringify(discogsResultV4)}`);
              return discogsResultV4;
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ [${VINYL_FUNCTION_VERSION_V4}] Error with strategy ${strategy}:`, error);
    }
  }

  console.log(`❌ [${VINYL_FUNCTION_VERSION_V4}] No suitable Discogs release found after trying all strategies`);
  return null;
}

interface DiscogsListingV4 {
  price: {
    value: number;
    currency: string;
  };
  condition: string;
  seller: {
    username: string;
  };
  shipping_price?: {
    value: number;
    currency: string;
  };
}

function flexibleConditionsMatchV4(requestedCondition: string, discogsCondition: string): boolean {
  const conditionMappingV4: { [key: string]: string[] } = {
    'Very Good': ['Very Good (VG)', 'VG', 'Very Good', 'Good Plus (G+)', 'G+'],
    'Near Mint': ['Near Mint (NM or M-)', 'NM', 'Near Mint', 'Mint (M)', 'M'],
    'Good': ['Good (G)', 'G', 'Good', 'Good Plus (G+)', 'G+'],
    'Fair': ['Fair (F)', 'F', 'Fair', 'Poor (P)', 'P'],
    'Mint': ['Mint (M)', 'M', 'Mint', 'Near Mint (NM or M-)', 'NM']
  };

  const requestedNormalized = requestedCondition.toLowerCase();
  const discogsNormalized = discogsCondition.toLowerCase();

  if (requestedNormalized === discogsNormalized) return true;

  for (const [condition, variants] of Object.entries(conditionMappingV4)) {
    if (condition.toLowerCase() === requestedNormalized) {
      return variants.some(variant => variant.toLowerCase() === discogsNormalized);
    }
  }

  return false;
}

async function getDiscogsPriceAnalysisByIdV4(releaseId: number, condition: string = 'Very Good') {
  console.log(`🔍 [${VINYL_FUNCTION_VERSION_V4}] Starting price analysis for release ${releaseId}`);

  try {
    const statsUrl = `https://api.discogs.com/releases/${releaseId}/stats`;
    const statsResponse = await fetch(statsUrl, {
      headers: {
        'User-Agent': 'VinylAnalyzer/1.0 +https://example.com',
        'Authorization': `Discogs key=${DISCOGS_CONSUMER_KEY_V4}, secret=${DISCOGS_CONSUMER_SECRET_V4}`
      }
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log(`💰 [${VINYL_FUNCTION_VERSION_V4}] Stats API result: Low: ${statsData.lowest_price?.value}, Median: ${statsData.median_price?.value}, High: ${statsData.highest_price?.value}, For Sale: ${statsData.num_for_sale}`);
      console.log(`📊 [${VINYL_FUNCTION_VERSION_V4}] Raw marketplace stats response: ${JSON.stringify(statsData)}`);

      if (!statsData.median_price || statsData.median_price.value === null) {
        console.log(`🔄 [${VINYL_FUNCTION_VERSION_V4}] Stats API missing median_price, falling back to listings`);
        return await fallbackToMarketplaceListingsV4(releaseId, condition);
      }

      const pricingDataV4 = {
        lowest_price: statsData.lowest_price?.value || null,
        median_price: statsData.median_price?.value || null,
        highest_price: statsData.highest_price?.value || null,
        num_for_sale: statsData.num_for_sale || 0,
        currency: statsData.lowest_price?.currency || 'EUR'
      };

      console.log(`💰 [${VINYL_FUNCTION_VERSION_V4}] Pricing data retrieved: ${JSON.stringify(pricingDataV4)}`);
      return pricingDataV4;
    }
  } catch (error) {
    console.error(`❌ [${VINYL_FUNCTION_VERSION_V4}] Stats API error:`, error);
  }

  return await fallbackToMarketplaceListingsV4(releaseId, condition);
}

async function fallbackToMarketplaceListingsV4(releaseId: number, condition: string = 'Very Good') {
  console.log(`🔄 [${VINYL_FUNCTION_VERSION_V4}] Fetching marketplace listings for release ${releaseId}`);

  try {
    const listingsUrl = `https://api.discogs.com/releases/${releaseId}/marketplace`;
    const listingsResponse = await fetch(listingsUrl, {
      headers: {
        'User-Agent': 'VinylAnalyzer/1.0 +https://example.com',
        'Authorization': `Discogs key=${DISCOGS_CONSUMER_KEY_V4}, secret=${DISCOGS_CONSUMER_SECRET_V4}`
      }
    });

    if (!listingsResponse.ok) {
      console.error(`❌ [${VINYL_FUNCTION_VERSION_V4}] Discogs listings error: ${listingsResponse.status} ${listingsResponse.statusText} ${await listingsResponse.text()}`);
      return {
        lowest_price: null,
        median_price: null,
        highest_price: null,
        num_for_sale: 0,
        currency: 'EUR'
      };
    }

    const listingsData = await listingsResponse.json();
    const listings: DiscogsListingV4[] = listingsData.listings || [];

    const filteredListingsV4 = listings.filter(listing => 
      flexibleConditionsMatchV4(condition, listing.condition)
    );

    if (filteredListingsV4.length === 0) {
      console.log(`⚠️ [${VINYL_FUNCTION_VERSION_V4}] No listings found for condition: ${condition}`);
      return {
        lowest_price: null,
        median_price: null,
        highest_price: null,
        num_for_sale: 0,
        currency: 'EUR'
      };
    }

    const pricesV4 = filteredListingsV4
      .map(listing => listing.price.value)
      .filter(price => price > 0)
      .sort((a, b) => a - b);

    if (pricesV4.length === 0) {
      return {
        lowest_price: null,
        median_price: null,
        highest_price: null,
        num_for_sale: 0,
        currency: 'EUR'
      };
    }

    const lowestPriceV4 = Math.min(...pricesV4);
    const highestPriceV4 = Math.max(...pricesV4);
    const medianPriceV4 = pricesV4.length % 2 === 0
      ? (pricesV4[pricesV4.length / 2 - 1] + pricesV4[pricesV4.length / 2]) / 2
      : pricesV4[Math.floor(pricesV4.length / 2)];

    const currencyV4 = filteredListingsV4[0]?.price?.currency || 'EUR';

    return {
      lowest_price: lowestPriceV4,
      median_price: medianPriceV4,
      highest_price: highestPriceV4,
      num_for_sale: filteredListingsV4.length,
      currency: currencyV4
    };

  } catch (error) {
    console.error(`❌ [${VINYL_FUNCTION_VERSION_V4}] Marketplace listings error:`, error);
    return {
      lowest_price: null,
      median_price: null,
      highest_price: null,
      num_for_sale: 0,
      currency: 'EUR'
    };
  }
}

// V4 Main Analysis Function - CRITICAL: NO DATABASE SAVES
async function executeVinylAnalysisV4(req: Request) {
  console.log(`🚀 [${VINYL_FUNCTION_VERSION_V4}] REQUEST RECEIVED AT: ${new Date().toISOString()}`);
  console.log(`📋 [${VINYL_FUNCTION_VERSION_V4}] DEPLOYMENT TIMESTAMP: ${VINYL_DEPLOYMENT_TIMESTAMP_V4}`);

  const requestBody = await req.json();
  
  // Support both imageUrls (URLs) and imageBase64 (base64 data URIs)
  const imageUrlsV4 = requestBody.imageUrls || requestBody.imageBase64 || [];

  console.log(`🎵 [${VINYL_FUNCTION_VERSION_V4}] Starting vinyl image analysis...`);
  console.log(`📸 [${VINYL_FUNCTION_VERSION_V4}] Processing ${imageUrlsV4.length} images`);
  console.log(`📸 [${VINYL_FUNCTION_VERSION_V4}] Image type: ${requestBody.imageBase64 ? 'base64' : 'URL'}`);

  if (!OPENAI_API_KEY_V4) {
    throw new Error('OpenAI API key not configured');
  }

  if (!imageUrlsV4 || imageUrlsV4.length === 0) {
    throw new Error('No images provided. Send imageUrls or imageBase64 array.');
  }

  console.log(`🔍 [${VINYL_FUNCTION_VERSION_V4}] Analyzing images with OpenAI Vision...`);

  const analysisResultsV4 = [];

  for (let i = 0; i < imageUrlsV4.length; i++) {
    console.log(`📸 [${VINYL_FUNCTION_VERSION_V4}] Processing image ${i + 1}/${imageUrlsV4.length}...`);
    
    const openaiResponseV4 = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY_V4}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this vinyl record image and extract information. Return ONLY a JSON object with these fields:
- catalog_number: The catalog number (e.g., "ABC-123")
- matrix_number: Matrix/runout numbers from the center label
- artist: Artist name
- title: Album title
- year: Release year (number)
- format: "LP" or "7\""
- label: Record label name
- barcode: Barcode if visible
- genre: Music genre
- country: Country of release
- additional_info: Any other relevant information
- confidence: Your confidence level (0.0-1.0)

Be precise and only include information you can clearly see in the image.`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrlsV4[i] }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    const openaiDataV4 = await openaiResponseV4.json();
    const contentV4 = openaiDataV4.choices[0].message.content;
    
    try {
      const cleanedJsonV4 = cleanJsonFromMarkdownV4(contentV4);
      const parsedResultV4 = JSON.parse(cleanedJsonV4);
      
      console.log(`✅ [${VINYL_FUNCTION_VERSION_V4}] Image ${i + 1} analysis result: ${JSON.stringify(parsedResultV4)}`);
      console.log(`🧹 [${VINYL_FUNCTION_VERSION_V4}] Cleaned result for image ${i + 1}: ${JSON.stringify(parsedResultV4)}`);
      
      analysisResultsV4.push(parsedResultV4);
    } catch (parseError) {
      console.error(`❌ [${VINYL_FUNCTION_VERSION_V4}] Failed to parse image ${i + 1} result:`, parseError);
    }
  }

  // Combine analysis results
  const combinedResultV4: any = {};
  
  for (const result of analysisResultsV4) {
    for (const [key, value] of Object.entries(result)) {
      if (value && value !== "Not visible" && value !== "") {
        if (!combinedResultV4[key] || 
            (typeof value === 'string' && value.length > (combinedResultV4[key]?.length || 0))) {
          combinedResultV4[key] = value;
        }
      }
    }
  }

  console.log(`🎯 [${VINYL_FUNCTION_VERSION_V4}] Combined OCR results: ${JSON.stringify(combinedResultV4)}`);

  // Search Discogs - NO AUTOMATIC SAVES
  console.log(`🎵 [${VINYL_FUNCTION_VERSION_V4}] Starting Discogs search and pricing lookup...`);
  console.log(`🔍 [${VINYL_FUNCTION_VERSION_V4}] Search params: Artist="${combinedResultV4.artist}", Title="${combinedResultV4.title}", Catalog="${combinedResultV4.catalog_number}"`);

  const discogsResultV4 = await searchDiscogsReleaseV4(
    combinedResultV4.artist,
    combinedResultV4.title,
    combinedResultV4.catalog_number
  );

  let pricingDataV4 = null;
  if (discogsResultV4) {
    console.log(`💰 [${VINYL_FUNCTION_VERSION_V4}] Getting pricing data for release ${discogsResultV4.discogs_id}`);
    pricingDataV4 = await getDiscogsPriceAnalysisByIdV4(discogsResultV4.discogs_id);
  }

  // CRITICAL: NO DATABASE SAVE - Only return data for frontend
  console.log(`✅ [${VINYL_FUNCTION_VERSION_V4}] VINYL ANALYSIS COMPLETED - ABSOLUTELY NO DATABASE SAVE!`);
  console.log(`🔒 [${VINYL_FUNCTION_VERSION_V4}] Frontend will handle all saves after condition selection.`);

  const finalResponseV4 = {
    success: true,
    analysis: combinedResultV4,
    discogs: discogsResultV4,
    pricing: pricingDataV4,
    version: VINYL_FUNCTION_VERSION_V4,
    deployment_timestamp: VINYL_DEPLOYMENT_TIMESTAMP_V4,
    message: "ANALYSIS COMPLETE - NO DATABASE SAVE PERFORMED",
    save_method: "FRONTEND_ONLY_AFTER_CONDITION_SELECTION"
  };

  return finalResponseV4;
}

// Main serve function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resultV4 = await executeVinylAnalysisV4(req);
    
    return new Response(JSON.stringify(resultV4), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`❌ [${VINYL_FUNCTION_VERSION_V4}] Error:`, error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      version: VINYL_FUNCTION_VERSION_V4,
      deployment_timestamp: VINYL_DEPLOYMENT_TIMESTAMP_V4 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});