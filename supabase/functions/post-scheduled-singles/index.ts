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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🎵 Singles Facebook queue processor started');

    // Get next item from queue (highest priority first, then oldest)
    const { data: queueItem, error: fetchError } = await supabase
      .from('singles_facebook_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!queueItem) {
      console.log('✅ No pending singles in Facebook queue');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending singles'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📀 Posting single: ${queueItem.artist} - ${queueItem.single_name} (priority: ${queueItem.priority})`);

    // Mark as processing (to prevent double processing)
    await supabase
      .from('singles_facebook_queue')
      .update({ status: 'processing' })
      .eq('id', queueItem.id);

    // Get the full story content for better summary
    const { data: story } = await supabase
      .from('music_stories')
      .select('story_content, year')
      .eq('id', queueItem.music_story_id)
      .maybeSingle();

    const storyContent = story?.story_content || '';
    const year = story?.year;
    const summary = storyContent.substring(0, 280).replace(/\n/g, ' ').trim() + '...';
    const singleUrl = `https://musicscan.nl/singles/${queueItem.slug}`;

    // Post to Facebook
    try {
      const fbResponse = await fetch(`${supabaseUrl}/functions/v1/post-to-facebook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: 'blog',
          title: `🎵 ${queueItem.artist} - ${queueItem.single_name}`,
          content: summary,
          url: singleUrl,
          image_url: queueItem.artwork_url,
          hashtags: ['Singles', 'MuziekVerhaal', year ? `${year}s` : null].filter(Boolean)
        })
      });

      const fbResult = await fbResponse.json();

      if (fbResponse.ok && fbResult.success) {
        // Mark as posted
        await supabase
          .from('singles_facebook_queue')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            facebook_post_id: fbResult.post_id
          })
          .eq('id', queueItem.id);

        console.log(`✅ Posted to Facebook: ${fbResult.post_id}`);

        return new Response(JSON.stringify({
          success: true,
          posted: queueItem.id,
          facebook_post_id: fbResult.post_id,
          artist: queueItem.artist,
          single: queueItem.single_name
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error(fbResult.error || 'Facebook post failed');
      }

    } catch (postError) {
      console.error(`❌ Facebook post error:`, postError);

      // Mark as failed
      await supabase
        .from('singles_facebook_queue')
        .update({
          status: 'failed',
          error_message: postError.message
        })
        .eq('id', queueItem.id);

      throw postError;
    }

  } catch (error) {
    console.error('❌ Singles queue processor error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
