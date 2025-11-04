import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Minimal seed list (adds only missing ones); extendable safely
const ARTISTS: { name: string; priority?: number }[] = [
  { name: 'Fleetwood Mac' }, { name: 'Bruce Springsteen' }, { name: 'U2' }, { name: 'The Doors' }, { name: 'R.E.M.' },
  { name: 'Prince' }, { name: 'Madonna' }, { name: 'Michael Jackson' }, { name: 'Whitney Houston' }, { name: 'Stevie Wonder' },
  { name: 'Marvin Gaye' }, { name: 'Aretha Franklin' }, { name: 'James Brown' }, { name: 'Elvis Presley' }, { name: 'Chuck Berry' },
  { name: 'The Beach Boys' }, { name: 'Simon & Garfunkel' }, { name: 'Bob Marley & The Wailers' }, { name: 'Ramones' }, { name: 'The Clash' },
  { name: 'Sex Pistols' }, { name: 'Talking Heads' }, { name: 'Blondie' }, { name: 'Sonic Youth' }, { name: 'Pixies' },
  { name: 'The Cure' }, { name: 'Depeche Mode' }, { name: 'New Order' }, { name: 'The Stone Roses' }, { name: 'Oasis' },
  { name: 'Blur' }, { name: 'Pulp' }, { name: 'Suede' }, { name: 'Arctic Monkeys' }, { name: 'The Strokes' },
  { name: 'The White Stripes' }, { name: 'Queens of the Stone Age' }, { name: 'Foo Fighters' }, { name: 'Red Hot Chili Peppers' }, { name: 'Pearl Jam' },
  { name: 'Soundgarden' }, { name: 'Alice in Chains' }, { name: 'The Smashing Pumpkins' }, { name: "Jane's Addiction" }, { name: 'Rage Against the Machine' },
  { name: 'Tool' }, { name: 'Nine Inch Nails' }, { name: 'Daft Punk' }, { name: 'The Chemical Brothers' }, { name: 'Massive Attack' },
  { name: 'Portishead' }, { name: 'Björk' }, { name: 'PJ Harvey' }, { name: 'Nick Cave & The Bad Seeds' }, { name: 'Tom Waits' },
  { name: 'Leonard Cohen' }, { name: 'Joni Mitchell' }, { name: 'Neil Young' }, { name: 'Van Morrison' }, { name: 'The Kinks' },
  { name: 'The Who' }, { name: 'Cream' }, { name: 'Eric Clapton' }, { name: 'Jeff Beck' }, { name: 'Santana' },
  { name: 'Grateful Dead' }, { name: 'Jefferson Airplane' }, { name: 'Janis Joplin' }, { name: 'Creedence Clearwater Revival' },
  { name: 'The Band' }, { name: 'The Byrds' }, { name: 'Buffalo Springfield' }, { name: 'Crosby, Stills, Nash & Young' },
  { name: 'Eagles' }, { name: 'America' }, { name: 'Jackson Browne' }, { name: 'James Taylor' }, { name: 'Carole King' },
  { name: 'Billy Joel' }, { name: 'Steely Dan' }, { name: 'Supertramp' }, { name: 'Genesis' }, { name: 'Yes' },
  { name: 'Emerson, Lake & Palmer' }, { name: 'King Crimson' }, { name: 'Jethro Tull' }, { name: 'Rush' },
  { name: 'Iron Maiden' }, { name: 'Judas Priest' }, { name: 'Motörhead' }, { name: 'Slayer' }, { name: 'Megadeth' },
  { name: 'Anthrax' }, { name: 'Pantera' }, { name: 'Sepultura' }, { name: 'Black Flag' }, { name: 'Dead Kennedys' },
  { name: 'Minor Threat' }, { name: 'Fugazi' }, { name: 'Bad Religion' }, { name: 'NOFX' }, { name: 'The Offspring' },
  { name: 'Green Day' }, { name: 'Blink-182' }, { name: 'Sum 41' }, { name: 'My Chemical Romance' }, { name: 'Fall Out Boy' },
  { name: 'Paramore' }, { name: 'The Killers' }, { name: 'Franz Ferdinand' }, { name: 'Interpol' }, { name: 'Yeah Yeah Yeahs' },
  { name: 'TV on the Radio' }, { name: 'Arcade Fire' }, { name: 'Vampire Weekend' }, { name: 'MGMT' }, { name: 'Tame Impala' },
  { name: 'Fleet Foxes' }, { name: 'Bon Iver' }, { name: 'Sufjan Stevens' }, { name: 'Wilco' }, { name: 'Pavement' },
  { name: 'Guided by Voices' }, { name: 'Built to Spill' }, { name: 'Dinosaur Jr.' }, { name: 'My Bloody Valentine' }, { name: 'Ride' },
  { name: 'Slowdive' }, { name: 'Cocteau Twins' }, { name: 'This Mortal Coil' }, { name: 'Dead Can Dance' }, { name: 'Siouxsie and the Banshees' },
  { name: 'Bauhaus' }, { name: 'The Sisters of Mercy' }, { name: 'The Mission' }, { name: 'Echo & the Bunnymen' },
  { name: 'Tears for Fears' }, { name: 'Simple Minds' }, { name: 'Duran Duran' }, { name: 'Spandau Ballet' }, { name: 'Culture Club' },
  { name: 'Wham!' }, { name: 'George Michael' }, { name: 'Eurythmics' }, { name: 'The Pretenders' }, { name: 'Pat Benatar' },
  { name: 'Joan Jett & the Blackhearts' }, { name: 'Heart' }, { name: 'Stevie Nicks' }, { name: 'Tom Petty and the Heartbreakers' },
  { name: 'Lynyrd Skynyrd' }, { name: 'The Allman Brothers Band' }, { name: 'ZZ Top' }, { name: 'Aerosmith' }, { name: 'Van Halen' },
  { name: 'Def Leppard' }, { name: 'Bon Jovi' }, { name: "Guns N' Roses" }, { name: 'Mötley Crüe' }, { name: 'Poison' },
  { name: 'Skid Row' }, { name: 'Whitesnake' }, { name: 'Scorpions' }, { name: 'Accept' }, { name: 'Rammstein' },
  { name: 'The Prodigy' }, { name: 'Underworld' }, { name: 'Orbital' }, { name: 'Aphex Twin' }, { name: 'Autechre' },
  { name: 'Boards of Canada' }, { name: 'Muse' }, { name: 'Coldplay' }, { name: 'Sigur Rós' }, { name: 'Mogwai' },
  { name: 'Explosions in the Sky' }, { name: 'Godspeed You! Black Emperor' }, { name: 'Slint' }, { name: 'Tortoise' },
  { name: 'The Mars Volta' }, { name: 'At the Drive-In' }, { name: 'System of a Down' }, { name: 'Deftones' }, { name: 'Korn' },
  { name: 'Linkin Park' }, { name: 'Evanescence' }, { name: 'Within Temptation' }, { name: 'Nightwish' }, { name: 'Epica' },
  { name: 'Amon Amarth' }, { name: 'Opeth' }, { name: 'Arch Enemy' }, { name: 'In Flames' }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Count existing
    const { data: countData, error: countErr } = await supabase
      .from('curated_artists')
      .select('id', { count: 'exact', head: true });
    if (countErr) throw countErr;

    // Build inserts for missing artists
    const { data: existing, error: existingErr } = await supabase
      .from('curated_artists')
      .select('artist_name');
    if (existingErr) throw existingErr;

    const existingSet = new Set((existing || []).map((r: any) => r.artist_name));
    const toInsert = ARTISTS.filter(a => !existingSet.has(a.name))
      .map(a => ({ artist_name: a.name, priority: a.priority ?? 1, is_active: true }));

    let inserted = 0;
    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('curated_artists')
        .insert(toInsert, { defaultToNull: false });
      if (insertErr) throw insertErr;
      inserted = toInsert.length;
    }

    // Return counts
    const { count: finalCount } = await supabase
      .from('curated_artists')
      .select('id', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({ success: true, inserted, total: finalCount ?? (countData?.length || 0) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Seed error:', e);
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
