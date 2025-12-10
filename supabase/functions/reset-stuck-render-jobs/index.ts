import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { minutes = 5 } = await req.json().catch(() => ({}));

    console.log(`🔄 Resetting jobs stuck in 'running' for more than ${minutes} minutes...`);

    // Reset stuck running jobs back to pending
    const { data, error } = await supabase
      .from('render_jobs')
      .update({
        status: 'pending',
        worker_id: null,
        started_at: null,
        locked_at: null,
      })
      .eq('status', 'running')
      .lt('updated_at', new Date(Date.now() - minutes * 60 * 1000).toISOString())
      .select('id, artist, title, type');

    if (error) {
      console.error('❌ Error resetting jobs:', error);
      throw error;
    }

    console.log(`✅ Reset ${data?.length || 0} stuck jobs`);

    return new Response(
      JSON.stringify({
        success: true,
        reset_count: data?.length || 0,
        jobs: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
