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

    const { minutes = 5, reset_errors = false } = await req.json().catch(() => ({}));

    let resetCount = 0;
    let allJobs: Array<{ id: string; artist: string; title: string; type: string }> = [];

    // Reset stuck running jobs back to pending
    if (!reset_errors) {
      console.log(`🔄 Resetting jobs stuck in 'running' for more than ${minutes} minutes...`);

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
        console.error('❌ Error resetting stuck jobs:', error);
        throw error;
      }

      resetCount = data?.length || 0;
      allJobs = data || [];
      console.log(`✅ Reset ${resetCount} stuck jobs`);
    }

    // Reset error jobs back to pending (if requested)
    if (reset_errors) {
      console.log('🔄 Resetting error jobs back to pending...');

      const { data: errorJobs, error: errorError } = await supabase
        .from('render_jobs')
        .update({
          status: 'pending',
          worker_id: null,
          started_at: null,
          locked_at: null,
          error_message: null,
        })
        .eq('status', 'error')
        .lt('retry_count', 3)
        .select('id, artist, title, type');

      if (errorError) {
        console.error('❌ Error resetting error jobs:', errorError);
        throw errorError;
      }

      resetCount = errorJobs?.length || 0;
      allJobs = errorJobs || [];
      console.log(`✅ Reset ${resetCount} error jobs back to pending`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        reset_count: resetCount,
        jobs: allJobs,
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
