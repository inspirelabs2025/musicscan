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

    console.log('Scheduling TikTok posts for today...');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if we already scheduled posts for today
    const { data: existingPosts } = await supabaseClient
      .from('tiktok_post_queue')
      .select('id')
      .gte('scheduled_for', `${todayStr}T00:00:00Z`)
      .lte('scheduled_for', `${todayStr}T23:59:59Z`)
      .eq('status', 'pending');

    if (existingPosts && existingPosts.length >= 4) {
      console.log(`Already have ${existingPosts.length} posts scheduled for today`);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Posts already scheduled for today',
          count: existingPosts.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const postsToSchedule: any[] = [];
    const maxPosts = 4;
    const scheduleTimes = [10, 14, 17, 20]; // Hours UTC

    // 1. Get today's music history events (priority: high)
    const { data: historyEvents } = await supabaseClient
      .from('music_history_events')
      .select('id, title, description, image_url, event_date, artist_name, year')
      .eq('event_date', todayStr)
      .limit(2);

    if (historyEvents) {
      for (const event of historyEvents) {
        if (postsToSchedule.length >= maxPosts) break;
        
        // Check if already in queue
        const { data: existing } = await supabaseClient
          .from('tiktok_post_queue')
          .select('id')
          .eq('content_id', event.id)
          .eq('content_type', 'music_history');

        if (!existing || existing.length === 0) {
          postsToSchedule.push({
            content_type: 'music_history',
            content_id: event.id,
            title: event.title,
            caption: `🎵 Vandaag in de muziekgeschiedenis:\n\n${event.description?.substring(0, 500) || event.title}`,
            media_url: event.image_url,
            hashtags: ['MusicHistory', 'OnThisDay', event.artist_name?.replace(/\s/g, '') || 'Music'].filter(Boolean),
            priority: 100,
          });
        }
      }
    }

    // 2. Get recent singles (priority: medium)
    const { data: singles } = await supabaseClient
      .from('music_stories')
      .select('id, artist_name, single_name, artwork_url, story_content, release_year')
      .not('single_name', 'is', null)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (singles) {
      for (const single of singles) {
        if (postsToSchedule.length >= maxPosts) break;

        const { data: existing } = await supabaseClient
          .from('tiktok_post_queue')
          .select('id')
          .eq('content_id', single.id)
          .eq('content_type', 'single');

        if (!existing || existing.length === 0) {
          postsToSchedule.push({
            content_type: 'single',
            content_id: single.id,
            title: `${single.artist_name} - ${single.single_name}`,
            caption: `🎤 ${single.artist_name} - ${single.single_name}\n\n${single.story_content?.substring(0, 400) || ''}`,
            media_url: single.artwork_url,
            hashtags: ['NewMusic', single.artist_name?.replace(/\s/g, '') || 'Music', 'Singles'].filter(Boolean),
            priority: 50,
          });
        }
      }
    }

    // 3. Get recent YouTube discoveries (priority: medium)
    const { data: youtubeVideos } = await supabaseClient
      .from('youtube_discoveries')
      .select('id, title, description, thumbnail_url, artist_name, video_url')
      .order('discovered_at', { ascending: false })
      .limit(3);

    if (youtubeVideos) {
      for (const video of youtubeVideos) {
        if (postsToSchedule.length >= maxPosts) break;

        const { data: existing } = await supabaseClient
          .from('tiktok_post_queue')
          .select('id')
          .eq('content_id', video.id)
          .eq('content_type', 'youtube');

        if (!existing || existing.length === 0) {
          postsToSchedule.push({
            content_type: 'youtube',
            content_id: video.id,
            title: video.title,
            caption: `📺 ${video.title}\n\n${video.description?.substring(0, 300) || ''}`,
            media_url: video.thumbnail_url,
            hashtags: ['MusicVideo', video.artist_name?.replace(/\s/g, '') || 'Music', 'YouTube'].filter(Boolean),
            priority: 30,
          });
        }
      }
    }

    // Schedule the posts at different times
    const insertedPosts: any[] = [];
    for (let i = 0; i < postsToSchedule.length && i < maxPosts; i++) {
      const post = postsToSchedule[i];
      const scheduleHour = scheduleTimes[i % scheduleTimes.length];
      const scheduledFor = new Date(today);
      scheduledFor.setUTCHours(scheduleHour, Math.floor(Math.random() * 30), 0, 0);

      // Only schedule if time is in the future
      if (scheduledFor > new Date()) {
        const { data: inserted, error } = await supabaseClient
          .from('tiktok_post_queue')
          .insert({
            ...post,
            scheduled_for: scheduledFor.toISOString(),
            status: 'pending',
          })
          .select()
          .single();

        if (!error && inserted) {
          insertedPosts.push(inserted);
          console.log(`Scheduled: ${post.title} at ${scheduledFor.toISOString()}`);
        }
      }
    }

    console.log(`Scheduled ${insertedPosts.length} TikTok posts for today`);

    return new Response(
      JSON.stringify({ 
        success: true,
        scheduled: insertedPosts.length,
        posts: insertedPosts.map(p => ({ id: p.id, title: p.title, scheduled_for: p.scheduled_for }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-tiktok-posts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
