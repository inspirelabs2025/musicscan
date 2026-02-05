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

    // Fetch the KNOWN release directly
    const releaseId = 4381440;
    const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;
    
    console.log(`🔍 Fetching release ${releaseId} directly...`);
    
    const response = await fetch(releaseUrl, {
      headers: {
        'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
        'Authorization': `Discogs token=${discogsToken}`
      }
    });
    
    if (response.status !== 200) {
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch release: ${response.status}`,
          release_id: releaseId
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const release = await response.json();
    
    // Extract the key identifiers from the release
    const result = {
      release_id: release.id,
      title: release.title,
      artists: release.artists?.map((a: any) => a.name),
      labels: release.labels?.map((l: any) => ({ name: l.name, catno: l.catno })),
      identifiers: release.identifiers,
      country: release.country,
      year: release.year,
      formats: release.formats,
      uri: release.uri,
      
      // What we expected to find
      expected: {
        barcode: '5027626416423',
        catno: 'SUMCD 4164',
        matrix: 'SUMCD 4164 01'
      },
      
      // What's actually on the release
      found: {
        barcodes: release.identifiers?.filter((i: any) => i.type === 'Barcode').map((i: any) => i.value) || [],
        matrices: release.identifiers?.filter((i: any) => 
          i.type === 'Matrix / Runout' || i.type?.includes('Matrix')
        ).map((i: any) => i.value) || [],
        all_identifiers: release.identifiers || [],
        catnos: release.labels?.map((l: any) => l.catno) || []
      }
    };
    
    // Check if our expected identifiers match
    const barcodeMatch = result.found.barcodes.some((b: string) => 
      b.replace(/[^0-9]/g, '') === result.expected.barcode
    );
    const catnoMatch = result.found.catnos.some((c: string) => 
      c.toUpperCase().replace(/\s+/g, ' ').trim() === result.expected.catno
    );
    
    result.verification = {
      barcode_match: barcodeMatch,
      catno_match: catnoMatch,
      conclusion: barcodeMatch && catnoMatch 
        ? 'IDENTIFIERS MATCH - Search API indexing issue suspected'
        : 'IDENTIFIERS DO NOT MATCH - Wrong release or OCR error'
    };

    return new Response(
      JSON.stringify(result, null, 2),
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
