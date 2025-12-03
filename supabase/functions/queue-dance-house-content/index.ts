import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dance/House artists list (same as frontend)
const DANCE_HOUSE_ARTISTS = [
  'Tiësto', 'Armin van Buuren', 'Martin Garrix', 'Afrojack', 'Hardwell',
  'Nicky Romero', 'Oliver Heldens', 'Don Diablo', 'Fedde Le Grand', 'Laidback Luke',
  'Daft Punk', 'The Chemical Brothers', 'Fatboy Slim', 'The Prodigy', 'Basement Jaxx',
  'Underworld', 'Leftfield', 'Orbital', 'Moby', 'Paul Oakenfold',
  'Carl Cox', 'Richie Hawtin', 'Adam Beyer', 'Charlotte de Witte', 'Amelie Lens',
  'Nina Kraviz', 'Jeff Mills', 'Derrick May', 'Kevin Saunderson', 'Juan Atkins',
  'David Guetta', 'Calvin Harris', 'Swedish House Mafia', 'Avicii', 'Deadmau5',
  'Skrillex', 'Diplo', 'Major Lazer', 'Marshmello', 'The Chainsmokers',
  'Frankie Knuckles', 'Larry Heard', 'Marshall Jefferson', 'Ron Hardy', 'Farley Jackmaster Funk',
  'Giorgio Moroder', 'Kraftwerk', 'Jean-Michel Jarre', 'Tangerine Dream', 'Vangelis',
  'ATB', 'Paul van Dyk', 'Ferry Corsten', 'Above & Beyond', 'Dash Berlin',
  'Markus Schulz', 'Aly & Fila', 'Gareth Emery', 'Andrew Rayel', 'Cosmic Gate',
  'Sven Väth', 'Ricardo Villalobos', 'Marco Carola', 'Loco Dice', 'Luciano',
  'Tale Of Us', 'Stephan Bodzin', 'Maceo Plex', 'Dixon', 'Âme',
  '2 Unlimited', 'Snap!', 'Culture Beat', 'Haddaway', 'Corona',
  'La Bouche', 'Real McCoy', 'Technotronic', 'C+C Music Factory', 'Black Box',
  'Disclosure', 'Rudimental', 'Duke Dumont', 'Gorgon City', 'Jax Jones',
  'Fisher', 'Chris Lake', 'Green Velvet', 'Claude VonStroke', 'Dirtybird',
  'Armin Only', 'Eric Prydz', 'Alesso', 'Zedd', 'Kygo',
  'Robin Schulz', 'Lost Frequencies', 'Sam Feldt', 'Lucas & Steve', 'Mike Williams',
  'Jauz', 'NGHTMRE', 'Slander', 'Illenium', 'Seven Lions',
  'Excision', 'Zomboy', 'Virtual Riot', 'Getter', 'Must Die!',
  'Reinier Zonneveld', 'Joris Voorn', 'Eelke Kleijn', 'Patrice Bäumel', 'Worakls'
];

// Popular singles per artist (curated list)
const ARTIST_SINGLES: Record<string, { title: string; year?: number }[]> = {
  'Tiësto': [
    { title: 'Adagio for Strings', year: 2005 },
    { title: 'Traffic', year: 2003 },
    { title: 'Red Lights', year: 2014 },
    { title: 'The Business', year: 2020 },
  ],
  'Armin van Buuren': [
    { title: 'Communication', year: 1999 },
    { title: 'Shivers', year: 2005 },
    { title: 'This Is What It Feels Like', year: 2013 },
    { title: 'Blah Blah Blah', year: 2018 },
  ],
  'Martin Garrix': [
    { title: 'Animals', year: 2013 },
    { title: 'Tremor', year: 2014 },
    { title: 'Scared to Be Lonely', year: 2017 },
    { title: 'In the Name of Love', year: 2016 },
  ],
  'Daft Punk': [
    { title: 'Around the World', year: 1997 },
    { title: 'One More Time', year: 2000 },
    { title: 'Harder, Better, Faster, Stronger', year: 2001 },
    { title: 'Get Lucky', year: 2013 },
  ],
  'The Chemical Brothers': [
    { title: 'Block Rockin\' Beats', year: 1997 },
    { title: 'Hey Boy Hey Girl', year: 1999 },
    { title: 'Galvanize', year: 2005 },
    { title: 'Go', year: 2015 },
  ],
  'Fatboy Slim': [
    { title: 'The Rockafeller Skank', year: 1998 },
    { title: 'Praise You', year: 1999 },
    { title: 'Right Here, Right Now', year: 1999 },
    { title: 'Weapon of Choice', year: 2001 },
  ],
  'The Prodigy': [
    { title: 'Firestarter', year: 1996 },
    { title: 'Breathe', year: 1996 },
    { title: 'Smack My Bitch Up', year: 1997 },
    { title: 'Invaders Must Die', year: 2009 },
  ],
  'David Guetta': [
    { title: 'When Love Takes Over', year: 2009 },
    { title: 'Titanium', year: 2011 },
    { title: 'Without You', year: 2011 },
    { title: 'Hey Mama', year: 2015 },
  ],
  'Calvin Harris': [
    { title: 'Feel So Close', year: 2011 },
    { title: 'Summer', year: 2014 },
    { title: 'This Is What You Came For', year: 2016 },
    { title: 'One Kiss', year: 2018 },
  ],
  'Avicii': [
    { title: 'Levels', year: 2011 },
    { title: 'Wake Me Up', year: 2013 },
    { title: 'Hey Brother', year: 2013 },
    { title: 'Waiting for Love', year: 2015 },
  ],
  'Deadmau5': [
    { title: 'Ghosts \'n\' Stuff', year: 2008 },
    { title: 'Strobe', year: 2009 },
    { title: 'I Remember', year: 2008 },
    { title: 'The Veldt', year: 2012 },
  ],
  'Swedish House Mafia': [
    { title: 'One', year: 2010 },
    { title: 'Save the World', year: 2011 },
    { title: 'Don\'t You Worry Child', year: 2012 },
    { title: 'Greyhound', year: 2012 },
  ],
  'Kraftwerk': [
    { title: 'Autobahn', year: 1974 },
    { title: 'The Model', year: 1978 },
    { title: 'The Robots', year: 1978 },
    { title: 'Tour de France', year: 1983 },
  ],
  'Giorgio Moroder': [
    { title: 'I Feel Love', year: 1977 },
    { title: 'Chase', year: 1978 },
    { title: 'Call Me', year: 1980 },
    { title: 'Together in Electric Dreams', year: 1984 },
  ],
  'Carl Cox': [
    { title: 'I Want You', year: 1991 },
    { title: 'The Latin Theme', year: 2000 },
    { title: 'Phuture 2000', year: 2000 },
  ],
  'Moby': [
    { title: 'Go', year: 1991 },
    { title: 'Porcelain', year: 2000 },
    { title: 'Natural Blues', year: 2000 },
    { title: 'Why Does My Heart Feel So Bad?', year: 1999 },
  ],
  '2 Unlimited': [
    { title: 'Get Ready for This', year: 1991 },
    { title: 'No Limit', year: 1993 },
    { title: 'Twilight Zone', year: 1992 },
  ],
  'ATB': [
    { title: '9 PM (Till I Come)', year: 1998 },
    { title: 'Don\'t Stop!', year: 1999 },
    { title: 'Ecstasy', year: 2004 },
  ],
  'Eric Prydz': [
    { title: 'Call on Me', year: 2004 },
    { title: 'Pjanoo', year: 2008 },
    { title: 'Opus', year: 2016 },
  ],
  'Kygo': [
    { title: 'Firestone', year: 2014 },
    { title: 'Stole the Show', year: 2015 },
    { title: 'It Ain\'t Me', year: 2017 },
  ],
  'Disclosure': [
    { title: 'Latch', year: 2012 },
    { title: 'White Noise', year: 2013 },
    { title: 'Omen', year: 2015 },
  ],
  'Skrillex': [
    { title: 'Scary Monsters and Nice Sprites', year: 2010 },
    { title: 'Bangarang', year: 2011 },
    { title: 'First of the Year', year: 2011 },
  ],
  'Marshmello': [
    { title: 'Alone', year: 2016 },
    { title: 'Happier', year: 2018 },
    { title: 'Friends', year: 2018 },
  ],
  'The Chainsmokers': [
    { title: 'Roses', year: 2015 },
    { title: 'Closer', year: 2016 },
    { title: 'Something Just Like This', year: 2017 },
  ],
  'Zedd': [
    { title: 'Clarity', year: 2012 },
    { title: 'Stay', year: 2017 },
    { title: 'The Middle', year: 2018 },
  ],
  'Robin Schulz': [
    { title: 'Prayer in C', year: 2014 },
    { title: 'Sugar', year: 2015 },
    { title: 'OK', year: 2017 },
  ],
};

// Notable albums per artist
const ARTIST_ALBUMS: Record<string, { title: string; year?: number }[]> = {
  'Daft Punk': [
    { title: 'Homework', year: 1997 },
    { title: 'Discovery', year: 2001 },
    { title: 'Random Access Memories', year: 2013 },
  ],
  'The Chemical Brothers': [
    { title: 'Dig Your Own Hole', year: 1997 },
    { title: 'Surrender', year: 1999 },
    { title: 'Come With Us', year: 2002 },
  ],
  'The Prodigy': [
    { title: 'Music for the Jilted Generation', year: 1994 },
    { title: 'The Fat of the Land', year: 1997 },
    { title: 'Invaders Must Die', year: 2009 },
  ],
  'Fatboy Slim': [
    { title: 'Better Living Through Chemistry', year: 1996 },
    { title: 'You\'ve Come a Long Way, Baby', year: 1998 },
    { title: 'Halfway Between the Gutter and the Stars', year: 2000 },
  ],
  'Kraftwerk': [
    { title: 'Autobahn', year: 1974 },
    { title: 'Trans-Europe Express', year: 1977 },
    { title: 'The Man-Machine', year: 1978 },
    { title: 'Computer World', year: 1981 },
  ],
  'Moby': [
    { title: 'Play', year: 1999 },
    { title: '18', year: 2002 },
    { title: 'Hotel', year: 2005 },
  ],
  'Avicii': [
    { title: 'True', year: 2013 },
    { title: 'Stories', year: 2015 },
  ],
  'Deadmau5': [
    { title: 'Random Album Title', year: 2008 },
    { title: 'For Lack of a Better Name', year: 2009 },
    { title: '4x4=12', year: 2010 },
  ],
  'David Guetta': [
    { title: 'One Love', year: 2009 },
    { title: 'Nothing but the Beat', year: 2011 },
    { title: 'Listen', year: 2014 },
  ],
  'Calvin Harris': [
    { title: 'Ready for the Weekend', year: 2009 },
    { title: '18 Months', year: 2012 },
    { title: 'Motion', year: 2014 },
  ],
  'Disclosure': [
    { title: 'Settle', year: 2013 },
    { title: 'Caracal', year: 2015 },
    { title: 'Energy', year: 2020 },
  ],
  'Orbital': [
    { title: 'Orbital 2', year: 1993 },
    { title: 'Snivilisation', year: 1994 },
    { title: 'In Sides', year: 1996 },
  ],
  'Underworld': [
    { title: 'Dubnobasswithmyheadman', year: 1994 },
    { title: 'Second Toughest in the Infants', year: 1996 },
    { title: 'Beaucoup Fish', year: 1999 },
  ],
  'Basement Jaxx': [
    { title: 'Remedy', year: 1999 },
    { title: 'Rooty', year: 2001 },
    { title: 'Kish Kash', year: 2003 },
  ],
  'Giorgio Moroder': [
    { title: 'From Here to Eternity', year: 1977 },
    { title: 'E=MC²', year: 1979 },
    { title: 'Déjà Vu', year: 2015 },
  ],
  'Jean-Michel Jarre': [
    { title: 'Oxygène', year: 1976 },
    { title: 'Équinoxe', year: 1978 },
    { title: 'Magnetic Fields', year: 1981 },
  ],
  'Tangerine Dream': [
    { title: 'Phaedra', year: 1974 },
    { title: 'Rubycon', year: 1975 },
    { title: 'Ricochet', year: 1975 },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action = 'both', limit = 100 } = await req.json().catch(() => ({}));

    console.log(`[queue-dance-house-content] Starting with action: ${action}, limit: ${limit}`);

    const results = {
      singles_queued: 0,
      albums_queued: 0,
      singles_skipped: 0,
      albums_skipped: 0,
      errors: [] as string[],
    };

    // Queue Singles
    if (action === 'singles' || action === 'both') {
      console.log('[queue-dance-house-content] Queueing singles...');
      
      for (const [artist, singles] of Object.entries(ARTIST_SINGLES)) {
        for (const single of singles) {
          // Check if already exists
          const { data: existing } = await supabase
            .from('singles_import_queue')
            .select('id')
            .eq('artist_name', artist)
            .eq('single_name', single.title)
            .maybeSingle();

          if (existing) {
            results.singles_skipped++;
            continue;
          }

          // Also check if story already exists
          const { data: existingStory } = await supabase
            .from('music_stories')
            .select('id')
            .ilike('artist_name', artist)
            .ilike('single_name', single.title)
            .maybeSingle();

          if (existingStory) {
            results.singles_skipped++;
            continue;
          }

          const { error } = await supabase
            .from('singles_import_queue')
            .insert({
              artist_name: artist,
              single_name: single.title,
              release_year: single.year,
              genre: 'Electronic/Dance',
              status: 'pending',
              priority: 100, // High priority for dance content
            });

          if (error) {
            results.errors.push(`Singles error for ${artist} - ${single.title}: ${error.message}`);
          } else {
            results.singles_queued++;
          }

          if (results.singles_queued >= limit) break;
        }
        if (results.singles_queued >= limit) break;
      }
    }

    // Queue Albums for art generation
    if (action === 'albums' || action === 'both') {
      console.log('[queue-dance-house-content] Queueing albums...');
      
      for (const [artist, albums] of Object.entries(ARTIST_ALBUMS)) {
        for (const album of albums) {
          // Check if already in import log
          const { data: existing } = await supabase
            .from('discogs_import_log')
            .select('id')
            .eq('artist', artist)
            .eq('title', album.title)
            .maybeSingle();

          if (existing) {
            results.albums_skipped++;
            continue;
          }

          const { error } = await supabase
            .from('discogs_import_log')
            .insert({
              artist: artist,
              title: album.title,
              year: album.year,
              format: 'Vinyl, LP, Album',
              status: 'pending',
              discogs_release_id: 0, // Will be looked up during processing
            });

          if (error) {
            results.errors.push(`Albums error for ${artist} - ${album.title}: ${error.message}`);
          } else {
            results.albums_queued++;
          }

          if (results.albums_queued >= limit) break;
        }
        if (results.albums_queued >= limit) break;
      }
    }

    console.log('[queue-dance-house-content] Results:', results);

    return new Response(JSON.stringify({
      success: true,
      results,
      message: `Queued ${results.singles_queued} singles and ${results.albums_queued} albums. Skipped ${results.singles_skipped} existing singles and ${results.albums_skipped} existing albums.`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[queue-dance-house-content] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
