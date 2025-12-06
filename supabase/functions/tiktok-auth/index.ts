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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, code, redirect_uri } = await req.json();

    // Get TikTok credentials from app_secrets
    const { data: secrets } = await supabaseClient
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET']);

    const secretsMap = (secrets || []).reduce((acc, s) => {
      acc[s.secret_key] = s.secret_value;
      return acc;
    }, {} as Record<string, string>);

    const clientKey = secretsMap['TIKTOK_CLIENT_KEY'];
    const clientSecret = secretsMap['TIKTOK_CLIENT_SECRET'];

    if (!clientKey || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'TikTok credentials not configured',
          missing: !clientKey ? 'TIKTOK_CLIENT_KEY' : 'TIKTOK_CLIENT_SECRET'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get OAuth URL
    if (action === 'get_auth_url') {
      const csrfState = crypto.randomUUID();
      const scope = 'user.info.basic,video.upload,video.publish';
      
      const authUrl = `https://www.tiktok.com/v2/auth/authorize/?` +
        `client_key=${clientKey}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirect_uri)}&` +
        `state=${csrfState}`;

      return new Response(
        JSON.stringify({ auth_url: authUrl, state: csrfState }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Exchange code for tokens
    if (action === 'exchange_code') {
      if (!code) {
        return new Response(
          JSON.stringify({ error: 'Authorization code required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Exchanging authorization code for tokens...');

      const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirect_uri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error('TikTok token exchange failed:', tokenData);
        return new Response(
          JSON.stringify({ error: tokenData.error_description || tokenData.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store tokens in app_secrets
      const tokensToStore = [
        { key: 'TIKTOK_ACCESS_TOKEN', value: tokenData.access_token },
        { key: 'TIKTOK_REFRESH_TOKEN', value: tokenData.refresh_token },
        { key: 'TIKTOK_OPEN_ID', value: tokenData.open_id },
        { key: 'TIKTOK_TOKEN_EXPIRES_AT', value: String(Date.now() + (tokenData.expires_in * 1000)) },
      ];

      for (const token of tokensToStore) {
        await supabaseClient
          .from('app_secrets')
          .upsert({
            secret_key: token.key,
            secret_value: token.value,
            description: `TikTok ${token.key}`,
            updated_at: new Date().toISOString()
          }, { onConflict: 'secret_key' });
      }

      console.log('TikTok tokens stored successfully');

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'TikTok authentication successful',
          expires_in: tokenData.expires_in,
          scope: tokenData.scope
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Check token status
    if (action === 'check_status') {
      const { data: tokenSecrets } = await supabaseClient
        .from('app_secrets')
        .select('secret_key, secret_value')
        .in('secret_key', ['TIKTOK_ACCESS_TOKEN', 'TIKTOK_TOKEN_EXPIRES_AT']);

      const tokenMap = (tokenSecrets || []).reduce((acc, s) => {
        acc[s.secret_key] = s.secret_value;
        return acc;
      }, {} as Record<string, string>);

      const hasToken = !!tokenMap['TIKTOK_ACCESS_TOKEN'];
      const expiresAt = tokenMap['TIKTOK_TOKEN_EXPIRES_AT'] ? parseInt(tokenMap['TIKTOK_TOKEN_EXPIRES_AT']) : 0;
      const isExpired = expiresAt < Date.now();
      const expiresIn = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

      return new Response(
        JSON.stringify({
          connected: hasToken && !isExpired,
          has_token: hasToken,
          is_expired: isExpired,
          expires_in_seconds: expiresIn,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in tiktok-auth:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
