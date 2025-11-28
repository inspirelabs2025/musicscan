import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_access_token, app_secret: providedAppSecret } = await req.json();

    if (!user_access_token) {
      return new Response(
        JSON.stringify({ error: 'User access token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📘 Fetching Facebook pages with user token...');
    console.log('Token length:', user_access_token.length);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get App Secret from app_secrets or use provided one
    let appSecret = providedAppSecret;
    
    if (!appSecret) {
      const { data: secrets, error: secretsError } = await supabase
        .from('app_secrets')
        .select('secret_key, secret_value')
        .eq('secret_key', 'FACEBOOK_APP_SECRET')
        .single();

      if (secretsError || !secrets) {
        console.log('⚠️ No App Secret found in database, trying without appsecret_proof...');
        appSecret = null;
      } else {
        appSecret = secrets.secret_value;
        console.log('✅ App Secret found, length:', appSecret.length);
      }
    }

    // Build the API URL
    let pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${encodeURIComponent(user_access_token.trim())}`;
    
    // Only add appsecret_proof if we have the app secret
    if (appSecret) {
      // Generate appsecret_proof - MUST use the token being sent in the request
      const appsecretProof = createHmac('sha256', appSecret.trim())
        .update(user_access_token.trim())
        .digest('hex');
      
      console.log('🔐 Generated appsecret_proof (first 10 chars):', appsecretProof.substring(0, 10));
      pagesUrl += `&appsecret_proof=${appsecretProof}`;
    }
    
    console.log('🔗 Calling /me/accounts...');
    
    const response = await fetch(pagesUrl);
    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('Facebook API error:', result);
      
      // If appsecret_proof failed, try without it (for testing/debug)
      if (result.error?.message?.includes('signature') && appSecret) {
        console.log('⚠️ Signature failed, retrying without appsecret_proof...');
        
        const retryUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${encodeURIComponent(user_access_token.trim())}`;
        const retryResponse = await fetch(retryUrl);
        const retryResult = await retryResponse.json();
        
        if (!retryResponse.ok || retryResult.error) {
          console.error('Retry also failed:', retryResult);
          throw new Error(retryResult.error?.message || 'Failed to fetch pages');
        }
        
        console.log(`✅ Retry succeeded! Found ${retryResult.data?.length || 0} pages`);
        
        const pages = (retryResult.data || []).map((page: any) => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token,
          category: page.category
        }));

        return new Response(
          JSON.stringify({ 
            success: true, 
            pages,
            warning: 'appsecret_proof failed - please verify your App Secret is correct',
            message: `Found ${pages.length} page(s). Select one to save its Page Access Token.`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(result.error?.message || 'Failed to fetch pages');
    }

    console.log(`✅ Found ${result.data?.length || 0} pages`);

    // Return the pages with their tokens
    const pages = (result.data || []).map((page: any) => ({
      id: page.id,
      name: page.name,
      access_token: page.access_token,
      category: page.category
    }));

    return new Response(
      JSON.stringify({ 
        success: true, 
        pages,
        message: `Found ${pages.length} page(s). Select one to save its Page Access Token.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching page token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
