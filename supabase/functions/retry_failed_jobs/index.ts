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

    // Get failed jobs (limit 50)
    const { data: failedJobs, error: fetchError } = await supabaseClient
      .from('render_jobs')
      .select('id, attempts')
      .eq('status', 'error')
      .limit(BATCH_LIMIT);

    if (fetchError) {
      console.error('❌ Error fetching failed jobs:', fetchError);
      throw fetchError;
    }

    if (!failedJobs || failedJobs.length === 0) {
      console.log('ℹ️ No failed jobs to retry');
      return new Response(
        JSON.stringify({ ok: true, retried: 0, poisoned: 0, message: 'No failed jobs to retry' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Separate jobs: retryable vs poison
    const retryableJobs = failedJobs.filter(job => (job.attempts || 0) < MAX_RETRIES);
    const poisonJobs = failedJobs.filter(job => (job.attempts || 0) >= MAX_RETRIES);

    console.log(`🔄 Found ${failedJobs.length} failed jobs: ${retryableJobs.length} retryable, ${poisonJobs.length} poison`);

    let retriedCount = 0;
    let poisonedCount = 0;

    // Reset retryable jobs to pending with incremented attempts
    if (retryableJobs.length > 0) {
      const retryableIds = retryableJobs.map(j => j.id);
      
      // Update each job individually to increment attempts
      for (const job of retryableJobs) {
        const { error: updateError } = await supabaseClient
          .from('render_jobs')
          .update({ 
            status: 'pending', 
            attempts: (job.attempts || 0) + 1,
            error_message: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (!updateError) {
          retriedCount++;
        } else {
          console.error(`❌ Failed to retry job ${job.id}:`, updateError);
        }
      }
      
      console.log(`✅ Reset ${retriedCount} jobs to pending`);
    }

    // Mark poison jobs
    if (poisonJobs.length > 0) {
      const poisonIds = poisonJobs.map(j => j.id);
      
      const { error: poisonError } = await supabaseClient
        .from('render_jobs')
        .update({ 
          status: 'poison',
          error_message: `Exceeded max retries (${MAX_RETRIES})`,
          updated_at: new Date().toISOString()
        })
        .in('id', poisonIds);

      if (!poisonError) {
        poisonedCount = poisonJobs.length;
        console.log(`☠️ Marked ${poisonedCount} jobs as poison`);
      } else {
        console.error('❌ Error marking poison jobs:', poisonError);
      }
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        retried: retriedCount,
        poisoned: poisonedCount,
        message: `${retriedCount} jobs retried, ${poisonedCount} marked as poison`
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
