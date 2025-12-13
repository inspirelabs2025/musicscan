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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Scheduling weekly podcast posts (2x per week rotation)...');

    // Get all published episodes
    const { data: episodes, error: episodesError } = await supabase
      .from('own_podcast_episodes')
      .select('id, podcast_id, title')
      .eq('is_published', true);

    if (episodesError) {
      throw new Error(`Error fetching episodes: ${episodesError.message}`);
    }

    if (!episodes || episodes.length === 0) {
      console.log('No published episodes found');
      return new Response(
        JSON.stringify({ success: true, message: 'No episodes to schedule' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get rotation tracker to find least-posted episodes
    const { data: rotationData, error: rotationError } = await supabase
      .from('podcast_rotation_tracker')
      .select('episode_id, times_posted')
      .order('times_posted', { ascending: true })
      .order('last_posted_at', { ascending: true, nullsFirst: true });

    // Create map of episode post counts
    const postCountMap = new Map<string, number>();
    rotationData?.forEach(r => postCountMap.set(r.episode_id, r.times_posted));

    // Add episodes not in tracker with count 0
    episodes.forEach(ep => {
      if (!postCountMap.has(ep.id)) {
        postCountMap.set(ep.id, 0);
      }
    });

    // Sort episodes by times_posted (ascending) for fair rotation
    const sortedEpisodes = [...episodes].sort((a, b) => {
      const countA = postCountMap.get(a.id) || 0;
      const countB = postCountMap.get(b.id) || 0;
      return countA - countB;
    });

    // Check if we already have scheduled posts for this week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const { data: existingScheduled } = await supabase
      .from('podcast_facebook_queue')
      .select('id')
      .eq('post_type', 'scheduled_rotation')
      .eq('status', 'pending')
      .gte('scheduled_for', startOfWeek.toISOString())
      .lte('scheduled_for', endOfWeek.toISOString());

    const alreadyScheduledCount = existingScheduled?.length || 0;
    const postsNeeded = Math.max(0, 2 - alreadyScheduledCount);

    if (postsNeeded === 0) {
      console.log('Already have 2 scheduled posts for this week');
      return new Response(
        JSON.stringify({ success: true, message: 'Week already scheduled', scheduled: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select episodes with least posts for fair distribution
    const episodesToSchedule = sortedEpisodes.slice(0, postsNeeded);

    // Schedule posts - Tuesday 10:00 and Friday 14:00
    const scheduleTimes = [
      { day: 2, hour: 10 }, // Tuesday 10:00
      { day: 5, hour: 14 }, // Friday 14:00
    ];

    const scheduledPosts = [];

    for (let i = 0; i < postsNeeded && i < episodesToSchedule.length; i++) {
      const episode = episodesToSchedule[i];
      const scheduleConfig = scheduleTimes[alreadyScheduledCount + i];
      
      if (!scheduleConfig) continue;

      const scheduleDate = new Date(startOfWeek);
      scheduleDate.setDate(scheduleDate.getDate() + scheduleConfig.day - 1);
      scheduleDate.setHours(scheduleConfig.hour, 0, 0, 0);

      // Only schedule if in the future
      if (scheduleDate <= new Date()) {
        scheduleDate.setDate(scheduleDate.getDate() + 7); // Next week
      }

      const { error: insertError } = await supabase
        .from('podcast_facebook_queue')
        .insert({
          episode_id: episode.id,
          podcast_id: episode.podcast_id,
          post_type: 'scheduled_rotation',
          status: 'pending',
          scheduled_for: scheduleDate.toISOString(),
        });

      if (!insertError) {
        scheduledPosts.push({
          episode: episode.title,
          scheduled_for: scheduleDate.toISOString(),
        });
        console.log(`Scheduled: ${episode.title} for ${scheduleDate.toISOString()}`);
      }
    }

    // Ensure all episodes are in rotation tracker
    for (const episode of episodes) {
      await supabase
        .from('podcast_rotation_tracker')
        .upsert({
          episode_id: episode.id,
          times_posted: postCountMap.get(episode.id) || 0,
        }, {
          onConflict: 'episode_id',
          ignoreDuplicates: true,
        });
    }

    console.log(`Scheduled ${scheduledPosts.length} podcast posts for the week`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduled: scheduledPosts.length,
        posts: scheduledPosts 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error scheduling weekly podcast posts:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
