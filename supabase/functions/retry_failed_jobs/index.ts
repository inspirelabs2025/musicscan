import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔐 Validate X-ADMIN-KEY header
    const adminKey = req.headers.get('X-ADMIN-KEY');
    const expectedKey = Deno.env.get('ADMIN_SECRET');

    if (!adminKey || adminKey !== expectedKey) {
      console.error('❌ Unauthorized: Invalid or missing X-ADMIN-KEY');
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all failed jobs
    const { data: failedJobs, error: fetchError } = await supabaseClient
      .from('render_jobs')
      .select('id, type, payload, priority')
      .eq('status', 'error');

    if (fetchError) {
      console.error('❌ Error fetching failed jobs:', fetchError);
      throw fetchError;
    }

    if (!failedJobs || failedJobs.length === 0) {
      console.log('ℹ️ No failed jobs to retry');
      return new Response(
        JSON.stringify({ ok: true, retried: 0, message: 'No failed jobs to retry' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Retrying ${failedJobs.length} failed jobs`);

    // Reset failed jobs to pending
    const { error: updateError } = await supabaseClient
      .from('render_jobs')
      .update({ 
        status: 'pending', 
        attempts: 0, 
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('status', 'error');

    if (updateError) {
      console.error('❌ Error resetting failed jobs:', updateError);
      throw updateError;
    }

    console.log(`✅ Reset ${failedJobs.length} jobs to pending`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        retried: failedJobs.length,
        message: `${failedJobs.length} jobs reset to pending`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in retry_failed_jobs:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
