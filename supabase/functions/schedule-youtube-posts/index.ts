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
    console.log('🎥 Starting YouTube video post scheduling...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Clear any existing pending posts for today
    const { error: deleteError } = await supabase
      .from('youtube_facebook_queue')
      .delete()
      .gte('created_at', todayStr)
      .eq('status', 'pending');

    if (deleteError) {
      console.warn('Warning clearing old queue:', deleteError);
    }

    // Fetch newest YouTube discoveries that haven't been posted today
    // Get videos discovered in the last 7 days, sorted by newest first
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: videos, error: videosError } = await supabase
      .from('youtube_discoveries')
      .select('*')
      .gte('discovered_at', sevenDaysAgo.toISOString())
      .order('discovered_at', { ascending: false })
      .limit(50);

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      throw videosError;
    }

    if (!videos || videos.length === 0) {
      console.log('⚠️ No recent YouTube discoveries found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No videos to schedule',
        scheduled: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Found ${videos.length} recent videos`);

    // Check which videos have already been posted to Facebook
    const { data: postedLogs } = await supabase
      .from('facebook_post_log')
      .select('title')
      .eq('content_type', 'youtube_video')
      .eq('status', 'posted')
      .gte('created_at', sevenDaysAgo.toISOString());

    const postedTitles = new Set(postedLogs?.map(p => p.title) || []);

    // Filter out already posted videos
    const unpostedVideos = videos.filter(v => !postedTitles.has(v.title));

    if (unpostedVideos.length === 0) {
      console.log('⚠️ All recent videos have been posted');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'All videos already posted',
        scheduled: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Schedule settings
    const startHour = 9;  // Start posting at 9:00
    const endHour = 21;   // End at 21:00
    const maxPosts = 4;   // Post up to 4 videos per day

    const videosToSchedule = unpostedVideos.slice(0, maxPosts);
    
    // Calculate time slots
    const totalHours = endHour - startHour;
    const intervalHours = videosToSchedule.length > 1 
      ? totalHours / (videosToSchedule.length - 1) 
      : 0;

    console.log(`⏰ Scheduling ${videosToSchedule.length} videos from ${startHour}:00 to ${endHour}:00`);
    console.log(`📊 Interval between posts: ~${Math.round(intervalHours * 60)} minutes`);

    // Create queue entries
    const queueEntries = videosToSchedule.map((video, index) => {
      const scheduledHour = Math.round(startHour + (index * intervalHours));
      const scheduledTime = new Date(today);
      scheduledTime.setHours(scheduledHour, 0, 0, 0);

      // If scheduled time is in the past, push to next hour
      if (scheduledTime < new Date()) {
        scheduledTime.setHours(new Date().getHours() + 1, 0, 0, 0);
      }

      return {
        video_id: video.video_id,
        video_data: {
          title: video.title,
          description: video.description,
          channel_name: video.channel_name,
          thumbnail_url: video.thumbnail_url,
          artist_name: video.artist_name,
          content_type: video.content_type,
          quality_score: video.quality_score,
          view_count: video.view_count,
          tags: video.tags,
        },
        scheduled_time: scheduledTime.toISOString(),
        status: 'pending',
      };
    });

    // Insert queue entries
    const { data: inserted, error: insertError } = await supabase
      .from('youtube_facebook_queue')
      .insert(queueEntries)
      .select();

    if (insertError) {
      console.error('Error inserting queue entries:', insertError);
      throw insertError;
    }

    console.log(`✅ Successfully scheduled ${inserted?.length || 0} video posts`);

    // Log the schedule
    inserted?.forEach((entry, i) => {
      const time = new Date(entry.scheduled_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      console.log(`  ${i + 1}. ${time} - ${entry.video_data.title?.substring(0, 50)}...`);
    });

    return new Response(JSON.stringify({
      success: true,
      scheduled: inserted?.length || 0,
      videos: inserted?.map(e => ({
        time: e.scheduled_time,
        title: e.video_data.title
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error scheduling YouTube posts:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
