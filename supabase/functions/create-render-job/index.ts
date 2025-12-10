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

    const { type, payload, priority = 0 } = await req.json();

    if (!type) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📥 Creating render job: type=${type}, priority=${priority}`);

    const { data, error } = await supabaseClient
      .from('render_jobs')
      .insert({
        type,
        payload: payload || {},
        priority,
        status: 'pending',
        attempts: 0,
        max_attempts: 3
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating render job:', error);
      throw error;
    }

    console.log(`✅ Render job created: ${data.id}`);

    return new Response(
      JSON.stringify({ ok: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-render-job:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
