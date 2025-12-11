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

    console.log('🎄 Christmas batch processor starting...');

    // Fetch next pending item from queue
    const { data: queueItem, error: fetchError } = await supabase
      .from('christmas_import_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Queue fetch error: ${fetchError.message}`);
    }

    if (!queueItem) {
      console.log('🎄 No pending items in Christmas queue');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending items' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎄 Processing: ${queueItem.artist} - ${queueItem.song_title}`);

    // Mark as processing
    await supabase
      .from('christmas_import_queue')
      .update({ 
        status: 'processing',
        attempts: queueItem.attempts + 1
      })
      .eq('id', queueItem.id);

    // Generate story
    const { data: storyResult, error: storyError } = await supabase.functions.invoke('generate-christmas-story', {
      body: {
        artist: queueItem.artist,
        song_title: queueItem.song_title,
        album: queueItem.album,
        year: queueItem.year,
        country_origin: queueItem.country_origin,
        decade: queueItem.decade,
        youtube_video_id: queueItem.youtube_video_id,
        is_classic: queueItem.is_classic,
        tags: queueItem.tags,
      }
    });

    if (storyError || !storyResult?.success) {
      const errorMsg = storyError?.message || storyResult?.error || 'Unknown error';
      console.error(`❌ Story generation failed: ${errorMsg}`);

      // Check if we should retry
      if (queueItem.attempts < 3) {
        await supabase
          .from('christmas_import_queue')
          .update({ 
            status: 'pending',
            error_message: errorMsg
          })
          .eq('id', queueItem.id);
      } else {
        await supabase
          .from('christmas_import_queue')
          .update({ 
            status: 'failed',
            error_message: `Max attempts reached: ${errorMsg}`
          })
          .eq('id', queueItem.id);
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: errorMsg 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mark as completed
    await supabase
      .from('christmas_import_queue')
      .update({ 
        status: 'completed',
        music_story_id: storyResult.story_id,
        processed_at: new Date().toISOString(),
        error_message: null
      })
      .eq('id', queueItem.id);

    console.log(`✅ Completed: ${queueItem.artist} - ${queueItem.song_title} (Story ID: ${storyResult.story_id})`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: {
        artist: queueItem.artist,
        song_title: queueItem.song_title,
        story_id: storyResult.story_id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Christmas batch processor error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
