const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Discogs API fallback function for pricing when scraping fails
const getDiscogsApiFallback = async (discogsId: string) => {
  try {
    console.log(`🔄 Attempting Discogs API fallback for ID: ${discogsId}`);
    
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    const discogsConsumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY');
    const discogsConsumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET');
    
    if (!discogsToken && (!discogsConsumerKey || !discogsConsumerSecret)) {
      console.log(`❌ No Discogs API credentials available for fallback`);
      return null;
    }
    
    const authHeaders = discogsToken 
      ? { 'Authorization': `Discogs token=${discogsToken}` }
      : { 'Authorization': `Discogs key=${discogsConsumerKey}, secret=${discogsConsumerSecret}` };
    
    const apiUrl = `https://api.discogs.com/releases/${discogsId}`;
    const response = await fetch(apiUrl, {
      headers: {
        ...authHeaders,
        'User-Agent': 'VinylScanner/2.0'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ Discogs API fallback failed: ${response.status}`);
      return null;
    }
    
    const releaseData = await response.json();
    console.log(`✅ Discogs API fallback successful, using lowest_price: ${releaseData.lowest_price}`);
    
    // Return minimal pricing stats with API fallback data
    return {
      lowest_price: releaseData.lowest_price || null,
      median_price: null, // API doesn't provide median
      highest_price: null, // API doesn't provide highest
      have_count: releaseData.num_for_sale || 0,
      want_count: 0, // API doesn't provide want count in release endpoint
      avg_rating: 0,
      ratings_count: 0,
      last_sold: null,
      fallback_source: 'discogs_api'
    };
  } catch (error) {
    console.error(`❌ Discogs API fallback error:`, error);
    return null;
  }
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Function to check if release is blocked from sale
  const checkIfBlocked = async (discogsId: string, apiKey: string): Promise<{ blocked: boolean; blocked_reason?: string }> => {
    try {
      const releaseUrl = `https://www.discogs.com/release/${discogsId}`;
      console.log(`🔍 Checking release page for blocked status: ${releaseUrl}`);
      
      const scraperUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(releaseUrl)}&keep_headers=true&render=false`;
      
      const response = await fetch(scraperUrl, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        console.log(`⚠️ Could not check release page: ${response.status}`);
        return { blocked: false };
      }
      
      const html = await response.text();
      console.log(`✅ Retrieved release page HTML, length: ${html.length}`);
      
      // Check for blocked sale patterns
      const blockedPatterns = [
        /blocked from sale/i,
        /not permitted to sell/i,
        /This release is blocked/i,
        /It is not permitted to sell this item/i,
        /sale.*?prohibited/i,
        /restricted from sale/i,
        /cannot be sold/i,
      ];
      
      for (const pattern of blockedPatterns) {
        if (pattern.test(html)) {
          console.log(`🚫 Release ${discogsId} is blocked from sale on Discogs`);
          return {
            blocked: true,
            blocked_reason: 'Deze release is geblokkeerd voor verkoop op Discogs. Het is niet toegestaan dit item te verkopen op de Discogs Marketplace.'
          };
        }
      }
      
      console.log(`✅ Release ${discogsId} is NOT blocked from sale`);
      return { blocked: false };
    } catch (error) {
      console.error(`❌ Error checking blocked status:`, error);
      return { blocked: false };
    }
  };

  // Function to scrape pricing statistics with retry logic and fallback (improved)
  const scrapePricingStatsWithRetry = async (sellUrl: string, apiKey: string, discogsId?: string, maxRetries: number = 3) => {
    // First check if release is blocked (only if we have a discogs ID)
    if (discogsId) {
      const blockedCheck = await checkIfBlocked(discogsId, apiKey);
      if (blockedCheck.blocked) {
        return {
          lowest_price: null,
          median_price: null,
          highest_price: null,
          have_count: 0,
          want_count: 0,
          avg_rating: 0,
          ratings_count: 0,
          last_sold: null,
          blocked: true,
          blocked_reason: blockedCheck.blocked_reason
        };
      }
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`💰 Pricing attempt ${attempt}/${maxRetries} for: ${sellUrl}`);
      
      try {
        // Enhanced ScraperAPI URL with better parameters and headers
        const scraperUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(sellUrl)}&keep_headers=true&render=false`;
        
        const response = await fetch(scraperUrl, {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          console.log(`❌ ScraperAPI request failed (attempt ${attempt}): ${response.status}`);
          if (attempt < maxRetries) {
            // Enhanced exponential backoff: 3s, 6s, 12s
            await new Promise(resolve => setTimeout(resolve, attempt * 3000));
            continue;
          }
          
          // If all scraping attempts failed, try Discogs API fallback
          if (discogsId) {
            console.log(`🔄 ScraperAPI failed completely, attempting Discogs API fallback for ID: ${discogsId}`);
            return await getDiscogsApiFallback(discogsId);
          }
          
          return null;
        }

        const html = await response.text();
        console.log(`✅ Retrieved HTML (attempt ${attempt}), length: ${html.length}`);
        
        // Check if release is blocked from sale
        const blockedPatterns = [
          /blocked from sale/i,
          /not permitted to sell/i,
          /This release is blocked/i,
          /not available for sale/i,
          /sale.*?prohibited/i,
        ];
        
        for (const pattern of blockedPatterns) {
          if (pattern.test(html)) {
            console.log('🚫 Release is blocked from sale on Discogs');
            return {
              lowest_price: null,
              median_price: null,
              highest_price: null,
              have_count: 0,
              want_count: 0,
              avg_rating: 0,
              ratings_count: 0,
              last_sold: null,
              blocked: true,
              blocked_reason: 'Deze release is geblokkeerd voor verkoop op Discogs. Het is niet toegestaan dit item te verkopen op de Discogs Marketplace.'
            };
          }
        }
        
        // Extract pricing with fallback patterns
        const extractPricingWithFallback = (html: string) => {
          // Primary patterns (existing)
          const primaryPatterns = {
            lowest_price: [
              /<span>Lowest:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
              /Lowest:[\s\n\r]*[€$£]?([\d.,]+)/,
              /<span>Lowest:<\/span>[\s\n\r]*([\d.,]+)/
            ],
            median_price: [
              /<span>Median:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
              /Median:[\s\n\r]*[€$£]?([\d.,]+)/,
              /<span>Median:<\/span>[\s\n\r]*([\d.,]+)/
            ],
            highest_price: [
              /<span>Highest:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
              /Highest:[\s\n\r]*[€$£]?([\d.,]+)/,
              /<span>Highest:<\/span>[\s\n\r]*([\d.,]+)/
            ]
          };
          
          // Fallback patterns (new)
          const fallbackPatterns = {
            lowest_price: [
              /<span>Low:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
              /Low:[\s\n\r]*[€$£]?([\d.,]+)/,
              /<span>Low:<\/span>[\s\n\r]*([\d.,]+)/
            ],
            median_price: [
              /<span>Median:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
              /Median:[\s\n\r]*[€$£]?([\d.,]+)/,
              /<span>Median:<\/span>[\s\n\r]*([\d.,]+)/
            ],
            highest_price: [
              /<span>High:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/,
              /High:[\s\n\r]*[€$£]?([\d.,]+)/,
              /<span>High:<\/span>[\s\n\r]*([\d.,]+)/
            ]
          };
          
          const extractPrice = (priceType: keyof typeof primaryPatterns) => {
            // Try primary patterns first
            for (const pattern of primaryPatterns[priceType]) {
              const match = html.match(pattern);
              if (match?.[1]) {
                console.log(`💰 Found ${priceType} using primary pattern: ${match[1]}`);
                return match[1];
              }
            }
            
            // Try fallback patterns
            for (const pattern of fallbackPatterns[priceType]) {
              const match = html.match(pattern);
              if (match?.[1]) {
                console.log(`💰 Found ${priceType} using fallback pattern: ${match[1]}`);
                return match[1];
              }
            }
            
            console.log(`💰 No ${priceType} found in either pattern set`);
            return null;
          };
          
          return {
            lowest_price: extractPrice('lowest_price'),
            median_price: extractPrice('median_price'),
            highest_price: extractPrice('highest_price')
          };
        };
        
        // Extract statistics using HTML-aware regex patterns
        const pricingData = extractPricingWithFallback(html);
        const stats = {
          have_count: parseInt(html.match(/<span>Have:<\/span>\s*<a[^>]*>(\d+)<\/a>/)?.[1] || 
                html.match(/Have:\s?(\d+)/)?.[1] || '0'),
          want_count: parseInt(html.match(/<span>Want:<\/span>\s*<a[^>]*>(\d+)<\/a>/)?.[1] || 
                html.match(/Want:\s?(\d+)/)?.[1] || '0'),
          avg_rating: parseFloat(html.match(/<span class="rating_value">([\d.]+)<\/span>/)?.[1] || 
                      html.match(/Avg Rating:\s?([\d.]+)\s?\/\s?5/)?.[1] || '0'),
          ratings_count: parseInt(html.match(/<span class="rating_count">(\d+)<\/span>/)?.[1] || 
                        html.match(/Ratings:\s?(\d+)/)?.[1] || '0'),
          last_sold: html.match(/<span>Last Sold:<\/span>\s*<a[^>]*>([0-9]{2} \w{3} \d{2})<\/a>/)?.[1] || 
                     html.match(/Last Sold:\s?([0-9]{2} \w{3} \d{2})/)?.[1] || null,
          ...pricingData
        };

        console.log(`📊 Extracted stats (attempt ${attempt}):`, stats);
        
        // Check if we got useful pricing data
        if (stats.lowest_price || stats.median_price || stats.highest_price) {
          return stats;
        } else if (attempt < maxRetries) {
          console.log(`⚠️ No pricing data found in HTML, retrying...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 3000));
          continue;
        }
        
        // If this is the last attempt and we still have no pricing data, try API fallback
        if (attempt === maxRetries && discogsId) {
          console.log(`🔄 Final attempt failed, trying Discogs API fallback for ID: ${discogsId}`);
          const fallbackStats = await getDiscogsApiFallback(discogsId);
          if (fallbackStats) {
            return fallbackStats;
          }
        }
        
        return stats;
      } catch (error) {
        console.error(`❌ Pricing scrape failed (attempt ${attempt}) for ${sellUrl}:`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          continue;
        }
        return null;
      }
    }
  };

  try {
    console.log('🔍 Starting catalog search test...');
    
    const { catalog_number, artist, title, include_pricing, retry_pricing, discogs_id, retry_pricing_only, direct_discogs_id } = await req.json();
    
    // Handle retry pricing only requests
    if (retry_pricing_only && discogs_id) {
      const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY');
      if (!scraperApiKey) {
        return new Response(
          JSON.stringify({ error: 'ScraperAPI key not available for pricing retry' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const sellUrl = `https://www.discogs.com/sell/release/${discogs_id}`;
      console.log(`💰 Retrying pricing for Discogs ID: ${discogs_id}`);
      
      const pricingStats = await scrapePricingStatsWithRetry(sellUrl, scraperApiKey, discogs_id.toString());
      
      return new Response(
        JSON.stringify({ pricing_stats: pricingStats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle direct Discogs ID requests
    if (direct_discogs_id) {
      const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY');
      
      // Get Discogs credentials for API call
      const discogsToken = Deno.env.get('DISCOGS_TOKEN');
      const discogsConsumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY');
      const discogsConsumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET');
      
      if (!scraperApiKey) {
        return new Response(
          JSON.stringify({ error: 'ScraperAPI key not available for direct Discogs ID search' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!discogsToken && (!discogsConsumerKey || !discogsConsumerSecret)) {
        return new Response(
          JSON.stringify({ error: 'Discogs API credentials not available for release metadata' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const discogsUrl = `https://www.discogs.com/release/${direct_discogs_id}`;
      const sellUrl = `https://www.discogs.com/sell/release/${direct_discogs_id}`;
      const apiUrl = `https://api.discogs.com/releases/${direct_discogs_id}`;
      
      console.log(`🆔 Direct Discogs ID search for: ${direct_discogs_id}`);
      
      // Determine authentication method
      const authHeaders = discogsToken 
        ? { 'Authorization': `Discogs token=${discogsToken}` }
        : { 'Authorization': `Discogs key=${discogsConsumerKey}, secret=${discogsConsumerSecret}` };
      
      try {
        // Fetch full release metadata from Discogs API
        console.log(`📡 Fetching release metadata from Discogs API...`);
        const apiResponse = await fetch(apiUrl, {
          headers: {
            ...authHeaders,
            'User-Agent': 'VinylScanner/2.0'
          }
        });

        if (!apiResponse.ok) {
          console.error(`❌ Discogs API failed: ${apiResponse.status}`);
          return new Response(
            JSON.stringify({ error: `Failed to fetch release metadata: ${apiResponse.status}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const releaseData = await apiResponse.json();
        console.log(`✅ Retrieved release metadata: ${releaseData.title}`);
        
        // Determine media type from format
        const formats = releaseData.formats || [];
        let mediaType = 'vinyl'; // default
        
        for (const format of formats) {
          const formatName = format.name?.toLowerCase() || '';
          if (formatName.includes('cd') || formatName.includes('compact disc')) {
            mediaType = 'cd';
            break;
          } else if (formatName.includes('vinyl') || formatName.includes('lp') || formatName.includes('12"') || formatName.includes('7"')) {
            mediaType = 'vinyl';
            break;
          }
        }
        
        console.log(`🎵 Detected media type: ${mediaType}`);
        
        // Fetch pricing stats with fallback support
        const pricingStats = await scrapePricingStatsWithRetry(sellUrl, scraperApiKey, direct_discogs_id.toString());
        
        // If no pricing stats and we have API access, ensure we have at least lowest price from API
        let finalPricingStats = pricingStats;
        if ((!pricingStats || (!pricingStats.lowest_price && !pricingStats.median_price && !pricingStats.highest_price)) && releaseData.lowest_price) {
          console.log(`🔄 No scraping results, using API lowest_price as fallback: ${releaseData.lowest_price}`);
          finalPricingStats = {
            lowest_price: releaseData.lowest_price,
            median_price: pricingStats?.median_price || null,
            highest_price: pricingStats?.highest_price || null,
            have_count: pricingStats?.have_count || 0,
            want_count: pricingStats?.want_count || 0,
            avg_rating: pricingStats?.avg_rating || 0,
            ratings_count: pricingStats?.ratings_count || 0,
            last_sold: pricingStats?.last_sold || null,
            fallback_source: 'discogs_api'
          };
        }
        
        // Create complete result with full metadata
        const result = {
          discogs_id: direct_discogs_id,
          discogs_url: discogsUrl,
          sell_url: sellUrl,
          api_url: apiUrl,
          title: releaseData.title || '',
          artist: releaseData.artists?.map((a: any) => a.name).join(', ') || '',
          year: releaseData.year?.toString() || '',
          label: releaseData.labels?.map((l: any) => l.name).join(', ') || '',
          catalog_number: releaseData.labels?.[0]?.catno || '',
          genre: releaseData.genres?.join(', ') || '',
          style: releaseData.styles?.join(', ') || '',
          country: releaseData.country || '',
          format: formats.map((f: any) => f.name).join(', '),
          format_details: formats.map((f: any) => 
            [f.name, ...(f.descriptions || [])].join(' ')
          ).join(', '),
          media_type: mediaType,
          similarity_score: 1.0,
          search_strategy: 'Direct Discogs ID',
          pricing_stats: finalPricingStats,
          // Include original release data for debugging
          release_metadata: {
            master_id: releaseData.master_id,
            data_quality: releaseData.data_quality,
            thumb: releaseData.thumb,
            images: releaseData.images,
            tracklist: releaseData.tracklist
          }
        };

        console.log(`✅ Complete release data prepared for: ${result.artist} - ${result.title}`);

        return new Response(
          JSON.stringify({
            results: [result],
            search_strategies: ['Direct Discogs ID'],
            total_found: 1,
            media_type: mediaType
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      } catch (error) {
        console.error(`❌ Direct Discogs ID search failed:`, error);
        return new Response(
          JSON.stringify({ 
            error: `Direct Discogs ID search failed: ${error.message}`,
            discogs_id: direct_discogs_id
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!catalog_number) {
      console.error('❌ Catalog number is required');
      return new Response(
        JSON.stringify({ error: 'Catalog number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get credentials - prefer token first, then consumer key/secret
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    const discogsConsumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY');
    const discogsConsumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET');
    const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY');
    
    console.log(`📋 Credential Status:
    - Token: ${discogsToken ? `✅ (${discogsToken.substring(0, 8)}...)` : '❌ Missing'}
    - Consumer Key: ${discogsConsumerKey ? `✅ (${discogsConsumerKey.substring(0, 8)}...)` : '❌ Missing'}
    - Consumer Secret: ${discogsConsumerSecret ? `✅ (${discogsConsumerSecret.substring(0, 8)}...)` : '❌ Missing'}
    - ScraperAPI Key: ${scraperApiKey ? `✅ (${scraperApiKey.substring(0, 8)}...)` : '❌ Missing'}`);
    
    if (!discogsToken && (!discogsConsumerKey || !discogsConsumerSecret)) {
      console.error('❌ Missing Discogs credentials. Need either DISCOGS_TOKEN or both DISCOGS_CONSUMER_KEY and DISCOGS_CONSUMER_SECRET');
      return new Response(
        JSON.stringify({ 
          error: 'Missing Discogs credentials. Need either DISCOGS_TOKEN or both DISCOGS_CONSUMER_KEY and DISCOGS_CONSUMER_SECRET',
          hasToken: !!discogsToken,
          hasConsumerKey: !!discogsConsumerKey,
          hasConsumerSecret: !!discogsConsumerSecret
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine authentication method
    const authHeaders = discogsToken 
      ? { 'Authorization': `Discogs token=${discogsToken}` }
      : { 'Authorization': `Discogs key=${discogsConsumerKey}, secret=${discogsConsumerSecret}` };
    
    console.log(`🔑 Using ${discogsToken ? 'Token' : 'Consumer Key/Secret'} authentication`);

    console.log(`🎵 Searching for catalog: "${catalog_number}", artist: "${artist}", title: "${title}", include_pricing: ${include_pricing}`);

    // Array to track all search strategies used
    const searchStrategies: string[] = [];
    const allResults: any[] = [];

    // Function to search Discogs with retry and rate limiting
    const searchDiscogs = async (query: string, strategy: string) => {
      console.log(`🔍 Strategy "${strategy}": ${query}`);
      searchStrategies.push(strategy);
      
      const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&per_page=10`;
      
      try {
        const response = await fetch(searchUrl, {
          headers: {
            ...authHeaders,
            'User-Agent': 'VinylScanner/2.0'
          }
        });

        if (!response.ok) {
          console.log(`❌ Strategy "${strategy}" failed: ${response.status}`);
          return [];
        }

        const data = await response.json();
        const results = data.results || [];
        
        console.log(`✅ Strategy "${strategy}" found ${results.length} results`);
        return results.map((result: any) => ({
          ...result,
          search_strategy: strategy,
          similarity_score: calculateSimilarity(catalog_number, result.catno || '', artist, result.title || '', title)
        }));
      } catch (error) {
        console.error(`❌ Strategy "${strategy}" error:`, error);
        return [];
      }
    };

    // Calculate similarity score
    const calculateSimilarity = (searchCatalog: string, resultCatalog: string, searchArtist?: string, resultTitle?: string, searchTitle?: string): number => {
      let score = 0;
      let factors = 0;

      // Catalog number similarity (most important)
      if (resultCatalog) {
        const catalogSim = stringSimilarity(searchCatalog.toLowerCase(), resultCatalog.toLowerCase());
        score += catalogSim * 0.7;
        factors += 0.7;
      }

      // Artist similarity
      if (searchArtist && resultTitle) {
        const artistSim = stringSimilarity(searchArtist.toLowerCase(), resultTitle.toLowerCase());
        score += artistSim * 0.2;
        factors += 0.2;
      }

      // Title similarity
      if (searchTitle && resultTitle) {
        const titleSim = stringSimilarity(searchTitle.toLowerCase(), resultTitle.toLowerCase());
        score += titleSim * 0.1;
        factors += 0.1;
      }

      return factors > 0 ? score / factors : 0;
    };

    // Simple string similarity function
    const stringSimilarity = (str1: string, str2: string): number => {
      if (str1 === str2) return 1;
      if (str1.includes(str2) || str2.includes(str1)) return 0.8;
      
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      const editDistance = levenshteinDistance(longer, shorter);
      return (longer.length - editDistance) / longer.length;
    };

    // Levenshtein distance calculation
    const levenshteinDistance = (str1: string, str2: string): number => {
      const matrix = [];
      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[str2.length][str1.length];
    };

    // Search Strategy 1: Exact catalog number
    const exactResults = await searchDiscogs(`catno:"${catalog_number}"`, 'Exact Catalog Number');
    allResults.push(...exactResults);

    // Search Strategy 2: Catalog number with artist
    if (artist) {
      const artistCatalogResults = await searchDiscogs(`catno:"${catalog_number}" artist:"${artist}"`, 'Catalog + Artist');
      allResults.push(...artistCatalogResults);
    }

    // Search Strategy 3: Catalog number with title
    if (title) {
      const titleCatalogResults = await searchDiscogs(`catno:"${catalog_number}" title:"${title}"`, 'Catalog + Title');
      allResults.push(...titleCatalogResults);
    }

    // Search Strategy 4: Catalog number variations (remove spaces, dashes)
    const catalogVariations = [
      catalog_number.replace(/[\s\-]/g, ''),
      catalog_number.replace(/\s/g, '-'),
      catalog_number.replace(/\-/g, ' ')
    ].filter(v => v !== catalog_number);

    for (const variation of catalogVariations) {
      const variationResults = await searchDiscogs(`catno:"${variation}"`, `Catalog Variation: ${variation}`);
      allResults.push(...variationResults);
    }

    // Search Strategy 5: General search if other methods fail
    if (allResults.length === 0) {
      const generalQuery = [catalog_number, artist, title].filter(Boolean).join(' ');
      const generalResults = await searchDiscogs(generalQuery, 'General Search');
      allResults.push(...generalResults);
    }

    // Remove duplicates and sort by similarity score
    const uniqueResults = allResults.reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id);
      if (!existing || current.similarity_score > existing.similarity_score) {
        return [...acc.filter(item => item.id !== current.id), current];
      }
      return acc;
    }, []);

    // Sort by similarity score
    uniqueResults.sort((a, b) => b.similarity_score - a.similarity_score);

    // Format results
    let formattedResults = uniqueResults.slice(0, 10).map(result => ({
      discogs_id: result.id?.toString() || '',
      discogs_url: `https://www.discogs.com/release/${result.id}`,
      sell_url: `https://www.discogs.com/sell/release/${result.id}`,
      api_url: `https://api.discogs.com/releases/${result.id}`,
      title: result.title || '',
      artist: result.title?.split(' - ')[0] || '',
      year: result.year?.toString() || '',
      similarity_score: result.similarity_score || 0,
      search_strategy: result.search_strategy || 'Unknown',
      catalog_number: result.catno || '',
      pricing_stats: null as any
    }));

    // Add pricing statistics if requested and ScraperAPI is available
    if (include_pricing && scraperApiKey && formattedResults.length > 0) {
      console.log(`💰 Scraping pricing stats for ${formattedResults.length} results...`);
      
      for (const result of formattedResults) {
        // Extract Discogs ID from result for fallback
        const discogsId = result.discogs_id;
        const pricingStats = await scrapePricingStatsWithRetry(result.sell_url, scraperApiKey, discogsId);
        result.pricing_stats = pricingStats;
        
        // If no pricing stats from scraping, try to get minimal price from Discogs API
        if ((!pricingStats || (!pricingStats.lowest_price && !pricingStats.median_price && !pricingStats.highest_price)) && discogsId) {
          console.log(`🔄 No pricing from scraping for ${discogsId}, attempting API fallback...`);
          const fallbackStats = await getDiscogsApiFallback(discogsId);
          if (fallbackStats) {
            result.pricing_stats = fallbackStats;
          }
        }
      }
    }

    console.log(`✅ Search complete. Found ${formattedResults.length} results using strategies: ${searchStrategies.join(', ')}`);
    
    return new Response(
      JSON.stringify({
        results: formattedResults,
        search_strategies: searchStrategies,
        total_found: formattedResults.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Catalog search failed:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        results: [], 
        search_strategies: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});