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

  const spotifyArtists = spotifyData?.newReleases?.map((r: any) => r.artists[0]?.name).filter(Boolean).slice(0, 10) || [];
  const spotifyAlbums = spotifyData?.newReleases?.map((r: any) => `${r.artists[0]?.name} - ${r.name}`).slice(0, 5) || [];
  const discogsGenres = discogsData?.genreDistribution?.slice(0, 5) || [];

  const prompt = `Je bent een Nederlandse muziekjournalist. Genereer een compleet muziek jaaroverzicht voor ${year}.

BESCHIKBARE DATA:
- Spotify nieuwe releases: ${spotifyAlbums.join(', ') || 'Geen data'}
- Populaire artiesten: ${spotifyArtists.join(', ') || 'Geen data'}
- Discogs genres: ${discogsGenres.map((g: any) => g.genre).join(', ') || 'Geen data'}

Genereer JSON met deze EXACTE structuur (gebruik je eigen kennis over muziek in ${year}):

{
  "global_overview": {
    "narrative": "Een boeiende introductie over het muziekjaar ${year} (max 150 woorden)",
    "highlights": ["highlight 1", "highlight 2", "highlight 3"]
  },
  "top_artists": [
    {"name": "Artiest", "achievement": "Belangrijkste prestatie", "genre": "Genre", "image_url": null}
  ],
  "top_albums": [
    {"artist": "Artiest", "title": "Album", "description": "Korte beschrijving", "image_url": null}
  ],
  "awards": {
    "narrative": "Korte tekst over de awards van ${year}",
    "grammy": [{"category": "Album of the Year", "winner": "Artiest - Album"}],
    "brit_awards": [{"category": "British Album", "winner": "Artiest"}],
    "edison": [{"category": "Album", "winner": "Nederlandse artiest"}]
  },
  "in_memoriam": {
    "narrative": "Eerbetoon aan verloren artiesten",
    "artists": [{"name": "Artiest", "years": "1950-${year}", "known_for": "Bekend van", "image_url": null}]
  },
  "dutch_music": {
    "narrative": "Nederlandse muziek hoogtepunten",
    "highlights": ["highlight 1", "highlight 2"],
    "top_artists": ["Artiest 1", "Artiest 2"],
    "edison_winners": [{"category": "Pop", "winner": "Artiest"}]
  },
  "streaming_viral": {
    "narrative": "Streaming en virale hits",
    "viral_hits": ["Song 1", "Song 2"],
    "streaming_records": ["Record 1", "Record 2"]
  },
  "tours_festivals": {
    "narrative": "Grootste tours en festivals",
    "biggest_tours": [{"artist": "Artiest", "tour_name": "Tour naam", "gross": null}],
    "festivals": ["Festival 1", "Festival 2"]
  },
  "genre_trends": {
    "narrative": "Genre analyse van ${year}",
    "rising_genres": ["Genre 1", "Genre 2"],
    "popular_genres": [{"genre": "Pop", "percentage": 30}]
  }
}

BELANGRIJK:
- Schrijf in het Nederlands
- Gebruik GEEN AI terminologie
- Geef minimaal 5 top artiesten, 5 top albums, 3-5 awards per categorie
- Vul aan met je eigen kennis over ${year}
- Return ALLEEN valid JSON, geen extra tekst`;

  try {
    console.log('Calling AI for narrative generation...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Je bent een expert muziekjournalist. Genereer alleen valid JSON zonder markdown code fences.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000
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
    return narratives;
  } catch (error) {
    console.error('AI narrative generation error:', error);
    return getFallbackNarratives(year, spotifyData, discogsData);
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
      narrative: `De genreverdeling in ${year} liet interessante verschuivingen zien.`,
      rising_genres: genres.length > 0 ? genres.slice(0, 2).map((g: any) => g.genre) : ['Latin', 'K-Pop'],
      popular_genres: genres.length > 0 
        ? genres.map((g: any) => ({ genre: g.genre, percentage: Math.round((g.count / 50) * 100) }))
        : [{ genre: 'Pop', percentage: 35 }, { genre: 'Hip-Hop', percentage: 25 }, { genre: 'Rock', percentage: 20 }]
    }
  };
}
