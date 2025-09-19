import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body to get question count
    const body = await req.json().catch(() => ({}));
    const questionCount = body.questionCount || 10;

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log(`Generating quiz for user: ${user.id}`);

    // Fetch user's collection from both tables
    const [cdResult, vinylResult] = await Promise.all([
      supabase
        .from('cd_scan')
        .select('artist, title, label, catalog_number, year, genre, style, country')
        .eq('user_id', user.id)
        .not('artist', 'is', null)
        .not('title', 'is', null),
      supabase
        .from('vinyl2_scan')
        .select('artist, title, label, catalog_number, year, genre, style, country')
        .eq('user_id', user.id)
        .not('artist', 'is', null)
        .not('title', 'is', null)
    ]);

    if (cdResult.error || vinylResult.error) {
      console.error('Database error:', cdResult.error || vinylResult.error);
      throw new Error('Failed to fetch collection data');
    }

    const allAlbums = [...(cdResult.data || []), ...(vinylResult.data || [])];
    
    if (allAlbums.length === 0) {
      throw new Error('No collection data found');
    }

    console.log(`Found ${allAlbums.length} albums in collection`);

    // Prepare collection summary for OpenAI
    const collectionSummary = {
      totalAlbums: allAlbums.length,
      artists: [...new Set(allAlbums.map(a => a.artist))].slice(0, 50), // Limit for token efficiency
      genres: [...new Set(allAlbums.map(a => a.genre).filter(Boolean))],
      years: [...new Set(allAlbums.map(a => a.year).filter(Boolean))].sort(),
      sampleAlbums: allAlbums.slice(0, 30) // Sample for detailed questions
    };

    const prompt = `
Je bent een muziekquiz generator. Analyseer deze muziekcollectie en genereer precies ${questionCount} uitdagende maar eerlijke quiz vragen.

COLLECTIE DATA:
- Totaal albums: ${collectionSummary.totalAlbums}
- Artiesten: ${collectionSummary.artists.join(', ')}
- Genres: ${collectionSummary.genres.join(', ')}
- Jaren: ${collectionSummary.years[0]} - ${collectionSummary.years[collectionSummary.years.length - 1]}

SAMPLE ALBUMS:
${collectionSummary.sampleAlbums.map(a => `${a.artist} - ${a.title} (${a.year || 'Unknown'})`).join('\n')}

Genereer ${questionCount} verschillende vraagtypen uit deze categorieën:
1. Album herkenning: "Welke artiest heeft het album [TITLE]?"
2. Jaar vragen: "Uit welk jaar is [ALBUM] van [ARTIST]?"
3. Genre classificatie: "Tot welk genre behoort [ALBUM]?"
4. Artiest tellen: "Hoeveel albums heb je van [ARTIST]?"
5. Chronologie: "Wat is het oudste/nieuwste album van [ARTIST] in je collectie?"
6. Label vragen: "Op welk label verscheen [ALBUM]?"
7. Vergelijkingen: "Welke artiest heeft zowel een album uit de jaren 70 als 90?"
8. Genre mix: "Hoeveel [GENRE] albums heb je?"
9. Decade focus: "Welk album uit de jaren [DECADE] heb je?"
10. Collectie trivia: Unieke vraag over de collectie

BELANGRIJK:
- Alle antwoordopties moeten uit de DAADWERKELIJKE collectie komen
- Mix makkelijke en moeilijke vragen
- Zorg voor variety in vraagtypen
- Alle artiesten/albums in vragen moeten bestaan in de collectie

Retourneer JSON format:
{
  "questions": [
    {
      "id": 1,
      "type": "album_recognition",
      "question": "Welke artiest heeft het album 'Title'?",
      "correctAnswer": "Artist Name",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "explanation": "Korte uitleg waarom dit klopt"
    }
  ]
}`;

    console.log('Calling OpenAI with collection data...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Je bent een expert in het maken van muziekquizzes. Genereer altijd valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: questionCount > 20 ? 6000 : 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    // Function to clean markdown formatting from OpenAI response
    const cleanMarkdown = (content: string): string => {
      return content
        .replace(/```json\s*/g, '') // Remove ```json
        .replace(/```\s*/g, '')     // Remove ```
        .trim();                    // Remove extra whitespace
    };

    let quizData;
    try {
      const rawContent = data.choices[0].message.content;
      console.log('Raw OpenAI response:', rawContent);
      
      const cleanedContent = cleanMarkdown(rawContent);
      console.log('Cleaned content for parsing:', cleanedContent);
      
      quizData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response after cleaning:', data.choices[0].message.content);
      console.error('Parse error details:', parseError);
      throw new Error('Invalid response format from OpenAI');
    }

    console.log(`Generated ${quizData.questions?.length || 0} quiz questions`);

    return new Response(JSON.stringify({
      success: true,
      quiz: quizData,
      collectionStats: {
        totalAlbums: collectionSummary.totalAlbums,
        totalArtists: collectionSummary.artists.length,
        genres: collectionSummary.genres.length,
        yearRange: `${collectionSummary.years[0]} - ${collectionSummary.years[collectionSummary.years.length - 1]}`
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in collection-quiz-generator:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});