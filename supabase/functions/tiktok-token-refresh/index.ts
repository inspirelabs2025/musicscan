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

    console.log('Checking TikTok token status...');

    // Get all TikTok credentials
    const { data: secrets } = await supabaseClient
      .from('app_secrets')
      .select('secret_key, secret_value')
      .in('secret_key', [
        'TIKTOK_CLIENT_KEY',
        'TIKTOK_CLIENT_SECRET',
        'TIKTOK_REFRESH_TOKEN',
        'TIKTOK_TOKEN_EXPIRES_AT'
      ]);

    const secretsMap = (secrets || []).reduce((acc, s) => {
      acc[s.secret_key] = s.secret_value;
      return acc;
    }, {} as Record<string, string>);

    const clientKey = secretsMap['TIKTOK_CLIENT_KEY'];
    const clientSecret = secretsMap['TIKTOK_CLIENT_SECRET'];
    const refreshToken = secretsMap['TIKTOK_REFRESH_TOKEN'];
    const expiresAt = secretsMap['TIKTOK_TOKEN_EXPIRES_AT'] ? parseInt(secretsMap['TIKTOK_TOKEN_EXPIRES_AT']) : 0;

    if (!clientKey || !clientSecret || !refreshToken) {
      console.log('TikTok credentials not configured, skipping refresh');
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'TikTok credentials not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refresh (within 1 hour of expiry)
    const oneHourFromNow = Date.now() + (60 * 60 * 1000);
    if (expiresAt > oneHourFromNow) {
      console.log('Token still valid, no refresh needed');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Token still valid',
          expires_in: Math.floor((expiresAt - Date.now()) / 1000)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Refreshing TikTok access token...');

    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('TikTok token refresh failed:', tokenData);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: tokenData.error_description || tokenData.error
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store new tokens
    const tokensToStore = [
      { key: 'TIKTOK_ACCESS_TOKEN', value: tokenData.access_token },
      { key: 'TIKTOK_REFRESH_TOKEN', value: tokenData.refresh_token },
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

    console.log('TikTok tokens refreshed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Token refreshed successfully',
        expires_in: tokenData.expires_in
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in tiktok-token-refresh:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
