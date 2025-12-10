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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get next pending job
    const { data: job, error: fetchError } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !job) {
      console.log('No pending jobs found');
      return new Response(
        JSON.stringify({ ok: true, message: 'No pending jobs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing job ${job.id}: ${job.artist} - ${job.title}`);

    // Mark as running
    await supabase
      .from('render_jobs')
      .update({ 
        status: 'running', 
        started_at: new Date().toISOString(),
        worker_id: 'edge-function'
      })
      .eq('id', job.id);

    // Get image URL
    const imageUrl = job.image_url || job.payload?.album_cover_url || job.payload?.image_url;
    
    if (!imageUrl) {
      await supabase
        .from('render_jobs')
        .update({ 
          status: 'error', 
          error_message: 'No image URL found',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);
      
      return new Response(
        JSON.stringify({ ok: false, error: 'No image URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, just mark as done with placeholder - actual GIF generation happens on Fly.io worker
    // This edge function is for testing/fallback
    await supabase
      .from('render_jobs')
      .update({ 
        status: 'done', 
        completed_at: new Date().toISOString(),
        result: { message: 'Processed via edge function', image_url: imageUrl }
      })
      .eq('id', job.id);

    console.log(`Job ${job.id} completed`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        job_id: job.id,
        artist: job.artist,
        title: job.title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing render queue:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
