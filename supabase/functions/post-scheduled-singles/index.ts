import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { postToThreads } from '../_shared/threads-poster.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CRITICAL: Log at the very start to confirm function is being invoked
  console.log('🚀 post-scheduled-singles function INVOKED at:', new Date().toISOString());
  console.log('📋 Request method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('🔧 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🎵 Singles Facebook queue processor started');

    // Get next item from queue (highest priority first, then oldest)
    console.log('📊 Fetching next pending item from singles_facebook_queue...');
    const { data: queueItem, error: fetchError } = await supabase
      .from('singles_facebook_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error fetching queue item:', fetchError);
      throw fetchError;
    }

    console.log('📊 Queue query result:', queueItem ? `Found: ${queueItem.artist} - ${queueItem.single_name}` : 'No pending items');

    if (!queueItem) {
      console.log('✅ No pending singles in Facebook queue');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending singles',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📀 Posting single: ${queueItem.artist} - ${queueItem.single_name} (priority: ${queueItem.priority}, id: ${queueItem.id})`);

    // Mark as processing (to prevent double processing)
    const { error: updateError } = await supabase
      .from('singles_facebook_queue')
      .update({ status: 'processing' })
      .eq('id', queueItem.id);
    
    if (updateError) {
      console.error('❌ Error marking as processing:', updateError);
    } else {
      console.log('✅ Marked as processing');
    }

    // Get the full story content AND artwork for better summary
    console.log('📖 Fetching music story content...');
    const { data: story } = await supabase
      .from('music_stories')
      .select('story_content, year, artwork_url')
      .eq('id', queueItem.music_story_id)
      .maybeSingle();

    const storyContent = story?.story_content || '';
    const year = story?.year;
    // Use artwork from music_stories (primary) or queue (fallback)
    const artworkUrl = story?.artwork_url || queueItem.artwork_url;
    const summary = storyContent.substring(0, 280).replace(/\n/g, ' ').trim() + '...';
    const singleUrl = `https://www.musicscan.app/singles/${queueItem.slug}`;

    console.log(`🖼️ Artwork URL: ${artworkUrl ? 'found' : 'missing'}`);
    console.log(`📝 Summary length: ${summary.length} chars`);

    // Post to Facebook
    try {
      console.log('📤 Posting to Facebook...');
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
          image_url: artworkUrl,
          artist: queueItem.artist,
          year: year
        })
      });

      console.log('📥 Facebook response status:', fbResponse.status);
      const fbResult = await fbResponse.json();
      console.log('📥 Facebook response:', JSON.stringify(fbResult));

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

        // Also post to Threads (non-blocking)
        try {
          const threadsResult = await postToThreads({
            title: `🎵 ${queueItem.artist} - ${queueItem.single_name}`,
            content: summary,
            url: singleUrl,
            image_url: artworkUrl,
            artist: queueItem.artist,
            content_type: 'blog'
          });
          
          if (threadsResult.success) {
            console.log(`✅ Posted to Threads: ${threadsResult.post_id}`);
          }
        } catch (threadsError) {
          console.log('🧵 Threads posting skipped or failed:', threadsError.message);
        }

        return new Response(JSON.stringify({
          success: true,
          posted: queueItem.id,
          facebook_post_id: fbResult.post_id,
          artist: queueItem.artist,
          single: queueItem.single_name,
          timestamp: new Date().toISOString()
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
      success: false,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
