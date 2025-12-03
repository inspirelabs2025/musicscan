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
    const { difficulty = 'medium', genre, decade, questionCount = 10 } = await req.json();
    
    console.log('Generating album quiz:', { difficulty, genre, decade, questionCount });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch albums from music_stories
    let query = supabase
      .from('music_stories')
      .select('artist_name, album_title, release_year, genre, label, artwork_url, story_content')
      .eq('is_published', true)
      .not('album_title', 'is', null);

    if (genre) {
      query = query.ilike('genre', `%${genre}%`);
    }

    if (decade) {
      const startYear = parseInt(decade);
      const endYear = startYear + 9;
      query = query.gte('release_year', startYear).lte('release_year', endYear);
    }

    const { data: albums, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching albums:', error);
      throw error;
    }

    if (!albums || albums.length < 4) {
      return new Response(JSON.stringify({ 
        error: 'Not enough albums in database',
        questions: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${albums.length} albums for quiz generation`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const albumsData = albums.map(a => ({
      artist: a.artist_name,
      title: a.album_title,
      year: a.release_year,
      genre: a.genre,
      label: a.label,
      image: a.artwork_url,
      story: a.story_content?.substring(0, 150) || ''
    }));

    const difficultyInstructions = {
      easy: 'Gebruik bekende albums en artiesten, simpele vragen over jaar en genre.',
      medium: 'Mix van bekende en obscure albums, vragen over labels en jaartallen.',
      hard: 'Obscure albums, specifieke vragen over producenten, labels, en album feiten.'
    };

    const prompt = `Je bent een Nederlandse muziekquiz generator. Genereer ${questionCount} quiz vragen over albums.

BESCHIKBARE ALBUMS:
${JSON.stringify(albumsData, null, 2)}

MOEILIJKHEIDSGRAAD: ${difficulty}
${difficultyInstructions[difficulty as keyof typeof difficultyInstructions]}

VRAAGTYPEN (varieer!):
1. Artiest match: "Van welke artiest is het album '[album]'?"
2. Jaar raden: "In welk jaar kwam '[album]' van [artiest] uit?"
3. Genre classificatie: "Onder welk genre valt '[album]'?"
4. Album bij artiest: "Welk album is van [artiest]?"
5. Decade match: "Welk album kwam uit in de jaren [decade]?"
6. Label vraag: "Op welk label verscheen '[album]'?"

REGELS:
- Alle vragen en antwoorden in het Nederlands
- Exacte album- en artiestnamen uit de lijst gebruiken
- 4 antwoordopties per vraag
- Altijd één correct antwoord
- Korte uitleg bij elk antwoord

GEEF ALLEEN VALID JSON TERUG (geen markdown):
{
  "questions": [
    {
      "id": 1,
      "type": "artist_match",
      "question": "Van welke artiest is het album 'Thriller'?",
      "options": ["Michael Jackson", "Prince", "Madonna", "Whitney Houston"],
      "correctAnswer": "Michael Jackson",
      "explanation": "Thriller van Michael Jackson uit 1982 is het bestverkochte album aller tijden.",
      "albumImage": "url_indien_beschikbaar"
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
        category: 'albums',
        difficulty,
        genre: genre || 'all',
        decade: decade || 'all',
        questions: quizData.questions || []
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in generate-album-quiz:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      questions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
