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

    const { id, status, result, error_message } = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required field: id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!status || !['done', 'error', 'pending', 'running'].includes(status)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid status. Must be: done, error, pending, or running' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📝 Worker updating job ${id} to status: ${status}`);

    // Use the database function for updating job status
    const { data: success, error } = await supabaseClient
      .rpc('update_render_job_status', {
        p_job_id: id,
        p_status: status,
        p_result: result || null,
        p_error_message: error_message || null
      });

    if (error) {
      console.error('❌ Error updating job:', error);
      throw error;
    }

    if (!success) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Job ${id} updated to ${status}`);

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in worker-update:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
