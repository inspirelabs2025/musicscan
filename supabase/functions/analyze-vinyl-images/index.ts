// OPTIMIZED V5.0 - Uses Lovable AI Gateway for faster analysis
// All images analyzed in single call instead of sequential calls

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VINYL_FUNCTION_VERSION = "V5.0-OPTIMIZED-SINGLE-CALL";
const VINYL_DEPLOYMENT_TIMESTAMP = Date.now();

// Use Lovable API key (faster, no extra cost) with OpenAI fallback
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const OPENAI_API_KEY_V4 = Deno.env.get('OPENAI_API_KEY');
const DISCOGS_CONSUMER_KEY_V4 = Deno.env.get('DISCOGS_CONSUMER_KEY');
const DISCOGS_CONSUMER_SECRET_V4 = Deno.env.get('DISCOGS_CONSUMER_SECRET');

console.log(`🚀 VINYL ANALYSIS ${VINYL_FUNCTION_VERSION} - Single-call optimization`);
console.log(`🔑 Using: ${LOVABLE_API_KEY ? 'Lovable AI Gateway' : 'OpenAI API'}`);

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

// V5 Main Analysis Function - OPTIMIZED SINGLE CALL
async function executeVinylAnalysisV5(req: Request) {
  console.log(`🚀 [${VINYL_FUNCTION_VERSION}] REQUEST RECEIVED AT: ${new Date().toISOString()}`);

  const requestBody = await req.json();
  const imageUrls = requestBody.imageUrls || requestBody.imageBase64 || [];

  console.log(`📸 [${VINYL_FUNCTION_VERSION}] Processing ${imageUrls.length} images in SINGLE CALL`);

  if (!imageUrls || imageUrls.length === 0) {
    throw new Error('No images provided');
  }

  // Use Lovable API Gateway if available, fallback to OpenAI
  const apiKey = LOVABLE_API_KEY || OPENAI_API_KEY_V4;
  const apiUrl = LOVABLE_API_KEY 
    ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  const model = LOVABLE_API_KEY ? 'google/gemini-2.5-flash' : 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('No API key configured (LOVABLE_API_KEY or OPENAI_API_KEY)');
  }

  console.log(`🤖 [${VINYL_FUNCTION_VERSION}] Using ${LOVABLE_API_KEY ? 'Lovable Gateway' : 'OpenAI'} with model: ${model}`);

  // Build image content for ALL images in single call
  const imageContents = imageUrls.map((url: string, i: number) => ({
    type: 'image_url',
    image_url: { url }
  }));

  const prompt = `Analyze ALL these vinyl record images together and extract information.

Look at all images (front cover, back cover, label, matrix) and combine the information.

Return ONLY a valid JSON object with:
{
  "artist": "Artist name",
  "title": "Album title",
  "label": "Record label",
  "catalog_number": "Catalog number (e.g. CBS 85224)",
  "barcode": "Barcode if visible",
  "year": 1985,
  "format": "LP or 7\"",
  "genre": "Genre",
  "country": "Country",
  "matrix_number": "Matrix/runout etchings",
  "confidence": 0.9
}

Be precise. Use null for fields you cannot determine.`;

  const startTime = Date.now();
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageContents
        ]
      }],
      max_tokens: 1000,
    })
  });

  const aiTime = Date.now() - startTime;
  console.log(`⚡ [${VINYL_FUNCTION_VERSION}] AI analysis completed in ${aiTime}ms`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ AI API error: ${response.status}`, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // Parse JSON
  let analysis;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    analysis = {};
  }

  console.log(`🎯 [${VINYL_FUNCTION_VERSION}] OCR result:`, analysis);

  // Quick Discogs search if we have data
  let discogsResult = null;
  let pricingData = null;

  if (analysis.catalog_number || analysis.artist || analysis.title) {
    console.log(`🔍 [${VINYL_FUNCTION_VERSION}] Searching Discogs...`);
    discogsResult = await searchDiscogsReleaseV4(
      analysis.artist || '',
      analysis.title || '',
      analysis.catalog_number || ''
    );

    if (discogsResult) {
      pricingData = await getDiscogsPriceAnalysisByIdV4(discogsResult.discogs_id);
    }
  }

  const totalTime = Date.now() - startTime;
  console.log(`✅ [${VINYL_FUNCTION_VERSION}] COMPLETED in ${totalTime}ms (AI: ${aiTime}ms)`);

  return {
    success: true,
    analysis,
    combinedResults: analysis,
    discogs: discogsResult,
    pricing: pricingData,
    version: VINYL_FUNCTION_VERSION,
    timing: { total: totalTime, ai: aiTime }
  };
}

// Main serve function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await executeVinylAnalysisV5(req);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`❌ [${VINYL_FUNCTION_VERSION}] Error:`, error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      version: VINYL_FUNCTION_VERSION 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});