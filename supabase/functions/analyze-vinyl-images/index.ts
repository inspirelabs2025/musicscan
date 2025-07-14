import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const discogsConsumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY');
const discogsConsumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET');
const discogsToken = Deno.env.get('DISCOGS_TOKEN');

// Function to clean JSON from markdown code blocks
function cleanJsonFromMarkdown(text: string): string {
  // Remove markdown code blocks (```json ... ``` or ``` ... ```)
  let cleaned = text.replace(/```json\s*\n/g, '').replace(/```\s*\n/g, '').replace(/\n```/g, '').replace(/```/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Find the first { and last } to extract just the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

// Helper function to normalize text for comparison (removes accents, converts to lowercase)
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// Helper function to calculate Levenshtein distance
const levenshteinDistance = (str1: string, str2: string): number => {
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
const calculateSimilarity = (str1: string, str2: string): number => {
  const distance = levenshteinDistance(normalizeText(str1), normalizeText(str2));
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
};

// Helper function to generate catalog number variants
const generateCatalogVariants = (catalogNumber: string): string[] => {
  if (!catalogNumber) return [];
  
  const variants = new Set<string>();
  const cleaned = catalogNumber.trim();
  
  // Add original
  variants.add(cleaned);
  
  // Add without spaces
  variants.add(cleaned.replace(/\s+/g, ''));
  
  // Add with different separators
  variants.add(cleaned.replace(/[.\-_]/g, ' '));
  variants.add(cleaned.replace(/\s+/g, '.'));
  variants.add(cleaned.replace(/\s+/g, '-'));
  variants.add(cleaned.replace(/\s+/g, '_'));
  
  // Add with spaces around separators
  variants.add(cleaned.replace(/([.\-_])/g, ' $1 ').replace(/\s+/g, ' '));
  
  return Array.from(variants);
};

// Function to search Discogs for releases with improved search strategy
async function searchDiscogsRelease(artist: string, title: string, catalogNumber: string | null) {
  console.log('🔐 Checking Discogs API credentials...', {
    hasKey: !!discogsConsumerKey,
    hasSecret: !!discogsConsumerSecret,
    keyLength: discogsConsumerKey?.length || 0,
    secretLength: discogsConsumerSecret?.length || 0
  });
  
  if (!discogsConsumerKey || !discogsConsumerSecret) {
    console.log('⚠️ Discogs API keys not configured, skipping Discogs search');
    return null;
  }

  try {
    console.log('🔍 Searching Discogs for:', { artist, title, catalogNumber });
    
    // Normalize input data
    const normalizedArtist = artist ? normalizeText(artist) : '';
    const normalizedTitle = title ? normalizeText(title) : '';
    
    // Generate catalog number variants
    const catalogVariants = catalogNumber ? generateCatalogVariants(catalogNumber) : [];
    console.log('📋 Catalog variants to try:', catalogVariants);
    
    // Try multiple search strategies with catalog variants
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
        // Try both normalized and original versions
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
    
    // Strategy 3: Artist + Title only (normalized and original)
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
    
    // Sort strategies by priority
    searchStrategies.sort((a, b) => a.priority - b.priority);
    
    console.log(`🎯 Will try ${searchStrategies.length} search strategies`);
    
    // Try each strategy until we find results
    for (const strategy of searchStrategies) {
      console.log(`🎯 Trying search strategy: ${strategy.name} (priority ${strategy.priority})`);
      
      const params = new URLSearchParams({
        q: strategy.query,
        type: 'release',
        per_page: '25',
        ...strategy.params
      });
      
      const searchUrl = `https://api.discogs.com/database/search?${params.toString()}`;
      console.log(`🔗 Search URL: ${searchUrl}`);
      
      const headers: Record<string, string> = {
        'User-Agent': 'VinylScanner/1.0',
        'Authorization': `Discogs key=${discogsConsumerKey}, secret=${discogsConsumerSecret}`
      };
      
      const response = await fetch(searchUrl, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Discogs search failed for ${strategy.name}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: searchUrl
        });
        continue;
      }
      
      const data = await response.json();
      console.log(`📊 Strategy ${strategy.name} returned ${data.results?.length || 0} results`);
      
      if (data.results && data.results.length > 0) {
        // Enhanced matching with similarity scoring
        let bestMatch = null;
        let bestScore = 0;
        
        for (const result of data.results) {
          let score = 0;
          
          // Score based on catalog number matching
          if (catalogNumber && result.catno) {
            const catalogSimilarity = calculateSimilarity(catalogNumber, result.catno);
            score += catalogSimilarity * 40; // High weight for catalog match
            console.log(`📋 Catalog similarity for "${result.catno}": ${catalogSimilarity.toFixed(2)}`);
          }
          
          // Score based on artist matching
          if (artist && result.artist) {
            const artistSimilarity = calculateSimilarity(artist, result.title.split(' - ')[0] || result.artist);
            score += artistSimilarity * 30; // High weight for artist match
            console.log(`🎤 Artist similarity for "${result.title}": ${artistSimilarity.toFixed(2)}`);
          }
          
          // Score based on title matching
          if (title && result.title) {
            const titlePart = result.title.includes(' - ') ? result.title.split(' - ')[1] : result.title;
            const titleSimilarity = calculateSimilarity(title, titlePart);
            score += titleSimilarity * 30; // High weight for title match
            console.log(`🎵 Title similarity for "${titlePart}": ${titleSimilarity.toFixed(2)}`);
          }
          
          console.log(`📊 Result "${result.title}" (ID: ${result.id}) scored: ${score.toFixed(2)}`);
          
          if (score > bestScore && score > 50) { // Minimum threshold
            bestScore = score;
            bestMatch = result;
          }
        }
        
        // Fallback to first result if no good match found
        if (!bestMatch && data.results.length > 0) {
          bestMatch = data.results[0];
          console.log('🔄 Using fallback to first result');
        }
        
        if (bestMatch) {
          console.log(`✅ Found Discogs release using ${strategy.name} with score ${bestScore.toFixed(2)}:`, bestMatch.id);
          return {
            discogs_id: bestMatch.id,
            discogs_url: `https://www.discogs.com/release/${bestMatch.id}`,
            strategy_used: strategy.name,
            match_score: bestScore
          };
        }
      }
      
      console.log(`📭 No suitable results for strategy: ${strategy.name}`);
    }
    
    console.log('📭 No Discogs results found with any strategy');
    return null;
  } catch (error) {
    console.error('❌ Error searching Discogs:', error);
    return null;
  }
}

// Interface for Discogs listing data
interface DiscogsListing {
  price: number;
  currency: string;
  condition: string;
  sleeve_condition: string;
  shipping_price?: number;
  seller_location?: string;
}

// Helper function for flexible condition matching
function flexibleConditionsMatch(requestedCondition: string, discogsCondition: string): boolean {
  if (!requestedCondition || !discogsCondition) return false;
  
  const normalize = (str: string) => str.toLowerCase().trim();
  const requested = normalize(requestedCondition);
  const discogs = normalize(discogsCondition);
  
  // Exact match
  if (requested === discogs) return true;
  
  // Check for partial matches
  if (requested.includes(discogs) || discogs.includes(requested)) return true;
  
  // Map common condition variations
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
async function getDiscogsPriceAnalysisById(
  releaseId: number, 
  condition: string = 'Very Good'
) {
  if (!releaseId || !discogsConsumerKey || !discogsConsumerSecret) {
    console.log('❌ Missing releaseId or Discogs API keys for price analysis');
    return null;
  }

  try {
    console.log(`🔍 Starting price analysis for release ${releaseId}`);
    
    // Try marketplace stats endpoint first
    const statsUrl = `https://api.discogs.com/marketplace/stats/${releaseId}`;
    
    const statsRes = await fetch(statsUrl, {
      headers: {
        "Authorization": `Discogs token=${discogsToken}`,
        "User-Agent": "VinylVoyager/1.0",
        "Accept": "application/json"
      }
    });

    if (!statsRes.ok) {
      const errorText = await statsRes.text();
      console.warn(`❌ Discogs stats error: ${statsRes.status} ${statsRes.statusText}`, errorText);
      return await fallbackToMarketplaceListings(releaseId, condition);
    }

    const statsData = await statsRes.json();
    
    console.log(`📊 Raw marketplace stats response:`, JSON.stringify(statsData, null, 2));

    // Extract the statistics directly from the API response
    const result = {
      lowest_price: statsData.lowest_price?.value || null,
      median_price: statsData.median_price?.value || null, 
      highest_price: statsData.highest_price?.value || null,
      num_for_sale: statsData.num_for_sale || 0,
      currency: statsData.lowest_price?.currency || 'EUR'
    };

    console.log(`💰 Stats API result: Low: ${result.lowest_price}, Median: ${result.median_price}, High: ${result.highest_price}, For Sale: ${result.num_for_sale}`);

    // If we're missing median price, fall back to listings to get it
    if (!result.median_price) {
      console.log(`🔄 Stats API missing median_price, falling back to listings`);
      const listingsResult = await fallbackToMarketplaceListings(releaseId, condition);
      
      if (listingsResult) {
        // Merge results, using listings data for median_price
        return {
          lowest_price: result.lowest_price || listingsResult.lowest_price,
          median_price: listingsResult.median_price, // Always use listings median
          highest_price: result.highest_price || listingsResult.highest_price,
          num_for_sale: result.num_for_sale || listingsResult.num_for_sale,
          currency: result.currency || listingsResult.currency
        };
      }
    }

    return result;
  } catch (err) {
    console.error("❌ Discogs price analysis by ID failed:", err);
    return await fallbackToMarketplaceListings(releaseId, condition);
  }
}

// Fallback function to get pricing from marketplace listings
async function fallbackToMarketplaceListings(releaseId: number, condition: string = 'Very Good') {
  try {
    console.log(`🔄 Fetching marketplace listings for release ${releaseId}`);
    
    const listingsUrl = `https://api.discogs.com/marketplace/listings?release_id=${releaseId}&page=1&per_page=100`;
    
    const listingsRes = await fetch(listingsUrl, {
      headers: {
        "Authorization": `Discogs token=${discogsToken}`,
        "User-Agent": "VinylVoyager/1.0",
        "Accept": "application/json"
      }
    });

    if (!listingsRes.ok) {
      const errorText = await listingsRes.text();
      console.warn(`❌ Discogs listings error: ${listingsRes.status} ${listingsRes.statusText}`, errorText);
      return null;
    }

    const listingsData = await listingsRes.json();
    console.log(`📋 Found ${listingsData.listings?.length || 0} listings`);

    if (!listingsData.listings || listingsData.listings.length === 0) {
      console.log(`📭 No listings found for release ${releaseId}`);
      return null;
    }

    // Extract prices from listings
    const prices: number[] = [];
    
    for (const listing of listingsData.listings) {
      if (listing.price?.value && typeof listing.price.value === 'number') {
        prices.push(listing.price.value);
      }
    }

    if (prices.length === 0) {
      console.log(`💰 No valid prices found in listings`);
      return null;
    }

    // Sort prices to calculate statistics
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

    console.log(`💰 Calculated from listings: Low: ${result.lowest_price}, Median: ${result.median_price}, High: ${result.highest_price}, For Sale: ${result.num_for_sale}`);
    
    return result;
  } catch (err) {
    console.error("❌ Marketplace listings fallback failed:", err);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting vinyl image analysis...');
    
    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { imageUrls, scanId } = await req.json();
    
    if (!imageUrls || imageUrls.length !== 3) {
      throw new Error('Exact 3 image URLs required');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Analyze each image with OpenAI Vision
    const analysisPrompts = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this vinyl/CD image for CATALOG NUMBER identification. Extract:
            1. Catalog number (e.g., ABC-123, XYZ789, etc.)
            2. Any visible text or numbers that could be catalog identifiers
            3. Record label name if visible
            4. Any alphanumeric codes
            
            Respond in JSON format:
            {
              "catalog_number": "found_number_or_null",
              "label": "record_label_or_null", 
              "additional_codes": ["code1", "code2"],
              "confidence": 0.0-1.0
            }`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrls[0] }
          }
        ]
      },
      {
        role: 'user', 
        content: [
          {
            type: 'text',
            text: `Analyze this vinyl/CD image for MATRIX NUMBER identification. Matrix numbers are usually etched or printed in the run-out groove area. Extract:
            1. Matrix number (etched numbers/letters in the runout)
            2. Stamper codes
            3. Any technical production codes
            4. Side identifiers (A/B, 1/2)
            
            Respond in JSON format:
            {
              "matrix_number": "found_matrix_or_null",
              "side": "A_or_B_or_null",
              "stamper_codes": ["code1", "code2"],
              "confidence": 0.0-1.0
            }`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrls[1] }
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'text', 
            text: `Analyze this vinyl/CD image for ADDITIONAL INFORMATION. Extract:
            1. Artist name
            2. Album/track title
            3. Year of release
            4. Format (LP, CD, 7", 12", etc.)
            5. Genre (Rock, Jazz, Pop, etc.)
            6. Country of release
            7. Any other identifying text
            8. Barcode if visible
            
            Respond in JSON format:
            {
              "artist": "artist_name_or_null",
              "title": "album_title_or_null",
              "year": "year_or_null",
              "format": "format_or_null",
              "genre": "genre_or_null",
              "country": "country_or_null",
              "barcode": "barcode_or_null",
              "additional_info": "any_other_text",
              "confidence": 0.0-1.0
            }`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrls[2] }
          }
        ]
      }
    ];

    console.log('🔍 Analyzing images with OpenAI Vision...');

    // Process each image analysis
    const analysisResults = [];
    
    for (let i = 0; i < analysisPrompts.length; i++) {
      console.log(`📸 Processing image ${i + 1}/3...`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [analysisPrompts[i]],
          max_tokens: 500,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.choices[0].message.content;
      
      console.log(`✅ Image ${i + 1} analysis result:`, result);
      
      // Clean markdown JSON blocks from OpenAI response
      const cleanedResult = cleanJsonFromMarkdown(result);
      console.log(`🧹 Cleaned result for image ${i + 1}:`, cleanedResult);
      
      try {
        const parsedResult = JSON.parse(cleanedResult);
        analysisResults.push({
          step: i + 1,
          type: ['catalog', 'matrix', 'additional'][i],
          analysis: parsedResult,
          raw_response: result
        });
      } catch (parseError) {
        console.error(`❌ Failed to parse JSON for image ${i + 1}:`, parseError);
        console.error('Original result:', result);
        console.error('Cleaned result:', cleanedResult);
        analysisResults.push({
          step: i + 1,
          type: ['catalog', 'matrix', 'additional'][i],
          analysis: null,
          raw_response: result,
          error: 'JSON parse failed'
        });
      }
    }

    // Combine results for database storage
    const combinedData = {
      catalog_number: analysisResults[0]?.analysis?.catalog_number || null,
      matrix_number: analysisResults[1]?.analysis?.matrix_number || null,
      artist: analysisResults[2]?.analysis?.artist || null,
      title: analysisResults[2]?.analysis?.title || null,
      year: analysisResults[2]?.analysis?.year || null,
      format: analysisResults[2]?.analysis?.format || null,
      label: analysisResults[0]?.analysis?.label || null,
      barcode: analysisResults[2]?.analysis?.barcode || null,
      genre: analysisResults[2]?.analysis?.genre || null,
      country: analysisResults[2]?.analysis?.country || null,
      additional_info: analysisResults[2]?.analysis?.additional_info || null
    };

    console.log('🎯 Combined OCR results:', combinedData);

    // Save comprehensive OCR results to database
    const { data: insertData, error: insertError } = await supabase
      .from('vinyl2_scan')
      .insert({
        catalog_image: imageUrls[0],
        matrix_image: imageUrls[1], 
        additional_image: imageUrls[2],
        catalog_number: combinedData.catalog_number,
        matrix_number: combinedData.matrix_number,
        artist: combinedData.artist,
        title: combinedData.title,
        year: combinedData.year ? parseInt(combinedData.year) : null,
        format: 'Vinyl',
        label: combinedData.label,
        genre: combinedData.genre,
        country: combinedData.country
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw insertError;
    }

    console.log('💾 Data saved to database:', insertData);

    // Perform Discogs search and pricing lookup
    let discogsData = null;
    let pricingData = { lowest_price: null, median_price: null, highest_price: null };
    
    if (combinedData.artist && combinedData.title) {
      console.log('🎵 Starting Discogs search and pricing lookup...');
      console.log(`🔍 Search params: Artist="${combinedData.artist}", Title="${combinedData.title}", Catalog="${combinedData.catalog_number}"`);
      
      // Test API credentials BEFORE calling search function
      console.log('🔑 API Status Check:', {
        openAI: !!openAIApiKey,
        discogsKey: !!discogsConsumerKey, 
        discogsSecret: !!discogsConsumerSecret,
        discogsKeyLength: discogsConsumerKey?.length || 0,
        discogsSecretLength: discogsConsumerSecret?.length || 0
      });
      
      discogsData = await searchDiscogsRelease(
        combinedData.artist, 
        combinedData.title, 
        combinedData.catalog_number
      );
      
      console.log('🎯 Discogs search result:', JSON.stringify(discogsData, null, 2));
      if (discogsData?.discogs_id) {
        pricingData = await getDiscogsPriceAnalysisById(
          discogsData.discogs_id, 
          'Very Good'
        );
        
        // Update database record with Discogs data
        const { error: updateError } = await supabase
          .from('vinyl2_scan')
          .update({
            discogs_id: discogsData.discogs_id,
            discogs_url: discogsData.discogs_url,
            lowest_price: pricingData.lowest_price,
            median_price: pricingData.median_price,
            highest_price: pricingData.highest_price
          })
          .eq('id', insertData.id);
          
        if (updateError) {
          console.error('❌ Failed to update with Discogs data:', updateError);
        } else {
          console.log('✅ Updated record with Discogs pricing data');
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      scanId: insertData.id,
      ocrResults: combinedData,
      analysisDetails: analysisResults,
      discogsData: discogsData,
      pricingData: pricingData,
      message: 'OCR analysis and Discogs pricing lookup completed successfully!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in analyze-vinyl-images function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});