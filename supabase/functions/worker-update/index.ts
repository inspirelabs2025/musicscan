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

    const body = await req.json().catch(() => null);

    if (!body?.id || !body?.status) {
      console.error('❌ Missing id or status in request body');
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing id or status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { id, status, result, error_message } = body;

    console.log(`📝 Worker updating job ${id} to status: ${status}`);

    // Direct table update instead of RPC
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'done') {
      updateData.completed_at = new Date().toISOString();
      if (result) {
        updateData.result = result;
      }
    }

    if (status === 'error' && error_message) {
      updateData.error_message = error_message;
    }

    const { error, count } = await supabaseClient
      .from('render_jobs')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('❌ Update error:', error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
