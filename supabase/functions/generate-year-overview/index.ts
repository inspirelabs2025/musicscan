import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// PERPLEXITY API - Real-time web search data
// ============================================
async function fetchPerplexityMusicData(year: number, apiKey: string): Promise<Record<string, string>> {
  console.log(`🔍 Fetching Perplexity data for ${year}...`);
  
  const queries = [
    { key: 'grammy_awards', query: `Grammy Awards ${year} complete list of winners Album of the Year Record of the Year Song of the Year Best New Artist all categories` },
    { key: 'in_memoriam', query: `Famous musicians singers artists producers who died in ${year} complete list with exact dates ages and causes of death` },
    { key: 'top_albums', query: `Best selling and most critically acclaimed albums released in ${year} with sales figures chart positions and certifications` },
    { key: 'top_tours', query: `Highest grossing concert tours ${year} revenue attendance figures Billboard Pollstar rankings` },
    { key: 'viral_hits', query: `TikTok viral songs ${year} Spotify streaming records broken most streamed songs artists ${year}` },
    { key: 'dutch_music', query: `Nederlandse muziek ${year} Edison Awards winnaars Top 40 hits Dutch artists albums releases succes` },
    { key: 'festivals', query: `Major music festivals ${year} Coachella Glastonbury Pinkpop Lowlands headliners highlights attendance` },
    { key: 'industry_stats', query: `Music industry statistics ${year} streaming revenue vinyl sales growth market size IFPI RIAA` }
  ];

  const results: Record<string, string> = {};
  
  for (const { key, query } of queries) {
    try {
      console.log(`  📡 Perplexity: ${key}`);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            { role: 'system', content: 'You are a music industry researcher. Provide detailed, factual information with specific names, dates, numbers. Be comprehensive and accurate.' },
            { role: 'user', content: query }
          ],
          temperature: 0.1,
          max_tokens: 2000
        }),
      });

      if (response.ok) {
        const data = await response.json();
        results[key] = data.choices?.[0]?.message?.content || '';
        console.log(`  ✅ ${key}: ${results[key].length} chars`);
      } else {
        console.warn(`  ⚠️ Perplexity ${key} failed: ${response.status}`);
        results[key] = '';
      }
      
      await delay(1500); // Rate limiting
    } catch (error) {
      console.error(`  ❌ Perplexity ${key} error:`, error);
      results[key] = '';
    }
  }
  
  return results;
}

// ============================================
// SPOTIFY API - Artist/Album data & artwork
// ============================================
async function fetchSpotifyData(year: number, clientId: string, clientSecret: string): Promise<any> {
  console.log(`🎵 Fetching Spotify data for ${year}...`);
  
  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      console.warn('⚠️ Spotify token failed');
      return null;
    }

    const { access_token } = await tokenResponse.json();
    
    // Search albums from specific year
    const albumsResponse = await fetch(
      `https://api.spotify.com/v1/search?q=year:${year}&type=album&limit=50&market=NL`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );
    
    const albumsData = albumsResponse.ok ? await albumsResponse.json() : null;
    
    // Search artists 
    const artistsResponse = await fetch(
      `https://api.spotify.com/v1/search?q=year:${year}&type=artist&limit=30&market=NL`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );
    
    const artistsData = artistsResponse.ok ? await artistsResponse.json() : null;
    
    const albums = albumsData?.albums?.items?.map((a: any) => ({
      name: a.name,
      artist: a.artists?.[0]?.name,
      release_date: a.release_date,
      image_url: a.images?.[0]?.url
    })) || [];
    
    const artists = artistsData?.artists?.items?.map((a: any) => ({
      name: a.name,
      genres: a.genres,
      popularity: a.popularity,
      image_url: a.images?.[0]?.url
    })) || [];
    
    console.log(`  ✅ Spotify: ${albums.length} albums, ${artists.length} artists`);
    
    return { albums, artists, access_token };
  } catch (error) {
    console.error('❌ Spotify error:', error);
    return null;
  }
}

// ============================================
// DISCOGS API - Vinyl & marketplace data
// ============================================
async function fetchDiscogsYearData(year: number, token: string): Promise<any> {
  console.log(`💿 Fetching Discogs data for ${year}...`);
  
  try {
    const searchUrl = `https://api.discogs.com/database/search?year=${year}&type=release&per_page=100&sort=have&sort_order=desc`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Discogs token=${token}`,
        'User-Agent': 'MusicScan/1.0'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ Discogs search failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    const genreCounts: Record<string, number> = {};
    const formatCounts: Record<string, number> = {};
    const labels: Record<string, number> = {};
    
    const releases = data.results || [];
    
    releases.forEach((r: any) => {
      r.genre?.forEach((g: string) => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
      r.format?.forEach((f: string) => { formatCounts[f] = (formatCounts[f] || 0) + 1; });
      r.label?.forEach((l: string) => { labels[l] = (labels[l] || 0) + 1; });
    });
    
    const sortedGenres = Object.entries(genreCounts).sort(([,a], [,b]) => b - a).slice(0, 10);
    
    const topReleases = releases.slice(0, 20).map((r: any) => ({
      title: r.title,
      year: r.year,
      genre: r.genre,
      format: r.format,
      label: r.label?.[0],
      cover_image: r.cover_image
    }));
    
    const result = {
      total_releases: data.pagination?.items || releases.length,
      genre_distribution: sortedGenres,
      format_breakdown: formatCounts,
      top_labels: Object.entries(labels).sort(([,a], [,b]) => b - a).slice(0, 10),
      top_releases: topReleases,
      vinyl_count: (formatCounts['Vinyl'] || 0) + (formatCounts['LP'] || 0),
      cd_count: formatCounts['CD'] || 0
    };
    
    console.log(`  ✅ Discogs: ${result.total_releases} total releases`);
    return result;
  } catch (error) {
    console.error('❌ Discogs error:', error);
    return null;
  }
}

// ============================================
// YOUTUBE API - Top music videos
// ============================================
async function fetchYouTubeData(year: number, apiKey: string): Promise<any> {
  console.log(`📺 Fetching YouTube data for ${year}...`);
  
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=best+music+${year}+official+video&type=video&videoCategoryId=10&maxResults=15&order=viewCount&key=${apiKey}`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.warn(`⚠️ YouTube search failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    const videos = data.items?.map((v: any) => ({
      title: v.snippet?.title,
      channel: v.snippet?.channelTitle,
      video_id: v.id?.videoId,
      thumbnail: v.snippet?.thumbnails?.high?.url
    })) || [];
    
    console.log(`  ✅ YouTube: ${videos.length} videos`);
    return { videos };
  } catch (error) {
    console.error('❌ YouTube error:', error);
    return null;
  }
}

// ============================================
// AI AGGREGATION - Combine all data sources
// ============================================
async function generateYearOverviewWithAI(
  year: number,
  perplexityData: Record<string, string> | null,
  spotifyData: any,
  discogsData: any,
  youtubeData: any,
  apiKey: string
): Promise<any> {
  console.log(`🤖 Generating AI overview with collected data...`);
  
  const prompt = `Je bent een Nederlandse muziekjournalist die een UITGEBREID jaaroverzicht voor ${year} samenstelt.

KRITIEK: Gebruik ALLEEN de onderstaande ECHTE DATA die is verzameld uit betrouwbare bronnen. Verzin GEEN informatie.

=== PERPLEXITY ZOEKRESULTATEN (REAL-TIME WEB DATA) ===

**Grammy Awards ${year}:**
${perplexityData?.grammy_awards || 'Geen data beschikbaar'}

**In Memoriam - Overleden Artiesten ${year}:**
${perplexityData?.in_memoriam || 'Geen data beschikbaar'}

**Top Albums ${year}:**
${perplexityData?.top_albums || 'Geen data beschikbaar'}

**Grootste Tours ${year}:**
${perplexityData?.top_tours || 'Geen data beschikbaar'}

**Viral Hits & Streaming Records:**
${perplexityData?.viral_hits || 'Geen data beschikbaar'}

**Nederlandse Muziek ${year}:**
${perplexityData?.dutch_music || 'Geen data beschikbaar'}

**Festivals ${year}:**
${perplexityData?.festivals || 'Geen data beschikbaar'}

**Industrie Statistieken:**
${perplexityData?.industry_stats || 'Geen data beschikbaar'}

=== SPOTIFY DATA ===
Albums: ${JSON.stringify(spotifyData?.albums?.slice(0, 15) || [])}
Artiesten: ${JSON.stringify(spotifyData?.artists?.slice(0, 15) || [])}

=== DISCOGS DATA (VINYL & PHYSICAL MEDIA) ===
Totaal Releases: ${discogsData?.total_releases || 'Onbekend'}
Genre Verdeling: ${JSON.stringify(discogsData?.genre_distribution || [])}
Vinyl Releases: ${discogsData?.vinyl_count || 'Onbekend'}
CD Releases: ${discogsData?.cd_count || 'Onbekend'}
Top Labels: ${JSON.stringify(discogsData?.top_labels || [])}

=== YOUTUBE DATA ===
Top Muziekvideo's: ${JSON.stringify(youtubeData?.videos?.slice(0, 10) || [])}

---

TAAK: Genereer een VOLLEDIG JSON object. Gebruik UITSLUITEND echte data uit bovenstaande bronnen.

Retourneer ALLEEN valid JSON (geen markdown, geen \`\`\`):

{
  "global_overview": {
    "narrative": "Uitgebreide Nederlandse samenvatting van muziekjaar ${year} (400-600 woorden). Beschrijf de belangrijkste events, trends, doorbraken met echte cijfers.",
    "highlights": ["8-12 specifieke hoogtepunten met namen en cijfers"]
  },
  "top_artists": [
    {
      "name": "Echte artiest uit de data",
      "achievement": "Specifieke prestatie uit ${year} met cijfers",
      "genre": "Genre",
      "total_streams_billions": number of null,
      "notable_songs": ["Echte hits"],
      "image_url": "Spotify URL indien in data"
    }
  ],
  "top_albums": [
    {
      "artist": "Artiest",
      "title": "Album",
      "description": "Beschrijving 60-100 woorden",
      "release_date": "YYYY-MM-DD",
      "label": "Label",
      "certifications": ["Platina"],
      "image_url": "URL indien beschikbaar"
    }
  ],
  "awards": {
    "narrative": "Beschrijving awards seizoen ${year} (150-200 woorden)",
    "grammy": [{"category": "Album of the Year", "winner": "Artiest - Album", "other_nominees": []}],
    "brit_awards": [],
    "edison": [],
    "mtv_vma": []
  },
  "in_memoriam": {
    "narrative": "Respectvolle herdenking (150-200 woorden)",
    "artists": [
      {
        "name": "Naam",
        "years": "1950-${year}",
        "date_of_death": "YYYY-MM-DD",
        "age": 75,
        "cause": "Oorzaak indien bekend",
        "known_for": "Belangrijkste werk",
        "notable_works": ["Werken"],
        "image_url": null
      }
    ]
  },
  "dutch_music": {
    "narrative": "Nederlandse muziekscene ${year} (200 woorden)",
    "highlights": ["NL hoogtepunten"],
    "top_artists": ["Nederlandse artiesten"],
    "edison_winners": []
  },
  "streaming_viral": {
    "narrative": "Streaming en viral trends ${year} (200 woorden)",
    "viral_hits": [{"song": "Song", "artist": "Artiest", "platform": "TikTok", "streams_millions": 500}],
    "streaming_records": ["Records"],
    "spotify_wrapped": {"most_streamed_artist": "", "most_streamed_song": ""}
  },
  "tours_festivals": {
    "narrative": "Live muziek ${year} (200 woorden)",
    "biggest_tours": [{"artist": "Artiest", "tour_name": "Tour", "gross_millions": 500, "shows": 150}],
    "festivals": [{"name": "Festival", "headliners": ["Artiesten"], "attendance": 80000}]
  },
  "genre_trends": {
    "narrative": "Genre trends ${year} (150 woorden)",
    "rising_genres": [{"genre": "Genre", "growth_percentage": 25}],
    "popular_genres": [{"genre": "Pop", "percentage": 30}]
  },
  "industry_stats": {
    "total_albums_released": ${discogsData?.total_releases || 'null'},
    "vinyl_sales_growth_percentage": number,
    "streaming_revenue_billions": number,
    "live_music_revenue_billions": number
  }
}

KRITIEK:
- Minimaal 10 top artiesten uit de ECHTE data
- Minimaal 10 top albums uit de ECHTE data  
- Alle Grammy/awards winnaars uit de Perplexity data
- Alle overleden artiesten uit de Perplexity data
- Schrijf in het Nederlands
- Return ALLEEN valid JSON`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Je bent een expert muziekjournalist. Genereer ALLEEN valid JSON zonder markdown. Gebruik uitsluitend de aangeleverde data.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 12000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI generation failed: ${response.status}`);
  }

  const aiData = await response.json();
  let content = aiData.choices?.[0]?.message?.content || '';

  // Parse JSON
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  console.log('AI response length:', content.length);
  
  const overview = JSON.parse(content);
  return overview;
}

// ============================================
// FETCH ARTWORK FOR AI-GENERATED CONTENT
// ============================================
async function enrichWithArtwork(narratives: any, spotifyToken: string | null): Promise<any> {
  if (!spotifyToken) return narratives;
  
  console.log('🖼️ Enriching with Spotify artwork...');
  
  try {
    // Enrich top_artists
    if (narratives.top_artists?.length) {
      for (let i = 0; i < Math.min(narratives.top_artists.length, 10); i++) {
        const artist = narratives.top_artists[i];
        if (artist.name && !artist.image_url) {
          try {
            const query = encodeURIComponent(artist.name);
            const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`, {
              headers: { 'Authorization': `Bearer ${spotifyToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.artists?.items?.[0]?.images?.[0]?.url) {
                narratives.top_artists[i].image_url = data.artists.items[0].images[0].url;
              }
            }
            await delay(100);
          } catch (e) { /* ignore */ }
        }
      }
    }
    
    // Enrich top_albums
    if (narratives.top_albums?.length) {
      for (let i = 0; i < Math.min(narratives.top_albums.length, 10); i++) {
        const album = narratives.top_albums[i];
        if (album.artist && album.title && !album.image_url) {
          try {
            const query = encodeURIComponent(`album:${album.title} artist:${album.artist}`);
            const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`, {
              headers: { 'Authorization': `Bearer ${spotifyToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.albums?.items?.[0]?.images?.[0]?.url) {
                narratives.top_albums[i].image_url = data.albums.items[0].images[0].url;
              }
            }
            await delay(100);
          } catch (e) { /* ignore */ }
        }
      }
    }
    
    // Enrich in_memoriam
    if (narratives.in_memoriam?.artists?.length) {
      for (let i = 0; i < Math.min(narratives.in_memoriam.artists.length, 10); i++) {
        const artist = narratives.in_memoriam.artists[i];
        if (artist.name && !artist.image_url) {
          try {
            const query = encodeURIComponent(artist.name);
            const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`, {
              headers: { 'Authorization': `Bearer ${spotifyToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.artists?.items?.[0]?.images?.[0]?.url) {
                narratives.in_memoriam.artists[i].image_url = data.artists.items[0].images[0].url;
              }
            }
            await delay(100);
          } catch (e) { /* ignore */ }
        }
      }
    }
    
    console.log('  ✅ Artwork enrichment complete');
  } catch (error) {
    console.error('Artwork enrichment error:', error);
  }
  
  return narratives;
}

// ============================================
// MAIN HANDLER
// ============================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { year = new Date().getFullYear(), regenerate = false } = await req.json();
    
    if (year < 2000 || year > new Date().getFullYear() + 1) {
      throw new Error('Invalid year parameter');
    }

    console.log(`🎵 Starting Year Overview generation for ${year} (regenerate: ${regenerate})...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (unless regenerate)
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

    // Get API keys
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID');
    const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('📊 Fetching data from multiple sources...');
    console.log(`  - Perplexity: ${PERPLEXITY_API_KEY ? 'configured' : 'NOT configured'}`);
    console.log(`  - Spotify: ${SPOTIFY_CLIENT_ID ? 'configured' : 'NOT configured'}`);
    console.log(`  - Discogs: ${DISCOGS_TOKEN ? 'configured' : 'NOT configured'}`);
    console.log(`  - YouTube: ${YOUTUBE_API_KEY ? 'configured' : 'NOT configured'}`);

    // Fetch from all sources
    const [perplexityData, spotifyData, discogsData, youtubeData] = await Promise.all([
      PERPLEXITY_API_KEY ? fetchPerplexityMusicData(year, PERPLEXITY_API_KEY) : null,
      (SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET) ? fetchSpotifyData(year, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET) : null,
      DISCOGS_TOKEN ? fetchDiscogsYearData(year, DISCOGS_TOKEN) : null,
      YOUTUBE_API_KEY ? fetchYouTubeData(year, YOUTUBE_API_KEY) : null
    ]);

    console.log('📊 Data collection complete');

    // Generate overview with AI
    let narratives = await generateYearOverviewWithAI(
      year,
      perplexityData,
      spotifyData,
      discogsData,
      youtubeData,
      LOVABLE_API_KEY
    );

    // Enrich with artwork
    narratives = await enrichWithArtwork(narratives, spotifyData?.access_token || null);

    // Prepare cache data
    const cacheData = {
      year,
      filter_hash: 'default',
      data_points: { spotify: spotifyData, discogs: discogsData, youtube: youtubeData },
      generated_narratives: narratives,
      sources: {
        perplexity: !!perplexityData,
        spotify: !!spotifyData,
        discogs: !!discogsData,
        youtube: !!youtubeData
      },
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Save to cache
    const { error: upsertError } = await supabase
      .from('year_overview_cache')
      .upsert(cacheData, { onConflict: 'year,filter_hash' });

    if (upsertError) {
      console.error('Cache upsert error:', upsertError);
    }

    console.log(`✅ Year Overview for ${year} generated successfully!`);

    return new Response(JSON.stringify(cacheData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error generating year overview:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
