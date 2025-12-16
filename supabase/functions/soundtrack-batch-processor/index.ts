import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// All soundtracks from FILMMUZIEK_FEITEN data
const SOUNDTRACK_DATA = [
  { filmTitle: "Top Gun: Maverick", composer: "Hans Zimmer", year: 2022 },
  { filmTitle: "Star Wars: A New Hope", composer: "John Williams", year: 1977 },
  { filmTitle: "The Dark Knight", composer: "Hans Zimmer", year: 2008 },
  { filmTitle: "Inception", composer: "Hans Zimmer", year: 2010 },
  { filmTitle: "Interstellar", composer: "Hans Zimmer", year: 2014 },
  { filmTitle: "Jurassic Park", composer: "John Williams", year: 1993 },
  { filmTitle: "E.T. the Extra-Terrestrial", composer: "John Williams", year: 1982 },
  { filmTitle: "Schindler's List", composer: "John Williams", year: 1993 },
  { filmTitle: "Jaws", composer: "John Williams", year: 1975 },
  { filmTitle: "Indiana Jones", composer: "John Williams", year: 1981 },
  { filmTitle: "The Lord of the Rings", composer: "Howard Shore", year: 2001 },
  { filmTitle: "Gladiator", composer: "Hans Zimmer", year: 2000 },
  { filmTitle: "The Lion King", composer: "Hans Zimmer", year: 1994 },
  { filmTitle: "Pirates of the Caribbean", composer: "Hans Zimmer", year: 2003 },
  { filmTitle: "Back to the Future", composer: "Alan Silvestri", year: 1985 },
  { filmTitle: "Forrest Gump", composer: "Alan Silvestri", year: 1994 },
  { filmTitle: "The Avengers", composer: "Alan Silvestri", year: 2012 },
  { filmTitle: "Psycho", composer: "Bernard Herrmann", year: 1960 },
  { filmTitle: "Vertigo", composer: "Bernard Herrmann", year: 1958 },
  { filmTitle: "Taxi Driver", composer: "Bernard Herrmann", year: 1976 },
  { filmTitle: "The Godfather", composer: "Nino Rota", year: 1972 },
  { filmTitle: "Amélie", composer: "Yann Tiersen", year: 2001 },
  { filmTitle: "Cinema Paradiso", composer: "Ennio Morricone", year: 1988 },
  { filmTitle: "The Good, the Bad and the Ugly", composer: "Ennio Morricone", year: 1966 },
  { filmTitle: "Once Upon a Time in America", composer: "Ennio Morricone", year: 1984 },
  { filmTitle: "The Mission", composer: "Ennio Morricone", year: 1986 },
  { filmTitle: "Blade Runner", composer: "Vangelis", year: 1982 },
  { filmTitle: "Chariots of Fire", composer: "Vangelis", year: 1981 },
  { filmTitle: "1492: Conquest of Paradise", composer: "Vangelis", year: 1992 },
  { filmTitle: "Superman", composer: "John Williams", year: 1978 },
  { filmTitle: "Harry Potter", composer: "John Williams", year: 2001 },
  { filmTitle: "Home Alone", composer: "John Williams", year: 1990 },
  { filmTitle: "2001: A Space Odyssey", composer: "Various", year: 1968 },
  { filmTitle: "Rocky", composer: "Bill Conti", year: 1976 },
  { filmTitle: "Top Gun", composer: "Harold Faltermeyer", year: 1986 },
  { filmTitle: "Beverly Hills Cop", composer: "Harold Faltermeyer", year: 1984 },
  { filmTitle: "Titanic", composer: "James Horner", year: 1997 },
  { filmTitle: "Braveheart", composer: "James Horner", year: 1995 },
  { filmTitle: "Avatar", composer: "James Horner", year: 2009 },
  { filmTitle: "The Terminator", composer: "Brad Fiedel", year: 1984 },
  { filmTitle: "Edward Scissorhands", composer: "Danny Elfman", year: 1990 },
  { filmTitle: "Batman", composer: "Danny Elfman", year: 1989 },
  { filmTitle: "Spider-Man", composer: "Danny Elfman", year: 2002 },
  { filmTitle: "The Nightmare Before Christmas", composer: "Danny Elfman", year: 1993 },
  { filmTitle: "Dune", composer: "Hans Zimmer", year: 2021 },
  { filmTitle: "No Time to Die", composer: "Hans Zimmer", year: 2021 },
  { filmTitle: "Dunkirk", composer: "Hans Zimmer", year: 2017 },
  { filmTitle: "Man of Steel", composer: "Hans Zimmer", year: 2013 },
  { filmTitle: "The Last Samurai", composer: "Hans Zimmer", year: 2003 },
  { filmTitle: "Rain Man", composer: "Hans Zimmer", year: 1988 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log(`Processing soundtrack batch - ${SOUNDTRACK_DATA.length} total soundtracks`);

    // Find next unprocessed soundtrack
    let nextSoundtrack = null;
    
    for (const soundtrack of SOUNDTRACK_DATA) {
      const slug = `${soundtrack.filmTitle}-soundtrack`
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Check if story already exists
      const { data: existing } = await supabase
        .from('music_stories')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existing) {
        nextSoundtrack = soundtrack;
        break;
      }
    }

    if (!nextSoundtrack) {
      console.log('All soundtracks have been processed!');
      return new Response(
        JSON.stringify({ success: true, message: 'All soundtracks processed', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing: ${nextSoundtrack.filmTitle} by ${nextSoundtrack.composer} (${nextSoundtrack.year})`);

    // Call generate-soundtrack-story
    const generateResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-soundtrack-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        filmTitle: nextSoundtrack.filmTitle,
        composer: nextSoundtrack.composer,
        year: nextSoundtrack.year,
        saveToDatabase: true,
      }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Failed to generate soundtrack story:', errorText);
      throw new Error(`Failed to generate story: ${generateResponse.status}`);
    }

    const result = await generateResponse.json();
    console.log(`Successfully generated story for ${nextSoundtrack.filmTitle}`);

    // Try to fetch artwork
    try {
      const artworkResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-album-artwork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          artist: nextSoundtrack.composer,
          album: `${nextSoundtrack.filmTitle} Soundtrack`,
        }),
      });

      if (artworkResponse.ok) {
        const artworkData = await artworkResponse.json();
        if (artworkData.artworkUrl) {
          const slug = `${nextSoundtrack.filmTitle}-soundtrack`
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

          await supabase
            .from('music_stories')
            .update({ artwork_url: artworkData.artworkUrl })
            .eq('slug', slug);

          console.log(`Artwork updated for ${nextSoundtrack.filmTitle}`);
        }
      }
    } catch (artworkError) {
      console.log('Artwork fetch failed, continuing without artwork:', artworkError);
    }

    // Count remaining
    let remainingCount = 0;
    for (const soundtrack of SOUNDTRACK_DATA) {
      const slug = `${soundtrack.filmTitle}-soundtrack`
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const { data: existing } = await supabase
        .from('music_stories')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existing) remainingCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: nextSoundtrack.filmTitle,
        composer: nextSoundtrack.composer,
        year: nextSoundtrack.year,
        remaining: remainingCount - 1,
        total: SOUNDTRACK_DATA.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in soundtrack-batch-processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
