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

    const { secret_key, secret_value } = await req.json();

    if (!secret_key || typeof secret_key !== 'string' || secret_key.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Valid secret_key is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!secret_value || typeof secret_value !== 'string' || secret_value.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Valid secret_value is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Saving Facebook credential: ${secret_key}`);

    // Upsert the secret (insert or update if exists)
    const { data, error } = await supabaseClient
      .from('app_secrets')
      .upsert({
        secret_key: secret_key.trim(),
        secret_value: secret_value.trim(),
        description: `Facebook credential: ${secret_key}`,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'secret_key'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save secret:', error);
      throw error;
    }

    console.log('Secret saved successfully:', data.id);

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
