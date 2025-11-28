import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { encode } from 'https://deno.land/std@0.208.0/encoding/hex.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate appsecret_proof using HMAC-SHA256
async function generateAppSecretProof(accessToken: string, appSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(appSecret);
  const messageData = encoder.encode(accessToken);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = new Uint8Array(signature);
  return new TextDecoder().decode(encode(hashArray));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_access_token } = await req.json();

    if (!user_access_token) {
      return new Response(
        JSON.stringify({ error: 'User access token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the token - remove any whitespace, newlines
    const cleanToken = user_access_token.trim().replace(/[\r\n\s]/g, '');
    
    console.log('📘 Fetching Facebook pages with user token...');
    console.log('Token length:', cleanToken.length);
    console.log('Token starts with:', cleanToken.substring(0, 10));
    console.log('Token ends with:', cleanToken.substring(cleanToken.length - 10));

    // Basic validation - Facebook tokens usually start with EAA
    if (!cleanToken.startsWith('EAA') && !cleanToken.startsWith('EAAG')) {
      console.error('⚠️ Token does not look like a Facebook access token');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid token format. Facebook access tokens typically start with "EAA". Please copy the complete token from Graph API Explorer.',
          hint: 'Make sure you copied the entire token without any extra characters.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch FACEBOOK_APP_SECRET from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: secretData, error: secretError } = await supabase
      .from('app_secrets')
      .select('secret_value')
      .eq('secret_key', 'FACEBOOK_APP_SECRET')
      .single();

    if (secretError || !secretData) {
      console.error('❌ Could not fetch FACEBOOK_APP_SECRET:', secretError);
      return new Response(
        JSON.stringify({ 
          error: 'FACEBOOK_APP_SECRET not configured',
          hint: 'Please add your Facebook APP_SECRET in the admin secrets page.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appSecret = secretData.secret_value;
    const appSecretProof = await generateAppSecretProof(cleanToken, appSecret);
    
    console.log('🔐 Generated appsecret_proof');

    // Call Facebook API with appsecret_proof
    const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${encodeURIComponent(cleanToken)}&appsecret_proof=${appSecretProof}`;
    
    console.log('🔗 Calling /me/accounts without appsecret_proof...');
    
    const response = await fetch(pagesUrl);
    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('Facebook API error:', JSON.stringify(result, null, 2));
      
      // Provide helpful error messages based on Facebook error codes
      let errorMessage = result.error?.message || 'Failed to fetch pages';
      let hint = '';
      
      if (result.error?.code === 190) {
        if (result.error?.error_subcode === 463) {
          hint = 'Token is expired. Please generate a new access token from Graph API Explorer.';
        } else if (result.error?.error_subcode === 467) {
          hint = 'Token is invalid. Please generate a new access token from Graph API Explorer.';
        } else if (result.error?.message?.includes('signature')) {
          hint = 'Token signature issue. Make sure you are using the token from Graph API Explorer, not from Access Token Debugger output.';
        } else {
          hint = 'Token is invalid or expired. Please generate a fresh access token from Graph API Explorer with pages_manage_posts permission.';
        }
      } else if (result.error?.code === 100) {
        hint = 'Missing required permissions. Make sure you added pages_manage_posts and pages_read_engagement permissions.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          hint: hint,
          facebook_error: result.error
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Success! Found ${result.data?.length || 0} pages`);

    // Return the pages with their tokens
    const pages = (result.data || []).map((page: any) => ({
      id: page.id,
      name: page.name,
      access_token: page.access_token,
      category: page.category
    }));

    if (pages.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          pages: [],
          warning: 'No pages found. Make sure your Facebook account manages at least one Facebook Page and you granted page permissions.',
          message: 'No pages found for this account.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      JSON.stringify({ 
        error: error.message,
        hint: 'An unexpected error occurred. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
