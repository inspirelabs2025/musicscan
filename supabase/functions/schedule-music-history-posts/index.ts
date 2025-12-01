import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MusicHistoryEvent {
  year: number;
  title: string;
  description: string;
  category: string;
  artist?: string;
  image_url?: string;
  discogs_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📅 Starting music history post scheduling...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const month = today.getMonth() + 1;
    const day = today.getDate();

    console.log(`📆 Fetching music history events for ${day}/${month}...`);

    // Fetch today's music history events
    const { data: events, error: eventsError } = await supabase
      .from('music_history_events')
      .select('*')
      .eq('event_month', month)
      .eq('event_day', day)
      .order('year', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    if (!events || events.length === 0) {
      console.log('⚠️ No music history events found for today');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No events to schedule',
        scheduled: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Found ${events.length} events for today`);

    // Get settings for music_history
    const { data: settings } = await supabase
      .from('facebook_auto_post_settings')
      .select('*')
      .eq('content_type', 'music_history')
      .single();

    const startHour = settings?.schedule_hour || 8;
    const maxPosts = settings?.max_posts_per_day || 8;
    const endHour = 22; // End at 22:00

    // Clear any existing pending posts for today
    const { error: deleteError } = await supabase
      .from('music_history_facebook_queue')
      .delete()
      .eq('event_date', todayStr)
      .eq('status', 'pending');

    if (deleteError) {
      console.warn('Warning clearing old queue:', deleteError);
    }

    // Limit events to max posts per day
    const eventsToSchedule = events.slice(0, maxPosts);
    
    // Calculate time slots
    const totalHours = endHour - startHour;
    const intervalHours = eventsToSchedule.length > 1 
      ? totalHours / (eventsToSchedule.length - 1) 
      : 0;

    console.log(`⏰ Scheduling ${eventsToSchedule.length} posts from ${startHour}:00 to ${endHour}:00`);
    console.log(`📊 Interval between posts: ~${Math.round(intervalHours * 60)} minutes`);

    // Create queue entries
    const queueEntries = eventsToSchedule.map((event, index) => {
      // Calculate scheduled time
      const scheduledHour = Math.round(startHour + (index * intervalHours));
      const scheduledTime = new Date(today);
      scheduledTime.setHours(scheduledHour, 0, 0, 0);

      // If scheduled time is in the past, skip to next available slot
      if (scheduledTime < new Date()) {
        scheduledTime.setHours(new Date().getHours() + 1, 0, 0, 0);
      }

      return {
        event_date: todayStr,
        event_index: index,
        event_data: {
          year: event.year,
          title: event.title,
          description: event.description,
          category: event.category,
          artist: event.artist,
          image_url: event.image_url,
          discogs_url: event.discogs_url,
        },
        scheduled_time: scheduledTime.toISOString(),
        status: 'pending',
      };
    });

    // Insert queue entries
    const { data: inserted, error: insertError } = await supabase
      .from('music_history_facebook_queue')
      .insert(queueEntries)
      .select();

    if (insertError) {
      console.error('Error inserting queue entries:', insertError);
      throw insertError;
    }

    console.log(`✅ Successfully scheduled ${inserted?.length || 0} posts`);

    // Log the schedule
    inserted?.forEach((entry, i) => {
      const time = new Date(entry.scheduled_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      console.log(`  ${i + 1}. ${time} - ${entry.event_data.title?.substring(0, 50)}...`);
    });

    return new Response(JSON.stringify({
      success: true,
      scheduled: inserted?.length || 0,
      events: inserted?.map(e => ({
        time: e.scheduled_time,
        title: e.event_data.title
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error scheduling music history posts:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
