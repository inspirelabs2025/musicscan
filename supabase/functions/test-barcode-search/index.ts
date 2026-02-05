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

    // Test the exact barcode from the Ella Fitzgerald CD
    const testBarcode = '5027626416423';
    const testCatno = 'SUMCD 4164';
    
    const results: any = {
      barcode_test: testBarcode,
      catno_test: testCatno,
      timestamp: new Date().toISOString(),
      searches: []
    };

    // STRATEGY 1: Pure barcode search (NO format, NO q)
    console.log(`🔍 Testing barcode search: ${testBarcode}`);
    const barcodeUrl = `https://api.discogs.com/database/search?barcode=${encodeURIComponent(testBarcode)}&type=release`;
    console.log(`📡 URL: ${barcodeUrl}`);
    
    const barcodeResponse = await fetch(barcodeUrl, {
      headers: {
        'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
        'Authorization': `Discogs token=${discogsToken}`
      }
    });
    
    console.log(`📊 Barcode response status: ${barcodeResponse.status}`);
    
    const barcodeSearch: any = {
      strategy: 'barcode',
      url: barcodeUrl,
      http_status: barcodeResponse.status,
      headers: Object.fromEntries(barcodeResponse.headers.entries())
    };
    
    if (barcodeResponse.status === 200) {
      const data = await barcodeResponse.json();
      barcodeSearch.has_results_field = 'results' in data;
      barcodeSearch.results_count = Array.isArray(data.results) ? data.results.length : 'NOT_ARRAY';
      barcodeSearch.pagination = data.pagination;
      
      if (Array.isArray(data.results) && data.results.length > 0) {
        barcodeSearch.first_result = {
          id: data.results[0].id,
          title: data.results[0].title,
          catno: data.results[0].catno,
          barcode: data.results[0].barcode,
          uri: data.results[0].uri
        };
      }
      
      console.log(`✅ Barcode search returned ${barcodeSearch.results_count} results`);
    } else {
      const errorText = await barcodeResponse.text();
      barcodeSearch.error = errorText.substring(0, 500);
      console.log(`❌ Barcode search failed: ${barcodeSearch.http_status}`);
    }
    
    results.searches.push(barcodeSearch);

    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // STRATEGY 2: Catno search (NO format)
    console.log(`🔍 Testing catno search: ${testCatno}`);
    const catnoUrl = `https://api.discogs.com/database/search?catno=${encodeURIComponent(testCatno)}&type=release`;
    console.log(`📡 URL: ${catnoUrl}`);
    
    const catnoResponse = await fetch(catnoUrl, {
      headers: {
        'User-Agent': 'MusicScan/1.0 +https://musicscan.app',
        'Authorization': `Discogs token=${discogsToken}`
      }
    });
    
    console.log(`📊 Catno response status: ${catnoResponse.status}`);
    
    const catnoSearch: any = {
      strategy: 'catno',
      url: catnoUrl,
      http_status: catnoResponse.status,
      headers: Object.fromEntries(catnoResponse.headers.entries())
    };
    
    if (catnoResponse.status === 200) {
      const data = await catnoResponse.json();
      catnoSearch.has_results_field = 'results' in data;
      catnoSearch.results_count = Array.isArray(data.results) ? data.results.length : 'NOT_ARRAY';
      catnoSearch.pagination = data.pagination;
      
      if (Array.isArray(data.results) && data.results.length > 0) {
        catnoSearch.first_result = {
          id: data.results[0].id,
          title: data.results[0].title,
          catno: data.results[0].catno,
          barcode: data.results[0].barcode,
          uri: data.results[0].uri
        };
      }
      
      console.log(`✅ Catno search returned ${catnoSearch.results_count} results`);
    } else {
      const errorText = await catnoResponse.text();
      catnoSearch.error = errorText.substring(0, 500);
      console.log(`❌ Catno search failed: ${catnoSearch.http_status}`);
    }
    
    results.searches.push(catnoSearch);

    // Summary
    results.summary = {
      barcode_found: barcodeSearch.results_count > 0,
      catno_found: catnoSearch.results_count > 0,
      expected_release_id: 4381440,
      expected_url: 'https://www.discogs.com/release/4381440-Ella-Fitzgerald-A-Portrait-Of-Ella-Fitzgerald'
    };

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
