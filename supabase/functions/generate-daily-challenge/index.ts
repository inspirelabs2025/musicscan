import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Check if challenge already exists for today
    const { data: existing } = await supabase
      .from('daily_challenges')
      .select('id')
      .eq('challenge_date', today)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: 'Challenge already exists for today', id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate quiz questions using AI
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Genereer 10 algemene muziek quiz vragen voor een dagelijkse challenge. 
De vragen moeten gaan over:
- Bekende artiesten en bands (internationaal en Nederlands)
- Albumtitels en releasejaren
- Muziekgeschiedenis en mijlpalen
- Muziekgenres en stijlen
- Songtitels en hitlijsten
- Muziekinstrumenten
- Muziekproductie en labels

Mix van makkelijke, gemiddelde en moeilijke vragen.

Geef ALLEEN een JSON array terug in dit exacte formaat, zonder markdown:
[
  {
    "question": "Vraag tekst",
    "options": ["Optie A", "Optie B", "Optie C", "Optie D"],
    "correctAnswer": "De juiste optie exact zoals in options",
    "explanation": "Korte uitleg waarom dit het juiste antwoord is",
    "category": "Artiesten/Albums/Geschiedenis/Genres/Hits"
  }
]`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Je bent een muziekexpert die Nederlandse quiz vragen genereert. Geef alleen valid JSON terug, geen markdown of andere tekst.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    let questionsText = aiData.choices?.[0]?.message?.content || '';

    // Clean up markdown if present
    questionsText = questionsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(questionsText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', questionsText);
      throw new Error('Failed to parse quiz questions from AI');
    }

    // Validate questions
    if (!Array.isArray(questions) || questions.length < 5) {
      throw new Error('Invalid questions format');
    }

    // Ensure exactly 10 questions
    questions = questions.slice(0, 10);

    // Extract categories for tracking
    const categories = [...new Set(questions.map((q: any) => q.category).filter(Boolean))];

    // Insert the daily challenge
    const { data: challenge, error: insertError } = await supabase
      .from('daily_challenges')
      .insert({
        challenge_date: today,
        quiz_data: { questions },
        category_mix: categories,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log(`Generated daily challenge for ${today} with ${questions.length} questions`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily challenge generated', 
        id: challenge.id,
        questionCount: questions.length,
        categories 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating daily challenge:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
