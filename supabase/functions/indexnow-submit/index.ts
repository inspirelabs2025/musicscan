import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDEXNOW_KEY = '8f9a2b7e4c1d6e3a5f0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7';
const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
const BASE_URL = 'https://www.musicscan.app';

interface IndexNowRequest {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { urls, contentType } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      throw new Error('No URLs provided');
    }

    console.log(`[IndexNow] Submitting ${urls.length} URLs of type: ${contentType}`);

    // Build full URLs
    const fullUrls = urls.map(url => {
      if (url.startsWith('http')) return url;
      return `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    });

    // IndexNow payload
    const payload: IndexNowRequest = {
      host: 'www.musicscan.app',
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/indexnow-key.txt`,
      urlList: fullUrls
    };

    console.log('[IndexNow] Payload:', JSON.stringify(payload, null, 2));

    // Submit to IndexNow API
    const response = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    const statusCode = response.status;
    let responseBody = '';
    
    try {
      responseBody = await response.text();
    } catch (e) {
      console.log('[IndexNow] No response body');
    }

    // Log submission to database
    await supabaseClient.from('indexnow_submissions').insert({
      urls: fullUrls,
      content_type: contentType || 'unknown',
      status_code: statusCode,
      response_body: responseBody || null,
      submitted_at: new Date().toISOString()
    });

    // Handle different status codes
    if (statusCode === 200) {
      console.log('[IndexNow] ✅ Successfully submitted');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully submitted ${urls.length} URLs to IndexNow`,
          urls: fullUrls 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (statusCode === 202) {
      console.log('[IndexNow] ✅ Accepted for processing');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Accepted ${urls.length} URLs for processing`,
          urls: fullUrls 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (statusCode === 429) {
      console.warn('[IndexNow] ⚠️ Rate limit exceeded');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Rate limit exceeded. Try again later.',
          retryAfter: response.headers.get('Retry-After')
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.error(`[IndexNow] ❌ Error: ${statusCode}`, responseBody);
      throw new Error(`IndexNow API returned status ${statusCode}: ${responseBody}`);
    }

  } catch (error) {
    console.error('[IndexNow] Exception:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
