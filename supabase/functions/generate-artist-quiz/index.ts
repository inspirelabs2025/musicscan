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
    const { difficulty = 'medium', genre, questionCount = 10 } = await req.json();
    
    console.log('Generating artist quiz:', { difficulty, genre, questionCount });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch artists from database
    let query = supabase
      .from('artist_stories')
      .select('artist_name, music_style, notable_albums, biography, artwork_url')
      .eq('is_published', true)
      .not('artist_name', 'is', null);

    if (genre) {
      query = query.contains('music_style', [genre]);
    }

    const { data: artists, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching artists:', error);
      throw error;
    }

    if (!artists || artists.length < 4) {
      return new Response(JSON.stringify({ 
        error: 'Not enough artists in database',
        questions: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${artists.length} artists for quiz generation`);

    // Generate quiz with AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const artistsData = artists.map(a => ({
      name: a.artist_name,
      styles: a.music_style || [],
      albums: a.notable_albums || [],
      bio: a.biography?.substring(0, 200) || '',
      image: a.artwork_url
    }));

    const difficultyInstructions = {
      easy: 'Gebruik bekende artiesten, voor de hand liggende genres, simpele vragen.',
      medium: 'Mix van bekende en minder bekende artiesten, gemiddelde moeilijkheid.',
      hard: 'Obscure feiten, moeilijke vragen over muziekstijl combinaties en biografie details.'
    };

    const prompt = `Je bent een Nederlandse muziekquiz generator. Genereer ${questionCount} quiz vragen over artiesten.

BESCHIKBARE ARTIESTEN:
${JSON.stringify(artistsData, null, 2)}

MOEILIJKHEIDSGRAAD: ${difficulty}
${difficultyInstructions[difficulty as keyof typeof difficultyInstructions]}

VRAAGTYPEN (varieer!):
1. Genre identificatie: "Welke artiest speelt [muziekstijl]?"
2. Album match: "Van welke artiest is het album '[album]'?"
3. Odd one out: "Welke artiest hoort NIET bij [genre]?"
4. Biografie trivia: Vraag over feiten uit de biografie
5. Muziekstijl combinatie: "Welke artiest combineert [stijl1] met [stijl2]?"

REGELS:
- Alle vragen en antwoorden in het Nederlands
- Exacte artiestnamen uit de lijst gebruiken
- 4 antwoordopties per vraag
- Altijd één correct antwoord
- Korte uitleg bij elk antwoord

GEEF ALLEEN VALID JSON TERUG (geen markdown):
{
  "questions": [
    {
      "id": 1,
      "type": "genre_identification",
      "question": "Welke artiest is bekend om symphonic metal?",
      "options": ["Within Temptation", "AC/DC", "The Beatles", "Bob Dylan"],
      "correctAnswer": "Within Temptation",
      "explanation": "Within Temptation is een Nederlandse symphonic metal band.",
      "artistImage": "url_indien_beschikbaar"
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No valid JSON in AI response:', content);
      throw new Error('Invalid AI response format');
    }

    const quizData = JSON.parse(jsonMatch[0]);

    console.log(`Generated ${quizData.questions?.length || 0} questions`);

    return new Response(JSON.stringify({
      success: true,
      quiz: {
        category: 'artiesten',
        difficulty,
        genre: genre || 'all',
        questions: quizData.questions || []
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in generate-artist-quiz:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      questions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
