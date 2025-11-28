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
    const { user_access_token } = await req.json();

    if (!user_access_token) {
      return new Response(
        JSON.stringify({ error: 'User access token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📘 Fetching Facebook pages with user token...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get App Secret from app_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('app_secrets')
      .select('secret_key, secret_value')
      .eq('secret_key', 'FACEBOOK_APP_SECRET')
      .single();

    if (secretsError || !secrets) {
      console.error('Failed to fetch App Secret:', secretsError);
      throw new Error('Facebook App Secret not configured. Please add it first.');
    }

    const appSecret = secrets.secret_value;

    // Generate appsecret_proof
    const appsecretProof = createHmac('sha256', appSecret)
      .update(user_access_token)
      .digest('hex');

    // Fetch pages the user manages
    const pagesUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${encodeURIComponent(user_access_token)}&appsecret_proof=${appsecretProof}`;
    
    console.log('🔗 Calling /me/accounts...');
    
    const response = await fetch(pagesUrl);
    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('Facebook API error:', result);
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
