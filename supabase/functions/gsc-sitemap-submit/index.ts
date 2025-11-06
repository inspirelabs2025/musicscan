import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleOAuthCredentials {
  client_email: string;
  private_key: string;
}

async function getAccessToken(credentials: GoogleOAuthCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const privateKey = await importPKCS8(credentials.private_key, 'RS256');
  
  const jwt = await new SignJWT({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const credentialsJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!credentialsJson) {
      console.log('GOOGLE_SERVICE_ACCOUNT_KEY not configured, skipping GSC submission');
      return new Response(
        JSON.stringify({ success: false, message: 'GSC credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const credentials: GoogleOAuthCredentials = JSON.parse(credentialsJson);
    const accessToken = await getAccessToken(credentials);
    
    // Site URL moet exact matchen met GSC property
    const siteUrl = 'sc-domain:musicscan.app';
    
    // Submit alle sitemaps
    const sitemapsToSubmit = [
      'https://www.musicscan.app/sitemap.xml',
      'https://www.musicscan.app/sitemaps/sitemap-static.xml',
      'https://www.musicscan.app/sitemaps/sitemap-blog.xml',
      'https://www.musicscan.app/sitemaps/sitemap-music-stories.xml',
      'https://www.musicscan.app/sitemaps/sitemap-products.xml',
      'https://www.musicscan.app/sitemaps/sitemap-images-blogs.xml',
      'https://www.musicscan.app/sitemaps/sitemap-images-stories.xml',
      'https://www.musicscan.app/sitemaps/sitemap-images-products.xml',
    ];
    
    const results = [];
    
    for (const feedpath of sitemapsToSubmit) {
      const submitUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(feedpath)}`;
      
      const response = await fetch(submitUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      results.push({
        sitemap: feedpath,
        status: response.status,
        ok: response.ok,
        response: response.ok ? 'submitted' : await response.text(),
      });
      
      console.log(`GSC submit ${feedpath}: ${response.status}`);
      
      // Rate limiting: 1 request per seconde
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        submitted: results.filter(r => r.ok).length,
        failed: results.filter(r => !r.ok).length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('GSC submission error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
