import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueJobRequest {
  imageUrl: string;
  sourceType: 'blog_post' | 'music_story' | 'single';
  sourceId?: string;
  artist?: string;
  title?: string;
  priority?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: QueueJobRequest = await req.json();
    
    // Validate required fields
    if (!body.imageUrl || !body.sourceType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageUrl, sourceType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate jobs
    if (body.sourceId) {
      const { data: existing } = await supabase
        .from('render_jobs')
        .select('id, status')
        .eq('source_type', body.sourceType)
        .eq('source_id', body.sourceId)
        .in('status', ['pending', 'processing'])
        .single();

      if (existing) {
        console.log(`Job already exists for ${body.sourceType}/${body.sourceId}: ${existing.status}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Job already queued',
            jobId: existing.id,
            status: existing.status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert new job
    const { data: job, error } = await supabase
      .from('render_jobs')
      .insert({
        image_url: body.imageUrl,
        source_type: body.sourceType,
        source_id: body.sourceId || null,
        artist: body.artist || 'Unknown Artist',
        title: body.title || 'Unknown Title',
        priority: body.priority || 0,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting job:', error);
      throw error;
    }

    console.log(`✅ Queued render job: ${job.id} for ${body.artist} - ${body.title}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        message: 'Job queued successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in queue-render-job:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
