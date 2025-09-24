const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Quick Discogs search without pricing for immediate results
const searchDiscogsQuick = async (searchQuery: string, authHeaders: any) => {
  const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(searchQuery)}&per_page=10`;
  
  const response = await fetch(searchUrl, {
    headers: {
      ...authHeaders,
      'User-Agent': 'VinylScanner/2.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Discogs search failed: ${response.status}`);
  }

  return await response.json();
};

// Get release metadata quickly without pricing
const getReleaseMetadata = async (discogsId: string, authHeaders: any) => {
  const apiUrl = `https://api.discogs.com/releases/${discogsId}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      ...authHeaders,
      'User-Agent': 'VinylScanner/2.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch release metadata: ${response.status}`);
  }

  return await response.json();
};

// Parallel search strategies
const runParallelSearches = async (catalogNumber: string, artist?: string, title?: string, authHeaders?: any) => {
  const searches = [];

  // Strategy 1: Catalog number search
  if (catalogNumber.trim()) {
    searches.push(
      searchDiscogsQuick(`catno:"${catalogNumber}"`, authHeaders)
        .then(data => ({ strategy: 'Catalog Number', data }))
        .catch(error => ({ strategy: 'Catalog Number', error }))
    );
  }

  // Strategy 2: Artist + Title search
  if (artist?.trim() && title?.trim()) {
    searches.push(
      searchDiscogsQuick(`artist:"${artist}" title:"${title}"`, authHeaders)
        .then(data => ({ strategy: 'Artist + Title', data }))
        .catch(error => ({ strategy: 'Artist + Title', error }))
    );
  }

  // Strategy 3: Combined search
  if (catalogNumber.trim() && artist?.trim()) {
    searches.push(
      searchDiscogsQuick(`${catalogNumber} ${artist}`, authHeaders)
        .then(data => ({ strategy: 'Combined', data }))
        .catch(error => ({ strategy: 'Combined', error }))
    );
  }

  // Run all searches in parallel
  const results = await Promise.allSettled(searches);
  
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<any>).value)
    .filter(result => !result.error && result.data?.results?.length > 0);
};

// Process search results and format them
const processSearchResults = (searchResults: any[]) => {
  const allResults = [];
  const usedIds = new Set();

  for (const result of searchResults) {
    for (const item of result.data.results || []) {
      if (usedIds.has(item.id)) continue;
      usedIds.add(item.id);

      // Determine media type
      let mediaType = 'vinyl';
      const format = item.format?.join(' ').toLowerCase() || '';
      if (format.includes('cd') || format.includes('compact disc')) {
        mediaType = 'cd';
      }

      allResults.push({
        discogs_id: item.id,
        discogs_url: `https://www.discogs.com/release/${item.id}`,
        sell_url: `https://www.discogs.com/sell/release/${item.id}`,
        api_url: `https://api.discogs.com/releases/${item.id}`,
        title: item.title || '',
        artist: Array.isArray(item.artist) ? item.artist.join(', ') : item.artist || '',
        year: item.year?.toString() || '',
        label: Array.isArray(item.label) ? item.label.join(', ') : item.label || '',
        catalog_number: item.catno || '',
        genre: Array.isArray(item.genre) ? item.genre.join(', ') : item.genre || '',
        style: Array.isArray(item.style) ? item.style.join(', ') : item.style || '',
        country: item.country || '',
        format: Array.isArray(item.format) ? item.format.join(', ') : item.format || '',
        media_type: mediaType,
        similarity_score: 0.9,
        search_strategy: result.strategy,
        thumb: item.thumb || '',
        // No pricing stats initially - will be loaded separately
        pricing_stats: null
      });
    }
  }

  return allResults.sort((a, b) => b.similarity_score - a.similarity_score);
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting optimized catalog search...');
    
    const { catalog_number, artist, title, direct_discogs_id, include_pricing = false } = await req.json();
    
    // Get Discogs credentials
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    const discogsConsumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY');
    const discogsConsumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET');
    
    if (!discogsToken && (!discogsConsumerKey || !discogsConsumerSecret)) {
      return new Response(
        JSON.stringify({ error: 'Missing Discogs credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeaders = discogsToken 
      ? { 'Authorization': `Discogs token=${discogsToken}` }
      : { 'Authorization': `Discogs key=${discogsConsumerKey}, secret=${discogsConsumerSecret}` };

    // Handle direct Discogs ID search
    if (direct_discogs_id) {
      console.log(`🆔 Direct Discogs ID search for: ${direct_discogs_id}`);
      
      const releaseData = await getReleaseMetadata(direct_discogs_id, authHeaders);
      
      // Determine media type
      const formats = releaseData.formats || [];
      let mediaType = 'vinyl';
      
      for (const format of formats) {
        const formatName = format.name?.toLowerCase() || '';
        if (formatName.includes('cd') || formatName.includes('compact disc')) {
          mediaType = 'cd';
          break;
        }
      }
      
      const result = {
        discogs_id: direct_discogs_id,
        discogs_url: `https://www.discogs.com/release/${direct_discogs_id}`,
        sell_url: `https://www.discogs.com/sell/release/${direct_discogs_id}`,
        api_url: `https://api.discogs.com/releases/${direct_discogs_id}`,
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
        pricing_stats: include_pricing ? { 
          lowest_price: releaseData.lowest_price || null,
          median_price: null,
          highest_price: null,
          have_count: releaseData.num_for_sale || 0,
          want_count: 0,
          avg_rating: 0,
          ratings_count: 0,
          last_sold: null
        } : null,
        release_metadata: {
          master_id: releaseData.master_id,
          data_quality: releaseData.data_quality,
          thumb: releaseData.thumb,
          images: releaseData.images,
          tracklist: releaseData.tracklist
        }
      };

      console.log(`✅ Direct search completed for: ${result.artist} - ${result.title}`);

      return new Response(
        JSON.stringify({
          results: [result],
          search_strategies: ['Direct Discogs ID'],
          total_found: 1,
          media_type: mediaType
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle catalog search with parallel strategies
    if (!catalog_number) {
      return new Response(
        JSON.stringify({ error: 'Catalog number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Running parallel searches for: ${catalog_number}, ${artist}, ${title}`);
    
    // Run parallel searches
    const searchResults = await runParallelSearches(catalog_number, artist, title, authHeaders);
    
    if (searchResults.length === 0) {
      return new Response(
        JSON.stringify({
          results: [],
          search_strategies: [],
          total_found: 0,
          media_type: 'vinyl'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process and format results
    const formattedResults = processSearchResults(searchResults);
    const strategies = searchResults.map(r => r.strategy);

    console.log(`✅ Optimized search completed: ${formattedResults.length} results from ${strategies.length} strategies`);

    return new Response(
      JSON.stringify({
        results: formattedResults,
        search_strategies: strategies,
        total_found: formattedResults.length,
        media_type: formattedResults[0]?.media_type || 'vinyl'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Optimized search failed:', error);
    return new Response(
      JSON.stringify({ 
        error: `Search failed: ${error.message}`
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});