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

// Get master data from Discogs
const getMasterData = async (masterId: string, authHeaders: any) => {
  const apiUrl = `https://api.discogs.com/masters/${masterId}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      ...authHeaders,
      'User-Agent': 'VinylScanner/2.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch master data: ${response.status}`);
  }

  return await response.json();
};

// Get release metadata quickly without pricing
// Supports both Release IDs and Master IDs (auto-converts Master → Release)
const getReleaseMetadata = async (discogsId: string, authHeaders: any) => {
  // Try as Release ID first
  const releaseUrl = `https://api.discogs.com/releases/${discogsId}`;
  
  const releaseResponse = await fetch(releaseUrl, {
    headers: {
      ...authHeaders,
      'User-Agent': 'VinylScanner/2.0'
    }
  });

  if (releaseResponse.ok) {
    return await releaseResponse.json();
  }

  // If Release fetch failed (404), try as Master ID
  if (releaseResponse.status === 404) {
    console.log(`🔄 ID ${discogsId} is not a Release, trying as Master...`);
    
    try {
      const masterData = await getMasterData(discogsId, authHeaders);
      const mainReleaseId = masterData.main_release;
      
      if (!mainReleaseId) {
        throw new Error('Master has no main_release');
      }
      
      console.log(`✅ Master ${discogsId} → Release ${mainReleaseId}`);
      
      // Fetch the main release
      const mainReleaseResponse = await fetch(`https://api.discogs.com/releases/${mainReleaseId}`, {
        headers: {
          ...authHeaders,
          'User-Agent': 'VinylScanner/2.0'
        }
      });
      
      if (!mainReleaseResponse.ok) {
        throw new Error(`Failed to fetch main release ${mainReleaseId}: ${mainReleaseResponse.status}`);
      }
      
      const releaseData = await mainReleaseResponse.json();
      
      // Add a flag to indicate this was converted from Master
      releaseData._converted_from_master = discogsId;
      releaseData._actual_release_id = mainReleaseId;
      releaseData.master_id = parseInt(discogsId);
      
      return releaseData;
    } catch (masterError) {
      throw new Error(`Invalid Discogs ID ${discogsId}: Not a valid Release or Master ID (${masterError.message})`);
    }
  }

  throw new Error(`Failed to fetch release metadata: ${releaseResponse.status}`);
};

// Parallel search strategies
const runParallelSearches = async (catalogNumber: string | undefined, artist?: string, title?: string, authHeaders?: any) => {
  const searches = [];

  // Strategy 1: Catalog number search
  if (catalogNumber?.trim()) {
    searches.push(
      searchDiscogsQuick(`catno:"${catalogNumber}"`, authHeaders)
        .then(data => ({ strategy: 'Catalog Number', data }))
        .catch(error => ({ strategy: 'Catalog Number', error }))
    );
  }

  // Strategy 2: Artist + Title (Strict) - for exact matches
  if (artist?.trim() && title?.trim()) {
    searches.push(
      searchDiscogsQuick(`artist:"${artist}" title:"${title}"`, authHeaders)
        .then(data => ({ strategy: 'Artist + Title (Strict)', data }))
        .catch(error => ({ strategy: 'Artist + Title (Strict)', error }))
    );
  }

  // Strategy 2b: Artist + Title (Relaxed) - without quotes for flexible matching
  if (artist?.trim() && title?.trim()) {
    searches.push(
      searchDiscogsQuick(`${artist} ${title} type:release`, authHeaders)
        .then(data => ({ strategy: 'Artist + Title (Relaxed)', data }))
        .catch(error => ({ strategy: 'Artist + Title (Relaxed)', error }))
    );
  }

  // Strategy 2c: Release Title Only - using Discogs release_title operator
  if (title?.trim()) {
    searches.push(
      searchDiscogsQuick(`release_title:"${title}" type:release`, authHeaders)
        .then(data => ({ strategy: 'Release Title', data }))
        .catch(error => ({ strategy: 'Release Title', error }))
    );
  }

  // Strategy 2d: Artist + Title Keywords - first word of title
  if (artist?.trim() && title?.trim()) {
    const titleKeyword = title.split(' ')[0];
    searches.push(
      searchDiscogsQuick(`artist:"${artist}" ${titleKeyword} type:release`, authHeaders)
        .then(data => ({ strategy: 'Artist + Keywords', data }))
        .catch(error => ({ strategy: 'Artist + Keywords', error }))
    );
  }

  // Strategy 2e: Title Keywords Only - broadest search
  if (title?.trim()) {
    searches.push(
      searchDiscogsQuick(`${title} type:release`, authHeaders)
        .then(data => ({ strategy: 'Title Keywords', data }))
        .catch(error => ({ strategy: 'Title Keywords', error }))
    );
  }

  // Strategy 3: Combined search
  if (catalogNumber?.trim() && artist?.trim()) {
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

// Process search results and format them with similarity scoring
const processSearchResults = (searchResults: any[], originalArtist?: string, originalTitle?: string) => {
  const allResults = [];
  const usedIds = new Set();

  for (const result of searchResults) {
    for (const item of result.data.results || []) {
      if (usedIds.has(item.id)) continue;
      
      // Filter: only process release or master types
      const itemType = item.type || '';
      if (itemType && itemType !== 'release' && itemType !== 'master') {
        console.log(`⏭️ Skipping type: ${itemType} (ID: ${item.id})`);
        continue;
      }
      
      usedIds.add(item.id);

      // Determine media type
      let mediaType = 'vinyl';
      const format = item.format?.join(' ').toLowerCase() || '';
      if (format.includes('cd') || format.includes('compact disc')) {
        mediaType = 'cd';
      }

      // Calculate similarity score - Start at 0, only add points for actual matches
      let similarityScore = 0.0;
      
      if (originalArtist && originalTitle) {
        const itemArtist = (Array.isArray(item.artist) ? item.artist.join(', ') : item.artist || '').toLowerCase();
        const itemTitle = (item.title || '').toLowerCase();
        const searchArtist = originalArtist.toLowerCase();
        const searchTitle = originalTitle.toLowerCase();

        // Artist match (0.4 points max)
        let artistMatch = 0;
        if (itemArtist === searchArtist) {
          artistMatch = 0.4; // Exact match
        } else if (itemArtist.includes(searchArtist)) {
          artistMatch = 0.25; // Contains search term
        } else if (searchArtist.includes(itemArtist)) {
          artistMatch = 0.2; // Search term contains item
        }

        // Title match (0.4 points max)
        let titleMatch = 0;
        if (itemTitle === searchTitle) {
          titleMatch = 0.4; // Exact match
        } else if (itemTitle.includes(searchTitle)) {
          titleMatch = 0.25; // Contains search term
        } else if (searchTitle.includes(itemTitle)) {
          titleMatch = 0.2; // Search term contains item
        }

        // Only add strategy bonus if there's at least some artist or title match
        if (artistMatch > 0 || titleMatch > 0) {
          similarityScore = artistMatch + titleMatch;
          
          // Strategy bonus (0.2 points max) - only if base match exists
          const strategyBonus: Record<string, number> = {
            'Catalog Number': 0.2,
            'Artist + Title (Strict)': 0.15,
            'Artist + Title (Relaxed)': 0.1,
            'Release Title': 0.08,
            'Artist + Keywords': 0.05,
            'Title Keywords': 0.02,
            'Combined': 0.1
          };
          similarityScore += strategyBonus[result.strategy] || 0;
        } else {
          // No artist or title match at all → score stays 0.0
          similarityScore = 0.0;
        }
      }

      // Construct correct URLs based on type (master vs release)
      const discogsUrl = item.uri || (itemType === 'master'
        ? `https://www.discogs.com/master/${item.id}`
        : `https://www.discogs.com/release/${item.id}`);
      const apiUrl = item.resource_url || (itemType === 'master'
        ? `https://api.discogs.com/masters/${item.id}`
        : `https://api.discogs.com/releases/${item.id}`);
      const sellUrl = itemType === 'release' ? `https://www.discogs.com/sell/release/${item.id}` : null;
      
      console.log(`📊 ${itemType || 'unknown'} | Score: ${similarityScore.toFixed(2)} | ${item.artist} - ${item.title} | ${result.strategy}`);

      allResults.push({
        discogs_id: item.id,
        discogs_url: discogsUrl,
        sell_url: sellUrl,
        api_url: apiUrl,
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
        similarity_score: similarityScore,
        search_strategy: result.strategy,
        thumb: item.thumb || '',
        result_type: itemType,
        master_id: itemType === 'master' ? item.id : (item.master_id || null),
        // No pricing stats initially - will be loaded separately
        pricing_stats: null
      });
    }
  }

  // Filter out low-confidence results (< 85%) and sort by similarity score (highest first)
  const filteredResults = allResults
    .filter(result => result.similarity_score >= 0.85)
    .sort((a, b) => b.similarity_score - a.similarity_score);
  
  // If no results pass the high-confidence filter, return best available match with warning
  if (filteredResults.length === 0 && allResults.length > 0) {
    console.warn('⚠️ No high-confidence results found (>= 0.85), returning best available match');
    const sortedResults = allResults.sort((a, b) => b.similarity_score - a.similarity_score);
    return sortedResults.slice(0, 1); // Return only top result
  }
  
  return filteredResults;
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
      const idStr = String(direct_discogs_id).trim();
      
      // ✅ Check if this is a Master ID (prefix m/M)
      const isMasterId = /^[mM]/.test(idStr);
      const numericId = idStr.replace(/^[mM]/i, ''); // Remove prefix
      
      console.log(`🆔 Direct Discogs ID search:`, { 
        input: direct_discogs_id,
        isMaster: isMasterId,
        numericId 
      });
      
      let releaseData;
      
      if (isMasterId) {
        // Force Master → Release conversion
        console.log(`🔄 Forcing Master ID ${numericId} conversion...`);
        const masterData = await getMasterData(numericId, authHeaders);
        const mainReleaseId = masterData.main_release;
        
        if (!mainReleaseId) {
          throw new Error(`Master ${numericId} has no main_release`);
        }
        
        console.log(`✅ Master ${numericId} → Release ${mainReleaseId}`);
        
        const mainReleaseResponse = await fetch(
          `https://api.discogs.com/releases/${mainReleaseId}`, 
          { headers: { ...authHeaders, 'User-Agent': 'VinylScanner/2.0' } }
        );
        
        if (!mainReleaseResponse.ok) {
          throw new Error(`Failed to fetch release ${mainReleaseId}`);
        }
        
        releaseData = await mainReleaseResponse.json();
        releaseData._converted_from_master = true;
        releaseData._actual_release_id = mainReleaseId;
        releaseData._original_master_id = numericId;
      } else {
        // Regular Release ID path (existing logic)
        releaseData = await getReleaseMetadata(numericId, authHeaders);
      }
      
      // Check if this was converted from Master
      const actualReleaseId = releaseData._actual_release_id || numericId;
      const wasConverted = !!releaseData._converted_from_master;
      
      if (wasConverted) {
        console.log(`ℹ️ Using Release ID ${actualReleaseId} (converted from Master ${numericId})`);
      }
      
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
        discogs_id: actualReleaseId,
        master_id: releaseData.master_id || null,
        original_master_id: wasConverted ? direct_discogs_id : null,
        discogs_url: `https://www.discogs.com/release/${actualReleaseId}`,
        sell_url: `https://www.discogs.com/sell/release/${actualReleaseId}`,
        api_url: `https://api.discogs.com/releases/${actualReleaseId}`,
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
        search_strategy: wasConverted ? 'Master ID → Release ID' : 'Direct Discogs ID',
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
          search_strategies: [result.search_strategy],
          total_found: 1,
          media_type: mediaType,
          conversion_info: wasConverted ? {
            from_master_id: direct_discogs_id,
            to_release_id: actualReleaseId
          } : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle catalog search with parallel strategies
    if (!catalog_number && (!artist || !title)) {
      return new Response(
        JSON.stringify({ error: 'Either catalog_number or (artist + title) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Running parallel searches for catalog: "${catalog_number || 'none'}", artist: "${artist || 'none'}", title: "${title || 'none'}"`);
    
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

    // Process and format results with similarity scoring
    const formattedResults = processSearchResults(searchResults, artist, title);
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