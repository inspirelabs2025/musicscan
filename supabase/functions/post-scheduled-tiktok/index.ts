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

    console.log('Checking for scheduled TikTok posts...');

    const now = new Date();

    // Get pending posts that are scheduled for now or earlier
    const { data: pendingPosts, error: fetchError } = await supabaseClient
      .from('tiktok_post_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching pending posts:', fetchError);
      throw fetchError;
    }

    if (!pendingPosts || pendingPosts.length === 0) {
      console.log('No pending TikTok posts to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending posts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const post = pendingPosts[0];
    console.log(`Processing TikTok post: ${post.title}`);

    // Mark as processing
    await supabaseClient
      .from('tiktok_post_queue')
      .update({ 
        status: 'processing',
        attempts: post.attempts + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', post.id);

    // Check if we have media - TikTok requires video/image
    if (!post.media_url && !post.video_url) {
      console.log('Skipping post - no media content');
      await supabaseClient
        .from('tiktok_post_queue')
        .update({ 
          status: 'skipped',
          error_message: 'No media content available',
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Post skipped - no media' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call post-to-tiktok function
    const { data: postResult, error: postError } = await supabaseClient.functions.invoke('post-to-tiktok', {
      body: {
        content_type: post.content_type,
        title: post.title,
        caption: post.caption,
        media_url: post.media_url,
        video_url: post.video_url,
        url: `https://www.musicscan.app/${post.content_type === 'single' ? 'singles' : post.content_type === 'music_history' ? 'vandaag-in-de-muziekgeschiedenis' : ''}`,
      }
    });

    if (postError) {
      console.error('Error posting to TikTok:', postError);
      
      // Update queue with error
      await supabaseClient
        .from('tiktok_post_queue')
        .update({ 
          status: post.attempts >= 3 ? 'failed' : 'pending',
          error_message: postError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      return new Response(
        JSON.stringify({ success: false, error: postError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success - update queue
    await supabaseClient
      .from('tiktok_post_queue')
      .update({ 
        status: 'posted',
        tiktok_post_id: postResult?.post_id,
        posted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', post.id);

    console.log(`Successfully posted to TikTok: ${post.title}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        post_id: postResult?.post_id,
        title: post.title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in post-scheduled-tiktok:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
