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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🎙️ Processing scheduled studio posts...');

    // Get pending posts that are due
    const { data: pendingPosts, error: fetchError } = await supabase
      .from('studio_facebook_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(1);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingPosts || pendingPosts.length === 0) {
      console.log('No pending studio posts to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending posts', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const post = pendingPosts[0];
    console.log(`Processing: ${post.studio_name}`);

    // Mark as processing
    await supabase
      .from('studio_facebook_queue')
      .update({ status: 'processing' })
      .eq('id', post.id);

    // Build Facebook post content
    const studioUrl = `https://www.musicscan.app/studio-stories/${post.slug}`;
    
    // Build intro
    const intros = [
      `🎙️ Studio Spotlight: ${post.studio_name}`,
      `🎚️ Legendaire Studio: ${post.studio_name}`,
      `🎛️ Ontdek ${post.studio_name}`,
      `🎵 Studio Verhaal: ${post.studio_name}`,
      `🏛️ Muziekgeschiedenis: ${post.studio_name}`
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];

    // Build details
    let details = '';
    if (post.location) {
      details += `📍 ${post.location}\n`;
    }
    if (post.founded_year) {
      details += `📅 Opgericht: ${post.founded_year}\n`;
    }
    if (post.notable_artists && post.notable_artists.length > 0) {
      const artists = post.notable_artists.slice(0, 5).join(', ');
      details += `🎤 Bekende artiesten: ${artists}\n`;
    }

    // Build hashtags
    const hashtags = ['#MusicScan', '#StudioVerhalen', '#Muziekgeschiedenis'];
    if (post.location) {
      const locationTag = post.location.replace(/[^a-zA-Z]/g, '');
      if (locationTag.length > 2) {
        hashtags.push(`#${locationTag}`);
      }
    }
    hashtags.push('#RecordingStudio');

    // Build full message
    const message = `${intro}\n\n${details}\n🔗 Lees het volledige verhaal:\n${studioUrl}\n\n${hashtags.slice(0, 5).join(' ')}`;

    try {
      // Call post-to-facebook function
      const { data: fbResult, error: fbError } = await supabase.functions.invoke('post-to-facebook', {
        body: {
          content_type: 'studio_story',
          title: post.studio_name,
          content: message,
          url: studioUrl,
          image_url: post.artwork_url
        }
      });

      if (fbError) {
        throw fbError;
      }

      // Update queue item as posted
      await supabase
        .from('studio_facebook_queue')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          facebook_post_id: fbResult?.post_id || null
        })
        .eq('id', post.id);

      // Increment posted count on studio_stories for rotation
      await supabase
        .from('studio_stories')
        .update({ facebook_posted_count: (post.posted_count || 0) + 1 })
        .eq('id', post.studio_story_id);

      console.log(`✅ Posted ${post.studio_name} to Facebook`);

      return new Response(
        JSON.stringify({
          success: true,
          processed: 1,
          posted: {
            studio: post.studio_name,
            post_id: fbResult?.post_id
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (postError) {
      console.error('Facebook posting failed:', postError);
      
      // Mark as failed
      await supabase
        .from('studio_facebook_queue')
        .update({
          status: 'failed',
          error_message: postError.message
        })
        .eq('id', post.id);

      return new Response(
        JSON.stringify({ success: false, error: postError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing studio posts:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
