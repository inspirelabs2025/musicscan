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

    // Fetch from external sources in parallel
    console.log('Fetching external data sources...');
    const [spotifyData, discogsData] = await Promise.all([
      fetchSpotifyData(),
      fetchDiscogsData(year),
    ]);

    console.log('Spotify data:', spotifyData ? `${spotifyData.newReleases?.length || 0} releases` : 'failed');
    console.log('Discogs data:', discogsData ? `${discogsData.topReleases?.length || 0} releases` : 'failed');

    // Generate AI narratives for all sections
    const narratives = await generateAllNarratives(year, spotifyData, discogsData);
    console.log('Narratives generated:', Object.keys(narratives).length, 'sections');

    const dataPoints = {
      spotify: spotifyData,
      discogs: discogsData,
      perplexity: null
    };

    // Store in cache
    const cacheData = {
      year,
      filter_hash: 'default',
      data_points: dataPoints,
      generated_narratives: narratives,
      sources: {
        spotify: !!spotifyData,
        discogs: !!discogsData,
        perplexity: false
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

async function fetchSpotifyData() {
  try {
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      console.log('Spotify credentials not configured');
      return null;
    }

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      console.error('Spotify token error:', await tokenResponse.text());
      return null;
    }

    const { access_token } = await tokenResponse.json();

    const releasesResponse = await fetch(
      'https://api.spotify.com/v1/browse/new-releases?limit=20&country=NL',
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );

    if (!releasesResponse.ok) {
      console.error('Spotify releases error:', await releasesResponse.text());
      return null;
    }

    const releasesData = await releasesResponse.json();

    return {
      newReleases: releasesData.albums?.items?.map((album: any) => ({
        name: album.name,
        artists: album.artists.map((a: any) => ({ name: a.name })),
        images: album.images,
        release_date: album.release_date,
        external_urls: album.external_urls
      })) || [],
      featuredPlaylists: [],
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Spotify fetch error:', error);
    return null;
  }
}

async function fetchDiscogsData(year: number) {
  try {
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');
    
    if (!discogsToken) {
      console.log('Discogs token not configured');
      return null;
    }

    const headers = {
      'Authorization': `Discogs token=${discogsToken}`,
      'User-Agent': 'MusicScan/1.0'
    };

    const searchResponse = await fetch(
      `https://api.discogs.com/database/search?year=${year}&type=release&per_page=50&sort=want&sort_order=desc`,
      { headers }
    );

    if (!searchResponse.ok) {
      console.error('Discogs search error:', await searchResponse.text());
      return null;
    }

    const searchData = await searchResponse.json();

    const genreCount: Record<string, number> = {};
    const styleCount: Record<string, number> = {};
    
    searchData.results?.forEach((release: any) => {
      release.genre?.forEach((g: string) => {
        genreCount[g] = (genreCount[g] || 0) + 1;
      });
      release.style?.forEach((s: string) => {
        styleCount[s] = (styleCount[s] || 0) + 1;
      });
    });

    return {
      topReleases: searchData.results?.slice(0, 20).map((r: any) => ({
        title: r.title,
        year: r.year,
        genre: r.genre,
        style: r.style,
        thumb: r.thumb,
        country: r.country
      })) || [],
      vinylReleases: searchData.results?.filter((r: any) => 
        r.format?.some((f: string) => f.toLowerCase().includes('vinyl'))
      ).slice(0, 10) || [],
      genreDistribution: Object.entries(genreCount)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      styleDistribution: Object.entries(styleCount)
        .map(([style, count]) => ({ style, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      totalResults: searchData.pagination?.items || 0,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Discogs fetch error:', error);
    return null;
  }
}

async function generateAllNarratives(year: number, spotifyData: any, discogsData: any) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.log('No LOVABLE_API_KEY, using fallback narratives');
    return getFallbackNarratives(year, spotifyData, discogsData);
  }

  const discogsGenres = discogsData?.genreDistribution?.slice(0, 5) || [];

  const prompt = `Je bent een ervaren Nederlandse muziekjournalist met diepgaande kennis van de muziekindustrie. Genereer een UITGEBREID en GEDETAILLEERD muziek jaaroverzicht voor ${year}.

BELANGRIJKE INSTRUCTIES:
1. Gebruik je volledige kennis over muziekgebeurtenissen in ${year}
2. Geef CONCRETE cijfers, namen, datums waar mogelijk
3. Wees SPECIFIEK - geen vage beschrijvingen
4. Denk aan: Grammy's, Brit Awards, Edison, MTV VMA's, Billboard records
5. Denk aan overleden artiesten (In Memoriam) - wie stierven er in ${year}?
6. Denk aan virale TikTok hits, streaming records, Spotify wrapped data
7. Denk aan Nederlandse muziek: 3FM, NPO Radio 2, Top 40, Edison winnaars
8. Denk aan grote tours die plaatsvonden, festivalheadliners

CONTEXT DATA (ter referentie):
- Discogs populaire genres ${year}: ${discogsGenres.map((g: any) => g.genre).join(', ') || 'Geen data'}

Genereer JSON met deze EXACTE structuur - UITGEBREID EN GEDETAILLEERD:

{
  "global_overview": {
    "narrative": "Een uitgebreide introductie (200-300 woorden) over het muziekjaar ${year}. Beschrijf de belangrijkste trends, doorbraken, verrassingen. Noem specifieke cijfers: hoeveel albums werden uitgebracht, streaming cijfers, vinyl verkoop, etc.",
    "highlights": ["5-8 concrete hoogtepunten met cijfers/namen"]
  },
  "top_artists": [
    {
      "name": "Artiest naam",
      "achievement": "Specifieke prestatie met cijfers (bijv. '3.2 miljard streams op Spotify')",
      "genre": "Genre",
      "albums_released": 1,
      "total_streams_billions": 3.2,
      "notable_songs": ["Song 1", "Song 2"],
      "image_url": null
    }
  ],
  "top_albums": [
    {
      "artist": "Artiest",
      "title": "Album titel",
      "description": "Uitgebreide beschrijving (50-80 woorden): productie, samenwerkingen, thema's, ontvangst, verkoopcijfers",
      "release_date": "${year}-01-15",
      "label": "Platenmaatschappij",
      "weeks_on_chart": 52,
      "certifications": ["Platina NL", "Goud BE"],
      "image_url": null
    }
  ],
  "awards": {
    "narrative": "Uitgebreide beschrijving van het awards seizoen ${year} (150 woorden). Beschrijf trends, verrassingen, snubs, historische momenten.",
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
    "billboard_achievements": [
      "Record 1 met specifieke cijfers",
      "Record 2 met specifieke cijfers"
    ]
  },
  "in_memoriam": {
    "narrative": "Een respectvolle herdenking (150-200 woorden) van de artiesten, muzikanten, producers en muziekindustrie figuren die we in ${year} verloren. Beschrijf hun collectieve impact op de muziekwereld.",
    "artists": [
      {
        "name": "Overleden artiest",
        "years": "1940-${year}",
        "date_of_death": "${year}-03-15",
        "age": 83,
        "cause": "Natuurlijke oorzaak / na ziekte / etc",
        "known_for": "Uitgebreide beschrijving van hun belangrijkste werk en invloed",
        "notable_works": ["Album/Song 1", "Album/Song 2", "Album/Song 3"],
        "legacy": "Korte beschrijving van hun nalatenschap",
        "image_url": null
      }
    ]
  },
  "dutch_music": {
    "narrative": "Uitgebreide beschrijving (200 woorden) van de Nederlandse muziekscene in ${year}. Noem specifieke hitlijst posities, streaming cijfers, doorbraken, Edison winnaars, 3FM Serious Talent, NPO Radio 2 successen.",
    "highlights": [
      "Specifiek hoogtepunt met namen en cijfers",
      "Nog een hoogtepunt"
    ],
    "top_artists": ["Nederlandse artiest 1", "Nederlandse artiest 2", "Nederlandse artiest 3"],
    "edison_winners": [
      {"category": "Album Nationaal", "winner": "Artiest - Album"},
      {"category": "Song Nationaal", "winner": "Artiest - Song"}
    ],
    "top_40_records": ["Record 1", "Record 2"],
    "festivals_nl": ["Festival 1 - headliner info", "Festival 2 - headliner info"]
  },
  "streaming_viral": {
    "narrative": "Uitgebreide analyse (200 woorden) van streaming trends, TikTok virale hits, Spotify Wrapped statistieken, Apple Music trends. Noem specifieke cijfers en songs.",
    "viral_hits": [
      {"song": "Song titel", "artist": "Artiest", "platform": "TikTok/Spotify", "streams_millions": 500, "viral_reason": "Waarom viral"}
    ],
    "streaming_records": [
      "Specifiek record met cijfers",
      "Nog een record met cijfers"
    ],
    "spotify_wrapped": {
      "most_streamed_artist": "Artiest - X miljard streams",
      "most_streamed_song": "Song - X miljard streams",
      "most_streamed_album": "Album - X miljard streams"
    },
    "tiktok_trends": ["Trend 1", "Trend 2"]
  },
  "tours_festivals": {
    "narrative": "Uitgebreide beschrijving (200 woorden) van de live muziekscene in ${year}. Grootste tours met opbrengsten, belangrijkste festivals, memorabele concerten, records.",
    "biggest_tours": [
      {
        "artist": "Artiest",
        "tour_name": "Tour naam",
        "gross_millions": 500,
        "shows": 150,
        "attendance_millions": 5.2,
        "notable_venues": ["Stadium 1", "Stadium 2"]
      }
    ],
    "festivals": [
      {
        "name": "Festival naam",
        "headliners": ["Artiest 1", "Artiest 2"],
        "attendance": 80000,
        "notable_moments": "Memorabel moment"
      }
    ],
    "venue_records": ["Record 1", "Record 2"]
  },
  "genre_trends": {
    "narrative": "Diepgaande analyse (200 woorden) van genre trends in ${year}. Welke genres groeiden, welke afnamen? Fusie genres? Nieuwe subgenres? Regionale invloeden?",
    "rising_genres": [
      {"genre": "Genre naam", "growth_percentage": 25, "key_artists": ["Artiest 1", "Artiest 2"]}
    ],
    "popular_genres": [
      {"genre": "Pop", "percentage": 30, "top_songs": ["Song 1", "Song 2"]},
      {"genre": "Hip-Hop", "percentage": 25, "top_songs": ["Song 1", "Song 2"]},
      {"genre": "Rock", "percentage": 15, "top_songs": ["Song 1", "Song 2"]}
    ],
    "declining_genres": ["Genre 1", "Genre 2"],
    "fusion_trends": ["Genre 1 + Genre 2 fusie"]
  },
  "industry_stats": {
    "total_albums_released": 50000,
    "total_songs_released": 500000,
    "vinyl_sales_growth_percentage": 12,
    "streaming_revenue_billions": 15,
    "live_music_revenue_billions": 25,
    "notable_record_deals": ["Deal 1", "Deal 2"],
    "major_label_news": ["Nieuws 1", "Nieuws 2"]
  }
}

KRITIEKE EISEN:
- Geef minimaal 8-10 top artiesten met ECHTE gegevens over ${year}
- Geef minimaal 8-10 top albums die ECHT uitkwamen in ${year}
- Geef minimaal 5-10 overleden artiesten voor In Memoriam (als ze er waren in ${year})
- Geef echte Grammy/Brit/Edison winnaars van ${year}
- Alle cijfers moeten realistisch zijn voor ${year}
- Schrijf in het Nederlands
- Return ALLEEN valid JSON, geen markdown of extra tekst`;

  try {
    console.log('Calling AI for comprehensive narrative generation...');
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
            content: `Je bent een expert muziekjournalist met encyclopedische kennis van muziekgeschiedenis, charts, awards en de muziekindustrie. 
Je kent alle Grammy winnaars, Billboard records, overleden artiesten, virale hits, en streaming statistieken.
Genereer alleen valid JSON zonder markdown code fences.
Wees SPECIFIEK en GEDETAILLEERD - geen generieke of vage beschrijvingen.
Als je iets niet zeker weet voor een specifiek jaar, geef dan realistische schattingen.` 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 8000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return getFallbackNarratives(year, spotifyData, discogsData);
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
    return getFallbackNarratives(year, spotifyData, discogsData);
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
                console.log(`Found artwork for album: ${album.artist} - ${album.title}`);
              }
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (e) {
            console.error(`Error fetching artwork for ${album.title}:`, e);
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
                console.log(`Found artwork for artist: ${artist.name}`);
              }
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (e) {
            console.error(`Error fetching artwork for ${artist.name}:`, e);
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
                console.log(`Found artwork for in memoriam: ${artist.name}`);
              }
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (e) {
            console.error(`Error fetching artwork for ${artist.name}:`, e);
          }
        }
      }
    }
    
    return narratives;
  } catch (error) {
    console.error('Error fetching artwork:', error);
    return narratives;
  }
}

function getFallbackNarratives(year: number, spotifyData: any, discogsData: any) {
  const spotifyAlbums = spotifyData?.newReleases?.slice(0, 5) || [];
  const genres = discogsData?.genreDistribution?.slice(0, 5) || [];

  return {
    global_overview: {
      narrative: `${year} was een bijzonder muziekjaar met veel nieuwe releases en opkomende artiesten. Van streaming records tot vinyl revival - de muziekindustrie bleef innoveren en verrassen.`,
      highlights: ['Streaming bereikte nieuwe hoogtes', 'Vinyl verkoop bleef groeien', 'Nieuwe artiesten braken door']
    },
    top_artists: spotifyAlbums.length > 0 ? spotifyAlbums.map((album: any) => ({
      name: album.artists?.[0]?.name || 'Onbekend',
      achievement: `Nieuw album: ${album.name}`,
      genre: 'Pop',
      image_url: album.images?.[0]?.url
    })) : [
      { name: 'Taylor Swift', achievement: 'Eras Tour wereldrecord', genre: 'Pop', image_url: null },
      { name: 'Bad Bunny', achievement: 'Meest gestreamde artiest', genre: 'Reggaeton', image_url: null },
      { name: 'The Weeknd', achievement: 'Blinding Lights langste #1', genre: 'R&B', image_url: null }
    ],
    top_albums: spotifyAlbums.length > 0 ? spotifyAlbums.map((album: any) => ({
      artist: album.artists?.[0]?.name || 'Onbekend',
      title: album.name,
      description: 'Een van de meest besproken albums van het jaar',
      image_url: album.images?.[0]?.url
    })) : [
      { artist: 'Taylor Swift', title: 'The Tortured Poets Department', description: 'Recordbrekend album', image_url: null }
    ],
    awards: { 
      narrative: `De muziekprijzen van ${year} werden uitgereikt aan diverse artiesten.`, 
      grammy: [{ category: 'Album of the Year', winner: 'Wordt aangekondigd' }], 
      brit_awards: [{ category: 'British Album', winner: 'Wordt aangekondigd' }], 
      edison: [{ category: 'Album', winner: 'Wordt aangekondigd' }] 
    },
    in_memoriam: { 
      narrative: `We herdenken de artiesten die we in ${year} verloren.`, 
      artists: [] 
    },
    dutch_music: { 
      narrative: `Nederlandse muziek beleefde hoogtepunten in ${year}.`, 
      highlights: ['Nederlandse artiesten scoorden internationaal'], 
      top_artists: ['Davina Michelle', 'Snelle', 'Goldband'], 
      edison_winners: [] 
    },
    streaming_viral: { 
      narrative: `Streaming platforms domineerden de muziekconsumptie in ${year}.`, 
      viral_hits: ['TikTok hits blijven doorbreken'], 
      streaming_records: ['Spotify bereikte nieuwe mijlpalen'] 
    },
    tours_festivals: { 
      narrative: `Live muziek floreerde met grote tours en festivals in ${year}.`, 
      biggest_tours: [{ artist: 'Taylor Swift', tour_name: 'Eras Tour', gross: null }], 
      festivals: ['Pinkpop', 'Lowlands', 'North Sea Jazz'] 
    },
    genre_trends: {
      narrative: `De muziekgenres van ${year} lieten interessante trends zien.`,
      rising_genres: genres.length > 0 ? genres.slice(0, 3).map((g: any) => g.genre) : ['Hyperpop', 'Afrobeats'],
      popular_genres: genres.length > 0 
        ? genres.map((g: any) => ({ genre: g.genre, percentage: Math.round(g.count * 2) }))
        : [{ genre: 'Pop', percentage: 30 }, { genre: 'Hip-Hop', percentage: 25 }]
    },
    industry_stats: {
      total_albums_released: 50000,
      streaming_revenue_billions: 15,
      vinyl_sales_growth_percentage: 10
    }
  };
}
