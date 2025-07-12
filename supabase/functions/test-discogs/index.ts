import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test data - Gilbert Bécaud album
const TEST_DATA = {
  artist: "Gilbert Becaud",
  title: "Voile", 
  catalog: "5C062.13024",
  label: "PATHE",
  country: "Netherlands",
  year: 1974
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`🔍 Starting Discogs API test with Gilbert Bécaud data`);
    
    // Get Discogs API credentials
    const discogsConsumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY');
    const discogsConsumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET');
    
    if (!discogsConsumerKey || !discogsConsumerSecret) {
      console.error('❌ Missing Discogs API credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Missing Discogs API credentials',
          hasKey: !!discogsConsumerKey,
          hasSecret: !!discogsConsumerSecret
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ Discogs credentials found - Key: ${discogsConsumerKey.substring(0, 8)}...`);

    const results = {
      testData: TEST_DATA,
      searchResults: [],
      errors: [],
      timestamp: new Date().toISOString()
    };

    // Test Strategy 1: Simple artist + title search
    try {
      console.log(`🔍 Test 1: Basic search - "${TEST_DATA.artist} ${TEST_DATA.title}"`);
      const basicQuery = `${TEST_DATA.artist} ${TEST_DATA.title}`;
      const basicUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(basicQuery)}&type=release&key=${discogsConsumerKey}&secret=${discogsConsumerSecret}&per_page=10`;
      
      console.log(`📡 Request URL: ${basicUrl}`);
      
      const basicResponse = await fetch(basicUrl, {
        headers: {
          'User-Agent': 'VinylScanner-Test/1.0'
        }
      });

      console.log(`📨 Response status: ${basicResponse.status}`);
      
      if (basicResponse.ok) {
        const basicData = await basicResponse.json();
        console.log(`✅ Basic search succeeded - Found ${basicData.results?.length || 0} results`);
        
        results.searchResults.push({
          strategy: 'basic_search',
          query: basicQuery,
          url: basicUrl,
          status: basicResponse.status,
          resultsCount: basicData.results?.length || 0,
          results: basicData.results?.slice(0, 3) || [], // First 3 results
          pagination: basicData.pagination
        });
      } else {
        const errorText = await basicResponse.text();
        console.error(`❌ Basic search failed: ${basicResponse.status} - ${errorText}`);
        results.errors.push({
          strategy: 'basic_search',
          status: basicResponse.status,
          error: errorText
        });
      }
    } catch (error) {
      console.error(`❌ Basic search exception:`, error);
      results.errors.push({
        strategy: 'basic_search',
        error: error.message
      });
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test Strategy 2: Catalog number search
    try {
      console.log(`🔍 Test 2: Catalog search - "${TEST_DATA.catalog}"`);
      const catalogUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(TEST_DATA.catalog)}&type=release&key=${discogsConsumerKey}&secret=${discogsConsumerSecret}&per_page=10`;
      
      console.log(`📡 Request URL: ${catalogUrl}`);
      
      const catalogResponse = await fetch(catalogUrl, {
        headers: {
          'User-Agent': 'VinylScanner-Test/1.0'
        }
      });

      console.log(`📨 Response status: ${catalogResponse.status}`);
      
      if (catalogResponse.ok) {
        const catalogData = await catalogResponse.json();
        console.log(`✅ Catalog search succeeded - Found ${catalogData.results?.length || 0} results`);
        
        results.searchResults.push({
          strategy: 'catalog_search',
          query: TEST_DATA.catalog,
          url: catalogUrl,
          status: catalogResponse.status,
          resultsCount: catalogData.results?.length || 0,
          results: catalogData.results?.slice(0, 3) || [],
          pagination: catalogData.pagination
        });
      } else {
        const errorText = await catalogResponse.text();
        console.error(`❌ Catalog search failed: ${catalogResponse.status} - ${errorText}`);
        results.errors.push({
          strategy: 'catalog_search',
          status: catalogResponse.status,
          error: errorText
        });
      }
    } catch (error) {
      console.error(`❌ Catalog search exception:`, error);
      results.errors.push({
        strategy: 'catalog_search',
        error: error.message
      });
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test Strategy 3: Combined search with label
    try {
      console.log(`🔍 Test 3: Combined search - "${TEST_DATA.artist} ${TEST_DATA.title} ${TEST_DATA.label}"`);
      const combinedQuery = `${TEST_DATA.artist} ${TEST_DATA.title} ${TEST_DATA.label}`;
      const combinedUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(combinedQuery)}&type=release&key=${discogsConsumerKey}&secret=${discogsConsumerSecret}&per_page=10`;
      
      console.log(`📡 Request URL: ${combinedUrl}`);
      
      const combinedResponse = await fetch(combinedUrl, {
        headers: {
          'User-Agent': 'VinylScanner-Test/1.0'
        }
      });

      console.log(`📨 Response status: ${combinedResponse.status}`);
      
      if (combinedResponse.ok) {
        const combinedData = await combinedResponse.json();
        console.log(`✅ Combined search succeeded - Found ${combinedData.results?.length || 0} results`);
        
        results.searchResults.push({
          strategy: 'combined_search',
          query: combinedQuery,
          url: combinedUrl,
          status: combinedResponse.status,
          resultsCount: combinedData.results?.length || 0,
          results: combinedData.results?.slice(0, 3) || [],
          pagination: combinedData.pagination
        });
      } else {
        const errorText = await combinedResponse.text();
        console.error(`❌ Combined search failed: ${combinedResponse.status} - ${errorText}`);
        results.errors.push({
          strategy: 'combined_search',
          status: combinedResponse.status,
          error: errorText
        });
      }
    } catch (error) {
      console.error(`❌ Combined search exception:`, error);
      results.errors.push({
        strategy: 'combined_search',
        error: error.message
      });
    }

    console.log(`🏁 Test completed - ${results.searchResults.length} successful searches, ${results.errors.length} errors`);
    
    return new Response(
      JSON.stringify(results, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Test function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Test function failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});