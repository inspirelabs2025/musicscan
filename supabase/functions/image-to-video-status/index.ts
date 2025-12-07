import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const renderId = url.searchParams.get('render_id');

    if (!renderId) {
      return new Response(
        JSON.stringify({ error: 'render_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check video render queue
    const { data: renderData, error: renderError } = await supabase
      .from('video_render_queue')
      .select('*')
      .eq('id', renderId)
      .maybeSingle();

    if (renderError && !renderError.message.includes('does not exist')) {
      console.error('Error fetching render status:', renderError);
    }

    if (renderData) {
      return new Response(
        JSON.stringify({
          render_id: renderId,
          status: renderData.status,
          video_url: renderData.video_url,
          error: renderData.error_message,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check tiktok_video_queue by operation_name
    const { data: queueData, error: queueError } = await supabase
      .from('tiktok_video_queue')
      .select('*')
      .eq('operation_name', renderId)
      .maybeSingle();

    if (queueError) {
      console.error('Error fetching queue status:', queueError);
    }

    if (queueData) {
      return new Response(
        JSON.stringify({
          render_id: renderId,
          status: queueData.status === 'completed' ? 'complete' : queueData.status,
          video_url: queueData.video_url,
          error: queueData.error_message,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        render_id: renderId,
        status: 'not_found',
        error: 'Render job not found',
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in image-to-video-status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
