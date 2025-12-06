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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action } = await req.json();

    // Action: Get queue status
    if (action === 'status') {
      const { data: pending } = await supabaseClient
        .from('tiktok_post_queue')
        .select('id')
        .eq('status', 'pending');

      const { data: posted } = await supabaseClient
        .from('tiktok_post_queue')
        .select('id')
        .eq('status', 'posted');

      const { data: failed } = await supabaseClient
        .from('tiktok_post_queue')
        .select('id')
        .eq('status', 'failed');

      const { data: recentPosts } = await supabaseClient
        .from('tiktok_post_queue')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);

      const { data: recentLogs } = await supabaseClient
        .from('tiktok_post_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return new Response(
        JSON.stringify({
          pending: pending?.length || 0,
          posted: posted?.length || 0,
          failed: failed?.length || 0,
          recent_queue: recentPosts || [],
          recent_logs: recentLogs || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Clear pending posts
    if (action === 'clear_pending') {
      const { error } = await supabaseClient
        .from('tiktok_post_queue')
        .delete()
        .eq('status', 'pending');

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Pending posts cleared' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Retry failed posts
    if (action === 'retry_failed') {
      const { error } = await supabaseClient
        .from('tiktok_post_queue')
        .update({ 
          status: 'pending', 
          attempts: 0,
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('status', 'failed');

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Failed posts reset to pending' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Force schedule posts now
    if (action === 'force_schedule') {
      const { data, error } = await supabaseClient.functions.invoke('schedule-tiktok-posts');
      
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, ...data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Force post next item
    if (action === 'force_post') {
      const { data, error } = await supabaseClient.functions.invoke('post-scheduled-tiktok');
      
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, ...data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in tiktok-queue-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
