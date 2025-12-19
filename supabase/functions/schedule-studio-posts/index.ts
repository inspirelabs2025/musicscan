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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🎙️ Scheduling daily studio post...');

    // Check if there's already a pending post for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: existingPost } = await supabase
      .from('studio_facebook_queue')
      .select('id')
      .gte('scheduled_for', today.toISOString())
      .lt('scheduled_for', tomorrow.toISOString())
      .eq('status', 'pending')
      .single();

    if (existingPost) {
      console.log('✅ Already have a pending studio post for today');
      return new Response(
        JSON.stringify({ success: true, message: 'Already scheduled for today', skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the studio with lowest posted count (rotation logic)
    const { data: nextStudio, error: studioError } = await supabase
      .from('studio_stories')
      .select('id, studio_name, slug, artwork_url, location, founded_year, notable_artists, facebook_posted_count')
      .eq('is_published', true)
      .order('facebook_posted_count', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (studioError || !nextStudio) {
      console.error('No published studios found:', studioError);
      return new Response(
        JSON.stringify({ success: false, error: 'No published studios available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Schedule for 12:00 UTC today
    const scheduledFor = new Date();
    scheduledFor.setUTCHours(12, 0, 0, 0);
    
    // If it's past 12:00 UTC, schedule for tomorrow
    if (new Date() > scheduledFor) {
      scheduledFor.setDate(scheduledFor.getDate() + 1);
    }

    // Insert into queue
    const { data: queueItem, error: insertError } = await supabase
      .from('studio_facebook_queue')
      .insert({
        studio_story_id: nextStudio.id,
        studio_name: nextStudio.studio_name,
        slug: nextStudio.slug,
        artwork_url: nextStudio.artwork_url,
        location: nextStudio.location,
        founded_year: nextStudio.founded_year,
        notable_artists: nextStudio.notable_artists,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
        posted_count: nextStudio.facebook_posted_count || 0
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ Scheduled ${nextStudio.studio_name} for ${scheduledFor.toISOString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        scheduled: {
          studio: nextStudio.studio_name,
          scheduled_for: scheduledFor.toISOString(),
          queue_id: queueItem.id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error scheduling studio post:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
