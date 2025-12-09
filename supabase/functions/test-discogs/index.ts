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
    console.log(`🔍 Starting Discogs API authentication test with Gilbert Bécaud data`);
    
    // Get all possible Discogs API credentials
    const discogsConsumerKey = Deno.env.get('DISCOGS_CONSUMER_KEY');
    const discogsConsumerSecret = Deno.env.get('DISCOGS_CONSUMER_SECRET');
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    
    console.log(`📋 Credential Status:
    - Consumer Key: ${discogsConsumerKey ? `✅ (${discogsConsumerKey.substring(0, 8)}...)` : '❌ Missing'}
    - Consumer Secret: ${discogsConsumerSecret ? `✅ (${discogsConsumerSecret.substring(0, 8)}...)` : '❌ Missing'} 
    - Personal Token: ${discogsToken ? `✅ (${discogsToken.substring(0, 8)}...)` : '❌ Missing'}`);

    if (!discogsConsumerKey && !discogsToken) {
      console.error('❌ No Discogs API credentials found');
      return new Response(
        JSON.stringify({ 
          error: 'No Discogs API credentials found. Need either Consumer Key/Secret or Personal Access Token',
          hasConsumerKey: !!discogsConsumerKey,
          hasConsumerSecret: !!discogsConsumerSecret,
          hasPersonalToken: !!discogsToken
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results = {
      testData: TEST_DATA,
      authenticationTests: [],
      searchResults: [],
      errors: [],
      timestamp: new Date().toISOString()
    };

    // Function to test authentication methods
    async function testAuthentication(method: string, url: string, headers: Record<string, string>) {
      console.log(`🔐 Testing ${method} authentication`);
      console.log(`📡 Request URL: ${url}`);
      console.log(`📋 Headers:`, Object.keys(headers).join(', '));
      
      try {
        const response = await fetch(url, { headers });
        const responseText = await response.text();
        
        console.log(`📨 ${method} Response: ${response.status}`);
        
        const authTest = {
          method,
          url,
          status: response.status,
          success: response.ok,
          error: response.ok ? null : responseText,
          timestamp: new Date().toISOString()
        };
        
        results.authenticationTests.push(authTest);
        
        if (response.ok) {
          console.log(`✅ ${method} authentication successful!`);
          return { success: true, data: JSON.parse(responseText) };
        } else {
          console.error(`❌ ${method} authentication failed: ${response.status} - ${responseText}`);
          return { success: false, error: responseText };
        }
      } catch (error) {
        console.error(`❌ ${method} authentication exception:`, error);
        const authTest = {
          method,
          url,
          status: 0,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        results.authenticationTests.push(authTest);
        return { success: false, error: error.message };
      }
    }

    // Test 1: Personal Access Token authentication (if available)
    let workingAuth = null;
    
    if (discogsToken) {
      const tokenUrl = `https://api.discogs.com/database/search?q=test&type=release&per_page=1`;
      const tokenHeaders = {
        'User-Agent': 'VinylScanner-Test/1.0',
        'Authorization': `Discogs token=${discogsToken}`
      };
      
      const tokenResult = await testAuthentication('Personal Access Token', tokenUrl, tokenHeaders);
      if (tokenResult.success) {
        workingAuth = { type: 'token', token: discogsToken };
      }
    }

    // Test 2: Consumer Key/Secret authentication (if available and token didn't work)
    if (!workingAuth && discogsConsumerKey && discogsConsumerSecret) {
      const keySecretUrl = `https://api.discogs.com/database/search?q=test&type=release&per_page=1`;
      const keySecretHeaders = {
        'User-Agent': 'VinylScanner-Test/1.0',
        'Authorization': `Discogs key=${discogsConsumerKey}, secret=${discogsConsumerSecret}`
      };
      
      const keySecretResult = await testAuthentication('Consumer Key/Secret', keySecretUrl, keySecretHeaders);
      if (keySecretResult.success) {
        workingAuth = { type: 'key_secret', key: discogsConsumerKey, secret: discogsConsumerSecret };
      }
    }

    if (!workingAuth) {
      console.error('❌ No working authentication method found');
      return new Response(
        JSON.stringify(results, null, 2),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🎉 Found working authentication: ${workingAuth.type}`);

    // Now perform actual searches with working authentication
    async function makeAuthenticatedRequest(query: string, strategy: string) {
      let url: string;
      let headers: Record<string, string> = { 'User-Agent': 'VinylScanner-Test/1.0' };
      
      if (workingAuth.type === 'token') {
        url = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&per_page=10`;
        headers['Authorization'] = `Discogs token=${workingAuth.token}`;
      } else {
        url = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&per_page=10`;
        headers['Authorization'] = `Discogs key=${workingAuth.key}, secret=${workingAuth.secret}`;
      }

      console.log(`🔍 ${strategy}: "${query}"`);
      console.log(`📡 Request URL: ${url}`);
      
      try {
        const response = await fetch(url, { headers });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${strategy} succeeded - Found ${data.results?.length || 0} results`);
          
          results.searchResults.push({
            strategy,
            query,
            url: url.replace(/key=[^&]*/, 'key=***').replace(/secret=[^&]*/, 'secret=***').replace(/token=[^&]*/, 'token=***'),
            status: response.status,
            resultsCount: data.results?.length || 0,
            results: data.results?.slice(0, 3) || [],
            pagination: data.pagination,
            authMethod: workingAuth.type
          });
        } else {
          const errorText = await response.text();
          console.error(`❌ ${strategy} failed: ${response.status} - ${errorText}`);
          results.errors.push({
            strategy,
            status: response.status,
            error: errorText,
            authMethod: workingAuth.type
          });
        }
      } catch (error) {
        console.error(`❌ ${strategy} exception:`, error);
        results.errors.push({
          strategy,
          error: error.message,
          authMethod: workingAuth.type
        });
      }
    }

    // Test Strategy 1: Simple artist + title search
    await makeAuthenticatedRequest(`${TEST_DATA.artist} ${TEST_DATA.title}`, 'basic_search');
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test Strategy 2: Catalog number search
    await makeAuthenticatedRequest(TEST_DATA.catalog, 'catalog_search');
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test Strategy 3: Combined search with label
    const combinedQuery = `${TEST_DATA.artist} ${TEST_DATA.title} ${TEST_DATA.label}`;
    await makeAuthenticatedRequest(combinedQuery, 'combined_search');

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