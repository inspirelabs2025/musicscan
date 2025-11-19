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
    // Initialize Supabase client with service role for writing secrets
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token } = await req.json();

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Valid token is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Saving Facebook Page Access Token...');

    // Upsert the token (insert or update if exists)
    const { data, error } = await supabaseClient
      .from('app_secrets')
      .upsert({
        secret_key: 'FACEBOOK_PAGE_ACCESS_TOKEN',
        secret_value: token.trim(),
        description: 'Facebook Page Access Token for catalog synchronization',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'secret_key'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save token:', error);
      throw error;
    }

    console.log('Token saved successfully:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Token saved successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in save-facebook-token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
