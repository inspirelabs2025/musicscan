import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Random intro variations
const INTRO_VARIATIONS = [
  '🎯 Dagelijkse Muziek Quiz!',
  '🎮 Test je muziekkennis!',
  '🏆 Tijd voor de dagelijkse challenge!',
  '🎵 Ben jij een echte muziekkenner?',
  '⚡ Dagelijkse Quiz Alert!',
  '🎸 Klaar voor een muzikale uitdaging?',
  '🎹 De quiz van vandaag staat klaar!',
  '🎤 Hoeveel weet jij over muziek?',
];

const CTA_VARIATIONS = [
  'Speel nu en test je kennis! 👉',
  'Doe mee en bewijs jezelf! 🏅',
  'Wie haalt de hoogste score? 🎯',
  'Daag jezelf uit! 💪',
  'Speel de quiz en scoor punten! ⭐',
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildQuizMessage(): string {
  const intro = getRandomItem(INTRO_VARIATIONS);
  const cta = getRandomItem(CTA_VARIATIONS);
  
  const message = `${intro}

Elke dag een nieuwe muziekquiz met 10 vragen over artiesten, albums en muziekgeschiedenis.

${cta}
https://www.musicscan.app/quizzen

#MusicScan #MuziekQuiz #DagelijksChallenge #MuziekTrivia`;

  return message;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for scheduled daily quiz posts...');

    // Get the next pending post that's due
    const now = new Date().toISOString();
    
    const { data: pendingPost, error: fetchError } = await supabase
      .from('daily_quiz_facebook_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !pendingPost) {
      console.log('No pending quiz posts to process');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending posts' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing quiz post: ${pendingPost.id}`);

    // Mark as processing
    await supabase
      .from('daily_quiz_facebook_queue')
      .update({ status: 'processing' })
      .eq('id', pendingPost.id);

    // Build the message
    const message = buildQuizMessage();

    // Call post-to-facebook
    const { data: postResult, error: postError } = await supabase.functions.invoke('post-to-facebook', {
      body: {
        content_type: 'daily_quiz',
        title: 'Dagelijkse Muziek Quiz',
        content: message,
        url: 'https://www.musicscan.app/quizzen'
      }
    });

    if (postError) {
      console.error('Error posting to Facebook:', postError);
      
      await supabase
        .from('daily_quiz_facebook_queue')
        .update({ 
          status: 'failed',
          error_message: postError.message
        })
        .eq('id', pendingPost.id);

      return new Response(JSON.stringify({ 
        success: false, 
        error: postError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update queue item as posted
    await supabase
      .from('daily_quiz_facebook_queue')
      .update({ 
        status: 'posted',
        posted_at: new Date().toISOString(),
        facebook_post_id: postResult?.facebook_post_id || null
      })
      .eq('id', pendingPost.id);

    console.log('Successfully posted daily quiz to Facebook');

    return new Response(JSON.stringify({
      success: true,
      posted: true,
      queue_id: pendingPost.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in post-scheduled-daily-quiz:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
