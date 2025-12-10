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
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let query = supabaseClient
      .from('render_jobs')
      .select('id, status, type, payload, priority, attempts, max_attempts, image_url, source_type, created_at, updated_at, completed_at, error_message', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: jobs, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching render jobs:', error);
      throw error;
    }

    // Get stats
    const { data: statsData } = await supabaseClient
      .from('render_jobs')
      .select('status');
    
    const stats = {
      pending: 0,
      running: 0,
      done: 0,
      error: 0,
      poison: 0,
      total: statsData?.length || 0
    };
    statsData?.forEach(job => {
      if (job.status in stats) {
        stats[job.status as keyof typeof stats]++;
      }
    });

    // Get worker stats if requested
    let workerStats = null;
    const includeWorkerStats = url.searchParams.get('worker_stats') === 'true';
    if (includeWorkerStats) {
      const { data: workers } = await supabaseClient
        .from('worker_stats')
        .select('id, last_heartbeat, polling_interval_ms, status')
        .order('last_heartbeat', { ascending: false })
        .limit(1);
      
      if (workers && workers.length > 0) {
        workerStats = workers[0];
      }
    }

    console.log(`📋 Listed ${jobs?.length} render jobs (offset: ${offset}, limit: ${limit})`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        jobs, 
        stats,
        worker_stats: workerStats,
        pagination: {
          total: count,
          limit,
          offset,
          hasMore: (offset + limit) < (count || 0)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in list_render_jobs:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
