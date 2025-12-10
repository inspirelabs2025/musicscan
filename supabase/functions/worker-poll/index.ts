import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-worker-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify worker secret
    const workerKey = req.headers.get('X-WORKER-KEY');
    const expectedKey = Deno.env.get('WORKER_SECRET');

    if (!workerKey || workerKey !== expectedKey) {
      console.error('❌ Unauthorized: Invalid or missing X-WORKER-KEY');
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const { worker_id, job_types } = body;

    console.log(`🔍 Worker ${worker_id || 'unknown'} polling for jobs...`);

    // Use the database function for atomic job claiming
    const { data: job, error } = await supabaseClient
      .rpc('claim_next_render_job', {
        p_worker_id: worker_id || 'fly-worker',
        p_job_types: job_types || null
      });

    if (error) {
      console.error('❌ Error claiming job:', error);
      throw error;
    }

    if (!job) {
      console.log('📭 No pending jobs available');
      return new Response(
        JSON.stringify({ ok: true, job: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Job claimed: ${job.id} (type: ${job.type})`);

    return new Response(
      JSON.stringify({ ok: true, job }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in worker-poll:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
