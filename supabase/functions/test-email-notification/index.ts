import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Starting test email notification...');
    
    // Get the latest auto-generated forum topic
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: latestTopic, error: topicError } = await supabase
      .from('forum_topics')
      .select('id, title, description, artist_name, album_title')
      .eq('topic_type', 'auto_generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (topicError || !latestTopic) {
      console.error('❌ Error fetching topic:', topicError);
      throw new Error('No forum topic found for test');
    }

    console.log('📧 Using topic for test:', latestTopic.title);

    // Call the email notification function
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-weekly-discussion-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        topicId: latestTopic.id,
        topicTitle: latestTopic.title,
        topicDescription: latestTopic.description,
        artistName: latestTopic.artist_name,
        albumTitle: latestTopic.album_title,
        testEmail: 'rogiervisser76@gmail.com'  // Test mode with specific email
      })
    });

    const emailResult = await emailResponse.json();
    
    console.log('📧 Email notification result:', emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test email sent successfully',
        topic: latestTopic,
        emailResult: emailResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Test email error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});