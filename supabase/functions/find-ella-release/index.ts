const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    
    if (!discogsToken) {
      return new Response(
        JSON.stringify({ error: 'DISCOGS_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any = {
      target_identifiers: {
        barcode: '5027626416423',
        catno: 'SUMCD 4164',
        label: 'Summit',
        artist: 'Ella Fitzgerald',
        title: 'Portrait'
      },
      searches: [],
      timestamp: new Date().toISOString()
    };

    // Search 1: Artist + Title + Label
    console.log('🔍 Search 1: Artist + Title + Label');
    const search1Url = `https://api.discogs.com/database/search?artist=Ella+Fitzgerald&title=Portrait&label=Summit&type=release`;
    
    const search1Response = await fetch(search1Url, {
      headers: {
        'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
        'Authorization': `Discogs token=${discogsToken}`
      }
    });
    
    if (search1Response.status === 200) {
      const data = await search1Response.json();
      results.searches.push({
        strategy: 'artist+title+label',
        url: search1Url,
        results_count: data.results?.length || 0,
        results: data.results?.slice(0, 5).map((r: any) => ({
          id: r.id,
          title: r.title,
          catno: r.catno,
          barcode: r.barcode,
          label: r.label,
          country: r.country,
          year: r.year
        }))
      });
    }

    await new Promise(r => setTimeout(r, 1000));

    // Search 2: q="SUMCD 4164" (free text search for catno)
    console.log('🔍 Search 2: q=SUMCD 4164');
    const search2Url = `https://api.discogs.com/database/search?q=SUMCD+4164&type=release`;
    
    const search2Response = await fetch(search2Url, {
      headers: {
        'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
        'Authorization': `Discogs token=${discogsToken}`
      }
    });
    
    if (search2Response.status === 200) {
      const data = await search2Response.json();
      results.searches.push({
        strategy: 'q=SUMCD+4164',
        url: search2Url,
        results_count: data.results?.length || 0,
        results: data.results?.slice(0, 5).map((r: any) => ({
          id: r.id,
          title: r.title,
          catno: r.catno,
          barcode: r.barcode,
          label: r.label,
          country: r.country,
          year: r.year
        }))
      });
    }

    await new Promise(r => setTimeout(r, 1000));

    // Search 3: q="Summit Ella Fitzgerald"
    console.log('🔍 Search 3: q=Summit Ella Fitzgerald');
    const search3Url = `https://api.discogs.com/database/search?q=Summit+Ella+Fitzgerald&type=release&format=CD`;
    
    const search3Response = await fetch(search3Url, {
      headers: {
        'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
        'Authorization': `Discogs token=${discogsToken}`
      }
    });
    
    if (search3Response.status === 200) {
      const data = await search3Response.json();
      results.searches.push({
        strategy: 'q=Summit+Ella+Fitzgerald+CD',
        url: search3Url,
        results_count: data.results?.length || 0,
        results: data.results?.slice(0, 10).map((r: any) => ({
          id: r.id,
          title: r.title,
          catno: r.catno,
          barcode: r.barcode,
          label: r.label,
          country: r.country,
          year: r.year
        }))
      });
    }

    return new Response(
      JSON.stringify(results, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Test failed:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
