import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔐 Exchanging Threads authorization code for access token...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Threads App credentials from app_secrets
    const { data: secrets, error: secretsError } = await supabase
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', ['THREADS_APP_ID', 'THREADS_APP_SECRET']);

    if (secretsError || !secrets || secrets.length === 0) {
      console.error('Failed to fetch Threads app credentials:', secretsError);
      throw new Error('Threads app credentials not configured. Please add THREADS_APP_ID and THREADS_APP_SECRET to app_secrets.');
    }

    const credentials: Record<string, string> = {};
    secrets.forEach(s => {
      credentials[s.secret_key] = s.secret_value;
    });

    const appId = credentials['THREADS_APP_ID'];
    const appSecret = credentials['THREADS_APP_SECRET'];

    if (!appId || !appSecret) {
      throw new Error('Missing THREADS_APP_ID or THREADS_APP_SECRET in app_secrets');
    }

    // Exchange code for short-lived access token
    const tokenUrl = 'https://graph.threads.net/oauth/access_token';
    
    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri || 'https://www.musicscan.app/',
      code: code,
    });

    console.log('🔄 Requesting short-lived token...');

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    });

    const tokenResult = await tokenResponse.json();

    if (!tokenResponse.ok || tokenResult.error) {
      console.error('Token exchange error:', tokenResult);
      throw new Error(tokenResult.error?.message || tokenResult.error_description || 'Failed to exchange code for token');
    }

    console.log('✅ Short-lived token obtained, user_id:', tokenResult.user_id);

    // Exchange short-lived token for long-lived token
    const longLivedUrl = `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${appSecret}&access_token=${tokenResult.access_token}`;
    
    console.log('🔄 Exchanging for long-lived token...');

    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedResult = await longLivedResponse.json();

    if (!longLivedResponse.ok || longLivedResult.error) {
      console.error('Long-lived token exchange error:', longLivedResult);
      // Fall back to short-lived token if long-lived fails
      console.log('⚠️ Using short-lived token as fallback');
    }

    const finalToken = longLivedResult.access_token || tokenResult.access_token;
    const userId = tokenResult.user_id;

    // Store the tokens in app_secrets
    const secretsToStore = [
      { secret_key: 'THREADS_ACCESS_TOKEN', secret_value: finalToken },
      { secret_key: 'THREADS_USER_ID', secret_value: userId.toString() },
    ];

    for (const secret of secretsToStore) {
      const { error: upsertError } = await supabase
        .from('app_secrets')
        .upsert(secret, { onConflict: 'secret_key' });

      if (upsertError) {
        console.error(`Failed to store ${secret.secret_key}:`, upsertError);
        throw new Error(`Failed to store ${secret.secret_key}`);
      }
    }

    console.log('✅ Threads credentials stored successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        token_type: longLivedResult.access_token ? 'long_lived' : 'short_lived',
        expires_in: longLivedResult.expires_in || tokenResult.expires_in,
        message: 'Threads access token stored successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error exchanging Threads token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
