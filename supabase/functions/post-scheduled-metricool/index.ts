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
    console.log('Processing scheduled Metricool posts...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();

    // Get next pending post that's due
    const { data: pendingPost, error: fetchError } = await supabase
      .from('metricool_post_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching pending post:', fetchError);
      throw fetchError;
    }

    if (!pendingPost) {
      console.log('No pending posts to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending posts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing post:', pendingPost.title);

    // Update status to processing
    await supabase
      .from('metricool_post_queue')
      .update({ 
        status: 'processing', 
        attempts: pendingPost.attempts + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingPost.id);

    // Check if we have media for TikTok/Instagram (required)
    const requiresMedia = pendingPost.target_platforms.some(
      (p: string) => ['tiktok', 'instagram'].includes(p)
    );
    
    if (requiresMedia && !pendingPost.media_url) {
      console.log('Skipping post without media for visual platforms');
      await supabase
        .from('metricool_post_queue')
        .update({ 
          status: 'skipped', 
          error_message: 'No media URL for visual platforms',
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingPost.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Post skipped - no media' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call post-to-metricool function
    const postResponse = await supabase.functions.invoke('post-to-metricool', {
      body: {
        content_type: pendingPost.content_type,
        title: pendingPost.title,
        content: pendingPost.content,
        media_url: pendingPost.media_url,
        target_platforms: pendingPost.target_platforms
      }
    });

    if (postResponse.error) {
      console.error('Error calling post-to-metricool:', postResponse.error);
      
      // Check retry attempts
      if (pendingPost.attempts >= 3) {
        await supabase
          .from('metricool_post_queue')
          .update({ 
            status: 'failed', 
            error_message: postResponse.error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', pendingPost.id);
      } else {
        // Reset to pending for retry
        await supabase
          .from('metricool_post_queue')
          .update({ 
            status: 'pending',
            error_message: postResponse.error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', pendingPost.id);
      }

      return new Response(
        JSON.stringify({ success: false, error: postResponse.error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = postResponse.data;
    
    if (result?.success) {
      // Update queue with success
      await supabase
        .from('metricool_post_queue')
        .update({ 
          status: 'posted',
          metricool_response: result.results,
          posted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingPost.id);

      console.log('Successfully posted:', pendingPost.title);
    } else {
      // Handle partial failure
      if (pendingPost.attempts >= 3) {
        await supabase
          .from('metricool_post_queue')
          .update({ 
            status: 'failed', 
            error_message: result?.message || 'Unknown error',
            metricool_response: result?.results,
            updated_at: new Date().toISOString()
          })
          .eq('id', pendingPost.id);
      } else {
        await supabase
          .from('metricool_post_queue')
          .update({ 
            status: 'pending',
            error_message: result?.message || 'Retrying',
            updated_at: new Date().toISOString()
          })
          .eq('id', pendingPost.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: result?.success || false, 
        post_id: pendingPost.id,
        title: pendingPost.title,
        result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in post-scheduled-metricool:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
