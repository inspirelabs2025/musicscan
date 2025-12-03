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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily quiz Facebook post scheduling...');

    // Get today's daily challenge
    const today = new Date().toISOString().split('T')[0];
    
    const { data: challenge, error: challengeError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today)
      .single();

    if (challengeError || !challenge) {
      console.log('No daily challenge found for today:', today);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No daily challenge for today' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clear any existing pending posts for today
    await supabase
      .from('daily_quiz_facebook_queue')
      .delete()
      .eq('challenge_date', today)
      .eq('status', 'pending');

    // Schedule 2 posts per day: 10:00 UTC and 18:00 UTC
    const postTimes = [10, 18]; // Hours in UTC
    const scheduledPosts = [];

    for (const hour of postTimes) {
      const scheduledFor = new Date();
      scheduledFor.setUTCHours(hour, 0, 0, 0);

      // If the time has already passed today, skip it
      if (scheduledFor <= new Date()) {
        console.log(`Skipping ${hour}:00 UTC - time has passed`);
        continue;
      }

      const { data: queueItem, error: insertError } = await supabase
        .from('daily_quiz_facebook_queue')
        .insert({
          challenge_id: challenge.id,
          challenge_date: today,
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error scheduling post:', insertError);
        continue;
      }

      scheduledPosts.push({
        id: queueItem.id,
        scheduled_for: scheduledFor.toISOString()
      });
    }

    console.log(`Scheduled ${scheduledPosts.length} daily quiz posts for Facebook`);

    return new Response(JSON.stringify({
      success: true,
      challenge_date: today,
      scheduled_posts: scheduledPosts
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in schedule-daily-quiz-posts:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
