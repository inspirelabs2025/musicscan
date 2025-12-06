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
    console.log('Starting Metricool post scheduling...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check if we already scheduled posts for today
    const { data: existingPosts } = await supabase
      .from('metricool_post_queue')
      .select('id')
      .gte('scheduled_for', `${todayStr}T00:00:00Z`)
      .lt('scheduled_for', `${todayStr}T23:59:59Z`)
      .limit(1);

    if (existingPosts && existingPosts.length > 0) {
      console.log('Posts already scheduled for today');
      return new Response(
        JSON.stringify({ success: true, message: 'Posts already scheduled for today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const postsToSchedule: any[] = [];
    const scheduledContentIds = new Set<string>();

    // Define posting schedule (UTC hours)
    const scheduleHours = [10, 13, 16, 19]; // 4 posts per day

    // 1. Fetch music history events for today
    const dayMonth = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const { data: historyEvents } = await supabase
      .from('music_history_events')
      .select('id, title, description, image_url, artist, event_year')
      .ilike('event_date', `%-${dayMonth}`)
      .order('event_year', { ascending: false })
      .limit(2);

    if (historyEvents) {
      for (const event of historyEvents) {
        const contentId = `history_${event.id}`;
        if (!scheduledContentIds.has(contentId)) {
          postsToSchedule.push({
            content_type: 'music_history',
            content_id: contentId,
            title: event.title,
            content: event.description || '',
            media_url: event.image_url,
            target_platforms: ['tiktok', 'instagram'],
            artist: event.artist,
            year: event.event_year,
            priority: 100
          });
          scheduledContentIds.add(contentId);
        }
      }
    }

    // 2. Fetch recent singles
    const { data: singles } = await supabase
      .from('music_stories')
      .select('id, single_name, artist_name, story_content, artwork_url')
      .not('single_name', 'is', null)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(2);

    if (singles) {
      for (const single of singles) {
        const contentId = `single_${single.id}`;
        if (!scheduledContentIds.has(contentId)) {
          // Extract first 300 chars for social
          const shortContent = single.story_content?.substring(0, 300) || '';
          postsToSchedule.push({
            content_type: 'single',
            content_id: contentId,
            title: `${single.artist_name} - ${single.single_name}`,
            content: shortContent,
            media_url: single.artwork_url,
            target_platforms: ['tiktok', 'instagram'],
            artist: single.artist_name,
            priority: 80
          });
          scheduledContentIds.add(contentId);
        }
      }
    }

    // 3. Fetch recent YouTube discoveries
    const { data: youtubeItems } = await supabase
      .from('youtube_discoveries')
      .select('id, title, description, thumbnail_url, channel_title')
      .order('discovered_at', { ascending: false })
      .limit(2);

    if (youtubeItems) {
      for (const video of youtubeItems) {
        const contentId = `youtube_${video.id}`;
        if (!scheduledContentIds.has(contentId)) {
          postsToSchedule.push({
            content_type: 'youtube',
            content_id: contentId,
            title: video.title,
            content: video.description?.substring(0, 300) || '',
            media_url: video.thumbnail_url,
            target_platforms: ['tiktok', 'instagram'],
            artist: video.channel_title,
            priority: 60
          });
          scheduledContentIds.add(contentId);
        }
      }
    }

    // 4. Fetch recent anecdotes
    const { data: anecdotes } = await supabase
      .from('music_anecdotes')
      .select('id, title, anecdote_content, subject_name')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(2);

    if (anecdotes) {
      for (const anecdote of anecdotes) {
        const contentId = `anecdote_${anecdote.id}`;
        if (!scheduledContentIds.has(contentId)) {
          postsToSchedule.push({
            content_type: 'anecdote',
            content_id: contentId,
            title: anecdote.title,
            content: anecdote.anecdote_content?.substring(0, 300) || '',
            media_url: null,
            target_platforms: ['tiktok', 'instagram'],
            artist: anecdote.subject_name,
            priority: 40
          });
          scheduledContentIds.add(contentId);
        }
      }
    }

    // Sort by priority (highest first) and limit to schedule slots
    postsToSchedule.sort((a, b) => b.priority - a.priority);
    const postsToInsert = postsToSchedule.slice(0, scheduleHours.length);

    // Assign schedule times
    const insertData = postsToInsert.map((post, index) => {
      const scheduleTime = new Date(today);
      scheduleTime.setUTCHours(scheduleHours[index], 0, 0, 0);
      
      // If time has passed, skip to next available slot or tomorrow
      if (scheduleTime <= new Date()) {
        const futureHours = scheduleHours.filter(h => h > new Date().getUTCHours());
        if (futureHours.length > index) {
          scheduleTime.setUTCHours(futureHours[index], 0, 0, 0);
        } else {
          return null; // Skip this post
        }
      }

      return {
        content_type: post.content_type,
        content_id: post.content_id,
        title: post.title,
        content: post.content,
        media_url: post.media_url,
        target_platforms: post.target_platforms,
        scheduled_for: scheduleTime.toISOString(),
        status: 'pending',
        priority: post.priority
      };
    }).filter(Boolean);

    if (insertData.length > 0) {
      const { error: insertError } = await supabase
        .from('metricool_post_queue')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting scheduled posts:', insertError);
        throw insertError;
      }
    }

    console.log(`Scheduled ${insertData.length} posts for Metricool`);

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_count: insertData.length,
        posts: insertData.map(p => ({ title: p?.title, scheduled_for: p?.scheduled_for }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-metricool-posts:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
