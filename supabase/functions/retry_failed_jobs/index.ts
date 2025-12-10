import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
};

const MAX_RETRIES = 3;
const BATCH_LIMIT = 50;

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

    console.log('🔄 Fetching failed jobs for retry...');

    // Fetch jobs: status='error', retry_count < 3, dead_letter=false
    const { data: failedJobs, error: fetchError } = await supabaseClient
      .from('render_jobs')
      .select('id, retry_count')
      .eq('status', 'error')
      .eq('dead_letter', false)
      .lt('retry_count', MAX_RETRIES)
      .limit(BATCH_LIMIT);

    if (fetchError) {
      console.error('❌ Error fetching failed jobs:', fetchError);
      throw fetchError;
    }

    if (!failedJobs || failedJobs.length === 0) {
      console.log('✅ No failed jobs to retry');
      return new Response(
        JSON.stringify({ ok: true, retried: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${failedJobs.length} failed jobs to process`);

    let retriedCount = 0;

    // Process each job - increment retry_count and reset to pending
    for (const job of failedJobs) {
      const newRetryCount = (job.retry_count || 0) + 1;

      // Check if this would exceed max retries
      if (newRetryCount >= MAX_RETRIES) {
        // Mark as dead letter (poison)
        const { error: poisonError } = await supabaseClient
          .from('render_jobs')
          .update({
            dead_letter: true,
            last_error: `Exceeded max retries (${MAX_RETRIES})`,
            retry_count: newRetryCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (poisonError) {
          console.error(`❌ Error marking job ${job.id} as dead_letter:`, poisonError);
        } else {
          console.log(`☠️ Job ${job.id} marked as dead_letter (retry_count: ${newRetryCount})`);
        }
      } else {
        // Retry the job
        const { error: retryError } = await supabaseClient
          .from('render_jobs')
          .update({
            status: 'pending',
            retry_count: newRetryCount,
            last_error: null,
            locked_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (retryError) {
          console.error(`❌ Error retrying job ${job.id}:`, retryError);
        } else {
          console.log(`🔄 Job ${job.id} queued for retry (attempt ${newRetryCount}/${MAX_RETRIES})`);
          retriedCount++;
        }
      }
    }

    console.log(`✅ Retry complete: ${retriedCount} jobs queued for retry`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        retried: retriedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in retry_failed_jobs:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
