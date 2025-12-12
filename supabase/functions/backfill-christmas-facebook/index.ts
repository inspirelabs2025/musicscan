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

    console.log('📘 Starting Facebook queue backfill for Christmas stories...');

    // Find Christmas stories not in Facebook queue
    const { data: christmasStories, error: queryError } = await supabase
      .from('music_stories')
      .select('id, artist, single_name, slug, artwork_url')
      .eq('is_published', true)
      .not('single_name', 'is', null)
      .filter('yaml_frontmatter->is_christmas', 'eq', true);

    if (queryError) {
      console.error('Query error:', queryError);
      throw new Error(`Query error: ${queryError.message}`);
    }

    console.log(`🎄 Found ${christmasStories?.length || 0} Christmas stories`);

    // Get existing Facebook queue entries
    const storyIds = christmasStories?.map(s => s.id) || [];
    const { data: existingQueue } = await supabase
      .from('singles_facebook_queue')
      .select('music_story_id')
      .in('music_story_id', storyIds);

    const existingIds = new Set(existingQueue?.map(q => q.music_story_id) || []);

    // Filter to only stories not in queue
    const storiesToQueue = christmasStories?.filter(s => !existingIds.has(s.id)) || [];

    console.log(`📝 ${storiesToQueue.length} stories need to be queued for Facebook`);

    let successCount = 0;
    let errorCount = 0;

    for (const story of storiesToQueue) {
      try {
        const { error: insertError } = await supabase
          .from('singles_facebook_queue')
          .insert({
            music_story_id: story.id,
            artist: story.artist,
            single_name: story.single_name,
            slug: story.slug,
            artwork_url: story.artwork_url,
            status: 'pending',
            priority: 100 // High priority for Christmas content
          });

        if (insertError) {
          console.error(`❌ Failed to queue ${story.artist} - ${story.single_name}:`, insertError.message);
          errorCount++;
        } else {
          console.log(`✅ Queued: ${story.artist} - ${story.single_name}`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error queueing ${story.artist} - ${story.single_name}:`, err);
        errorCount++;
      }
    }

    console.log(`📘 Backfill complete: ${successCount} queued, ${errorCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      total_christmas_stories: christmasStories?.length || 0,
      already_queued: existingIds.size,
      newly_queued: successCount,
      failed: errorCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in backfill-christmas-facebook:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
