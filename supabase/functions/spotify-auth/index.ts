import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET') || '';

console.log('🎵 Spotify Auth Function initialized', { 
  hasClientId: !!SPOTIFY_CLIENT_ID, 
  hasClientSecret: !!SPOTIFY_CLIENT_SECRET 
});

// Validate environment variables
if (!SPOTIFY_CLIENT_ID) {
  console.error('❌ SPOTIFY_CLIENT_ID is not set');
}
if (!SPOTIFY_CLIENT_SECRET) {
  console.error('❌ SPOTIFY_CLIENT_SECRET is not set');
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

interface SpotifyUserResponse {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
  followers: { total: number };
  country: string;
}

serve(async (req) => {
  console.log('📥 Request received:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for required environment variables
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('❌ Missing required environment variables');
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error', 
        details: 'Spotify credentials not configured' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const body = await req.json();
    console.log('📝 Request body action:', body.action);
    
    // Handle configuration request
    if (body.action === 'get_config') {
      console.log('⚙️ Returning Spotify configuration');
      return new Response(
        JSON.stringify({ client_id: SPOTIFY_CLIENT_ID }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle token exchange
    const { code, code_verifier, redirect_uri } = body;

    if (!code || !code_verifier || !redirect_uri) {
      console.error('❌ Missing required parameters:', { code: !!code, code_verifier: !!code_verifier, redirect_uri: !!redirect_uri });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Starting token exchange...');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        code_verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('❌ Spotify token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorBody
      });
      return new Response(
        JSON.stringify({ 
          error: 'Token exchange failed', 
          details: `Spotify API error: ${tokenResponse.status} - ${errorBody}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData: SpotifyTokenResponse = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    // Get user profile from Spotify
    console.log('👤 Fetching user profile...');
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorBody = await userResponse.text();
      console.error('❌ Spotify user profile fetch failed:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        body: errorBody
      });
      return new Response(
        JSON.stringify({ 
          error: 'User profile fetch failed', 
          details: `Spotify API error: ${userResponse.status} - ${errorBody}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userData: SpotifyUserResponse = await userResponse.json();
    console.log('✅ User profile fetched:', { id: userData.id, display_name: userData.display_name });

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        user_data: {
          id: userData.id,
          display_name: userData.display_name,
          email: userData.email,
          image_url: userData.images?.[0]?.url,
          followers: userData.followers?.total,
          country: userData.country,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});