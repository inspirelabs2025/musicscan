import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Testing new Discogs token...');
    
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    
    if (!discogsToken) {
      console.error('❌ DISCOGS_TOKEN not found in environment');
      return new Response(
        JSON.stringify({ error: 'DISCOGS_TOKEN not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Token found: ${discogsToken.substring(0, 10)}...`);

    // Test simple API call
    const testUrl = 'https://api.discogs.com/database/search?q=nirvana&type=release&per_page=1';
    
    console.log('🔍 Testing API call...');
    const response = await fetch(testUrl, {
      headers: {
        "Authorization": `Discogs token=${discogsToken}`,
        "User-Agent": "VinylVoyager/1.0",
        "Accept": "application/json"
      }
    });

    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} ${response.statusText}`, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Discogs API error',
          status: response.status,
          statusText: response.statusText,
          response: errorText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('✅ API call successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        tokenPresent: true,
        apiWorking: true,
        sampleData: data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Test failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Test failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});