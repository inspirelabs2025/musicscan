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
    const { year = new Date().getFullYear(), regenerate = false } = await req.json();
    
    console.log(`Generating year overview for ${year}, regenerate: ${regenerate}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (unless regenerate is requested)
    if (!regenerate) {
      const { data: cached } = await supabase
        .from('year_overview_cache')
        .select('*')
        .eq('year', year)
        .eq('filter_hash', 'default')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached) {
        console.log('Returning cached overview');
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Generate AI narratives based purely on historical knowledge
    console.log('Generating AI narratives based on historical knowledge...');
    const narratives = await generateHistoricalNarratives(year);
    console.log('Narratives generated:', Object.keys(narratives).length, 'sections');

    const dataPoints = {
      spotify: null,
      discogs: null,
      perplexity: null
    };

    // Store in cache
    const cacheData = {
      year,
      filter_hash: 'default',
      data_points: dataPoints,
      generated_narratives: narratives,
      sources: {
        spotify: false,
        discogs: false,
        perplexity: false,
        ai_knowledge: true
      },
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const { error: upsertError } = await supabase
      .from('year_overview_cache')
      .upsert(cacheData, { onConflict: 'year,filter_hash' });

    if (upsertError) {
      console.error('Cache upsert error:', upsertError);
    }

    return new Response(JSON.stringify(cacheData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating year overview:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateHistoricalNarratives(year: number) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.log('No LOVABLE_API_KEY, using fallback narratives');
    return getFallbackNarratives(year);
  }

  const prompt = `Je bent een ervaren Nederlandse muziekjournalist en muziekhistoricus met encyclopedische kennis van de muziekindustrie wereldwijd. 

TAAK: Genereer een VOLLEDIG en FEITELIJK CORRECT muziek jaaroverzicht voor het jaar ${year}.

KRITIEKE INSTRUCTIES:
1. Gebruik ALLEEN ECHTE, VERIFICEERBARE FEITEN over ${year} - geen verzinsels
2. Als ${year} in de toekomst ligt of je bent niet zeker, geef dat expliciet aan
3. Wees EXTREEM SPECIFIEK met namen, datums, cijfers, awards
4. Dit is een HISTORISCH overzicht - NIET gebaseerd op een platform of database

VEREISTE INHOUD:

## TOP ARTIESTEN ${year}
- Welke artiesten domineerden de charts in ${year}?
- Wie had de meeste #1 hits, hoogste streaming cijfers?
- Nieuwe doorbraken van ${year}?
- Concrete cijfers: streams, verkoop, chart posities

## TOP ALBUMS ${year}
- Welke albums kwamen uit in ${year} die iconisch werden?
- Welke albums stonden bovenaan de jaarlijsten?
- Debuutalbums, comeback albums, laatste albums
- Concrete: label, release datum, chart posities, certificeringen

## AWARDS ${year}
- Grammy Awards ${year}: Wie won Album/Record/Song of the Year?
- Brit Awards ${year}: Winnaars
- Edison Awards ${year}: Nederlandse winnaars
- MTV VMA's ${year}: Video of the Year etc.
- Billboard jaar-awards en records

## IN MEMORIAM ${year}
- Welke muzikanten, producers, componisten overleden in ${year}?
- Leeftijd, doodsoorzaak indien bekend
- Hun belangrijkste werk en nalatenschap
- WEES RESPECTVOL EN FEITELIJK

## NEDERLANDSE MUZIEK ${year}
- Welke Nederlandse artiesten scoorden in ${year}?
- Top 40 / 538 / Radio 2 hits
- Edison winnaars
- Nederlandse festivalheadliners
- Doorbraken en debuuts

## STREAMING & VIRAL ${year}
- Spotify Wrapped data van ${year} (meest gestreamde artiest/song)
- TikTok virale hits die doorbraken
- Streaming records gebroken in ${year}
- Concrete cijfers

## TOURS & FESTIVALS ${year}
- Hoogst verdienende tours van ${year}
- Festival headliners (Coachella, Glastonbury, Pinkpop, Lowlands)
- Stadion records
- Concrete: opbrengst, aantal shows, bezoekers

## GENRE TRENDS ${year}
- Welke genres groeiden in ${year}?
- Welke genres namen af?
- Nieuwe fusie-genres of substijlen?

## INDUSTRIE STATISTIEKEN ${year}
- Totaal aantal releases
- Vinyl verkoop cijfers
- Streaming revenue
- Belangrijke deals en nieuws

Genereer JSON met deze EXACTE structuur:

{
  "global_overview": {
    "narrative": "Uitgebreide introductie (250-350 woorden) over muziekjaar ${year}. Belangrijkste gebeurtenissen, trends, doorbraken. Concrete cijfers over de industrie.",
    "highlights": ["8-10 specifieke hoogtepunten van ${year} met namen/cijfers"]
  },
  "top_artists": [
    {
      "name": "Artiest naam",
      "achievement": "Specifieke prestatie in ${year} met cijfers",
      "genre": "Genre",
      "albums_released": 1,
      "total_streams_billions": 3.2,
      "notable_songs": ["Hit 1 van ${year}", "Hit 2 van ${year}"],
      "image_url": null
    }
  ],
  "top_albums": [
    {
      "artist": "Artiest",
      "title": "Album titel",
      "description": "Beschrijving (60-100 woorden): thema, productie, ontvangst, impact",
      "release_date": "${year}-MM-DD",
      "label": "Platenmaatschappij",
      "weeks_on_chart": 52,
      "certifications": ["Platina", "Goud"],
      "image_url": null
    }
  ],
  "awards": {
    "narrative": "Uitgebreide beschrijving awards seizoen ${year} (150-200 woorden). Trends, verrassingen, historische momenten.",
    "grammy": [
      {"category": "Album of the Year", "winner": "Artiest - Album", "other_nominees": ["Nominee 1", "Nominee 2"]}
    ],
    "brit_awards": [
      {"category": "British Album of the Year", "winner": "Artiest - Album"}
    ],
    "edison": [
      {"category": "Album Nationaal", "winner": "Nederlandse artiest - Album"}
    ],
    "mtv_vma": [
      {"category": "Video of the Year", "winner": "Artiest - Song"}
    ],
    "billboard_achievements": ["Specifiek record ${year}"]
  },
  "in_memoriam": {
    "narrative": "Respectvolle herdenking (150-200 woorden) van muziekwereld verliezen in ${year}.",
    "artists": [
      {
        "name": "Artiest naam",
        "years": "Geboortejaar-${year}",
        "date_of_death": "${year}-MM-DD",
        "age": 75,
        "cause": "Oorzaak indien publiek bekend",
        "known_for": "Belangrijkste werk en invloed",
        "notable_works": ["Iconisch werk 1", "Iconisch werk 2"],
        "legacy": "Nalatenschap",
        "image_url": null
      }
    ]
  },
  "dutch_music": {
    "narrative": "Uitgebreide beschrijving (200 woorden) Nederlandse muziekscene ${year}.",
    "highlights": ["NL hoogtepunt 1", "NL hoogtepunt 2"],
    "top_artists": ["Nederlandse artiest 1", "Artiest 2"],
    "edison_winners": [{"category": "Category", "winner": "Winner"}],
    "top_40_records": ["Record 1"],
    "festivals_nl": ["Festival - headliner info"]
  },
  "streaming_viral": {
    "narrative": "Analyse (200 woorden) streaming en viral trends ${year}.",
    "viral_hits": [
      {"song": "Song", "artist": "Artiest", "platform": "TikTok", "streams_millions": 500, "viral_reason": "Reden"}
    ],
    "streaming_records": ["Record met cijfers"],
    "spotify_wrapped": {
      "most_streamed_artist": "Artiest - X miljard",
      "most_streamed_song": "Song - X miljard",
      "most_streamed_album": "Album - X miljard"
    },
    "tiktok_trends": ["Trend 1"]
  },
  "tours_festivals": {
    "narrative": "Beschrijving (200 woorden) live muziek ${year}.",
    "biggest_tours": [
      {
        "artist": "Artiest",
        "tour_name": "Tour naam",
        "gross_millions": 500,
        "shows": 150,
        "attendance_millions": 5.2,
        "notable_venues": ["Venue 1"]
      }
    ],
    "festivals": [
      {
        "name": "Festival",
        "headliners": ["Artiest 1"],
        "attendance": 80000,
        "notable_moments": "Moment"
      }
    ],
    "venue_records": ["Record"]
  },
  "genre_trends": {
    "narrative": "Analyse (200 woorden) genre trends ${year}.",
    "rising_genres": [
      {"genre": "Genre", "growth_percentage": 25, "key_artists": ["Artiest"]}
    ],
    "popular_genres": [
      {"genre": "Pop", "percentage": 30, "top_songs": ["Song"]}
    ],
    "declining_genres": ["Genre"],
    "fusion_trends": ["Fusie trend"]
  },
  "industry_stats": {
    "total_albums_released": 50000,
    "total_songs_released": 500000,
    "vinyl_sales_growth_percentage": 12,
    "streaming_revenue_billions": 15,
    "live_music_revenue_billions": 25,
    "notable_record_deals": ["Deal"],
    "major_label_news": ["Nieuws"]
  }
}

KRITIEKE EISEN:
- Minimaal 10 ECHTE top artiesten van ${year}
- Minimaal 10 ECHTE top albums van ${year}
- Minimaal 5-8 In Memoriam artiesten van ${year} (indien van toepassing)
- ECHTE Grammy/Brit/Edison/VMA winnaars van ${year}
- Alle data moet FEITELIJK CORRECT zijn voor ${year}
- Schrijf in het Nederlands
- Return ALLEEN valid JSON, geen markdown`;

  try {
    console.log('Calling AI for historical narrative generation...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `Je bent een muziekhistoricus en journalist met complete kennis van muziekgeschiedenis.

KRITIEK: Je genereert een HISTORISCH jaaroverzicht. Gebruik ALLEEN echte, verifieerbare feiten.
- Grammy winnaars: je kent alle winnaars
- Overleden artiesten: je kent alle sterfgevallen per jaar
- Chart hits: je kent de top hits per jaar
- Streaming records: je kent Spotify Wrapped data
- Tours: je kent de hoogst verdienende tours

Als het jaar in de toekomst ligt of je bent onzeker, zeg dat expliciet.
Genereer ALLEEN valid JSON zonder markdown code fences.` 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 10000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return getFallbackNarratives(year);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('AI response length:', content.length);
    
    const narratives = JSON.parse(content);
    
    // Fetch real artwork for AI-generated albums/artists via Spotify Search
    const enrichedNarratives = await fetchArtworkForNarratives(narratives);
    return enrichedNarratives;
  } catch (error) {
    console.error('AI narrative generation error:', error);
    return getFallbackNarratives(year);
  }
}

async function fetchArtworkForNarratives(narratives: any) {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    console.log('Spotify credentials not configured, skipping artwork fetch');
    return narratives;
  }

  try {
    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      console.error('Spotify token error');
      return narratives;
    }

    const { access_token } = await tokenResponse.json();
    
    // Fetch artwork for top_albums using Spotify Search
    if (narratives.top_albums && Array.isArray(narratives.top_albums)) {
      for (let i = 0; i < Math.min(narratives.top_albums.length, 10); i++) {
        const album = narratives.top_albums[i];
        if (album.artist && album.title) {
          try {
            const query = encodeURIComponent(`album:${album.title} artist:${album.artist}`);
            const searchResponse = await fetch(
              `https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`,
              { headers: { 'Authorization': `Bearer ${access_token}` } }
            );
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const foundAlbum = searchData.albums?.items?.[0];
              if (foundAlbum?.images?.[0]?.url) {
                narratives.top_albums[i].image_url = foundAlbum.images[0].url;
                console.log(`Found album artwork for: ${album.artist} - ${album.title}`);
              }
            }
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 100));
          } catch (e) {
            console.error(`Error fetching album artwork for ${album.title}:`, e);
          }
        }
      }
    }
    
    // Fetch artwork for top_artists using Spotify Search
    if (narratives.top_artists && Array.isArray(narratives.top_artists)) {
      for (let i = 0; i < Math.min(narratives.top_artists.length, 10); i++) {
        const artist = narratives.top_artists[i];
        if (artist.name) {
          try {
            const query = encodeURIComponent(artist.name);
            const searchResponse = await fetch(
              `https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`,
              { headers: { 'Authorization': `Bearer ${access_token}` } }
            );
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const foundArtist = searchData.artists?.items?.[0];
              if (foundArtist?.images?.[0]?.url) {
                narratives.top_artists[i].image_url = foundArtist.images[0].url;
                console.log(`Found artist artwork for: ${artist.name}`);
              }
            }
            await new Promise(r => setTimeout(r, 100));
          } catch (e) {
            console.error(`Error fetching artist artwork for ${artist.name}:`, e);
          }
        }
      }
    }

    // Fetch artwork for in_memoriam artists
    if (narratives.in_memoriam?.artists && Array.isArray(narratives.in_memoriam.artists)) {
      for (let i = 0; i < Math.min(narratives.in_memoriam.artists.length, 10); i++) {
        const artist = narratives.in_memoriam.artists[i];
        if (artist.name) {
          try {
            const query = encodeURIComponent(artist.name);
            const searchResponse = await fetch(
              `https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`,
              { headers: { 'Authorization': `Bearer ${access_token}` } }
            );
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const foundArtist = searchData.artists?.items?.[0];
              if (foundArtist?.images?.[0]?.url) {
                narratives.in_memoriam.artists[i].image_url = foundArtist.images[0].url;
                console.log(`Found in memoriam artwork for: ${artist.name}`);
              }
            }
            await new Promise(r => setTimeout(r, 100));
          } catch (e) {
            console.error(`Error fetching in memoriam artwork for ${artist.name}:`, e);
          }
        }
      }
    }

    return narratives;
  } catch (error) {
    console.error('Error in fetchArtworkForNarratives:', error);
    return narratives;
  }
}

function getFallbackNarratives(year: number) {
  return {
    global_overview: {
      narrative: `${year} was een belangrijk jaar voor de muziekindustrie. Ververs de pagina om een volledig AI-gegenereerd overzicht te krijgen met echte historische data over dit jaar.`,
      highlights: [
        `Muziektrends van ${year}`,
        'Grammy Awards en andere prijzen',
        'Streaming ontwikkelingen',
        'Live muziek en festivals'
      ]
    },
    top_artists: [],
    top_albums: [],
    awards: {
      narrative: `De belangrijkste muziekprijzen van ${year}. Ververs voor details.`,
      grammy: [],
      brit_awards: [],
      edison: [],
      mtv_vma: [],
      billboard_achievements: []
    },
    in_memoriam: {
      narrative: `In ${year} verloor de muziekwereld enkele belangrijke figuren. Ververs voor een volledig overzicht.`,
      artists: []
    },
    dutch_music: {
      narrative: `De Nederlandse muziekscene in ${year}. Ververs voor details.`,
      highlights: [],
      top_artists: [],
      edison_winners: [],
      top_40_records: [],
      festivals_nl: []
    },
    streaming_viral: {
      narrative: `Streaming trends en virale hits van ${year}. Ververs voor details.`,
      viral_hits: [],
      streaming_records: [],
      spotify_wrapped: {},
      tiktok_trends: []
    },
    tours_festivals: {
      narrative: `Live muziek en festivals in ${year}. Ververs voor details.`,
      biggest_tours: [],
      festivals: [],
      venue_records: []
    },
    genre_trends: {
      narrative: `Genre ontwikkelingen in ${year}. Ververs voor details.`,
      rising_genres: [],
      popular_genres: [],
      declining_genres: [],
      fusion_trends: []
    },
    industry_stats: {
      total_albums_released: 0,
      total_songs_released: 0,
      vinyl_sales_growth_percentage: 0,
      streaming_revenue_billions: 0,
      live_music_revenue_billions: 0,
      notable_record_deals: [],
      major_label_news: []
    }
  };
}
