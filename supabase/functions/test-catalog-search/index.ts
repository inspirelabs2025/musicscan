const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔍 Starting catalog search test...');
    
    const { catalog_number, artist, title, include_pricing } = await req.json();
    
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

    // Function to scrape pricing statistics from marketplace URL
    const scrapePricingStats = async (sellUrl: string) => {
      if (!scraperApiKey) {
        console.log('⚠️ ScraperAPI key not available, skipping pricing scrape');
        return null;
      }

      try {
        console.log(`💰 Scraping pricing stats from: ${sellUrl}`);
        const scraperUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(sellUrl)}`;
        
        const response = await fetch(scraperUrl);
        if (!response.ok) {
          console.log(`❌ ScraperAPI request failed: ${response.status}`);
          return null;
        }

        const html = await response.text();
        console.log(`✅ Retrieved HTML, length: ${html.length}`);
        
        // Extract statistics using HTML-aware regex patterns
        const stats = {
          have: parseInt(html.match(/<span>Have:<\/span>\s*<a[^>]*>(\d+)<\/a>/)?.[1] || 
                html.match(/Have:\s?(\d+)/)?.[1] || '0'),
          want: parseInt(html.match(/<span>Want:<\/span>\s*<a[^>]*>(\d+)<\/a>/)?.[1] || 
                html.match(/Want:\s?(\d+)/)?.[1] || '0'),
          avg_rating: parseFloat(html.match(/<span class="rating_value">([\d.]+)<\/span>/)?.[1] || 
                      html.match(/Avg Rating:\s?([\d.]+)\s?\/\s?5/)?.[1] || '0'),
          rating_count: parseInt(html.match(/<span class="rating_count">(\d+)<\/span>/)?.[1] || 
                        html.match(/Ratings:\s?(\d+)/)?.[1] || '0'),
          last_sold: html.match(/<span>Last Sold:<\/span>\s*<a[^>]*>([0-9]{2} \w{3} \d{2})<\/a>/)?.[1] || 
                     html.match(/Last Sold:\s?([0-9]{2} \w{3} \d{2})/)?.[1] || null,
          lowest_price: html.match(/<span>Lowest:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/)?.[1] || 
                        html.match(/Lowest:[\s\n\r]*[€$£]?([\d.,]+)/)?.[1] || 
                        html.match(/<span>Lowest:<\/span>[\s\n\r]*([\d.,]+)/)?.[1] || null,
          median_price: html.match(/<span>Median:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/)?.[1] || 
                        html.match(/Median:[\s\n\r]*[€$£]?([\d.,]+)/)?.[1] || 
                        html.match(/<span>Median:<\/span>[\s\n\r]*([\d.,]+)/)?.[1] || null,
          highest_price: html.match(/<span>Highest:<\/span>[\s\n\r]*[€$£]?([\d.,]+)/)?.[1] || 
                         html.match(/Highest:[\s\n\r]*[€$£]?([\d.,]+)/)?.[1] || 
                         html.match(/<span>Highest:<\/span>[\s\n\r]*([\d.,]+)/)?.[1] || null
        };

        console.log(`📊 Extracted stats:`, stats);
        return stats;
      } catch (error) {
        console.error(`❌ Pricing scrape failed for ${sellUrl}:`, error);
        return null;
      }
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

    // Add pricing statistics if requested
    if (include_pricing && scraperApiKey && formattedResults.length > 0) {
      console.log(`💰 Scraping pricing stats for ${formattedResults.length} results...`);
      
      // Scrape pricing stats for all results in parallel (with a reasonable limit)
      const pricingPromises = formattedResults.slice(0, 5).map(async (result, index) => {
        // Add a small delay to avoid overwhelming ScraperAPI
        await new Promise(resolve => setTimeout(resolve, index * 1000));
        const pricingStats = await scrapePricingStats(result.sell_url);
        return { index, pricingStats };
      });

      try {
        const pricingResults = await Promise.all(pricingPromises);
        pricingResults.forEach(({ index, pricingStats }) => {
          if (index < formattedResults.length) {
            formattedResults[index].pricing_stats = pricingStats;
          }
        });
        console.log(`✅ Pricing scraping completed`);
      } catch (error) {
        console.error(`❌ Error during pricing scraping:`, error);
      }
    }

    console.log(`✅ Search completed: ${formattedResults.length} unique results found`);

    return new Response(
      JSON.stringify({
        results: formattedResults,
        search_strategies: [...new Set(searchStrategies)],
        total_found: formattedResults.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Catalog search failed:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        results: [],
        search_strategies: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});