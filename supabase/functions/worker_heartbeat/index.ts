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
    const { id, ts, status, polling_interval_ms, metadata } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing worker id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`💓 Heartbeat from worker: ${id}`);

    // Upsert worker stats
    const { error } = await supabaseClient
      .from('worker_stats')
      .upsert({
        id,
        last_heartbeat: ts || new Date().toISOString(),
        status: status || 'active',
        polling_interval_ms: polling_interval_ms || 5000,
        metadata: metadata || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('❌ Error upserting worker stats:', error);
      throw error;
    }

    console.log(`✅ Worker ${id} heartbeat recorded`);

    return new Response(
      JSON.stringify({ ok: true, message: 'Heartbeat received' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in worker_heartbeat:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
