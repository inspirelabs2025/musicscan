import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface AwardItem {
  category: string;
  winner: string;
  other_nominees?: string[];
}

// ============================================
// DIRECT AWARD PARSERS - Using Tool Calling
// ============================================

async function parseGrammyAwardsDirect(year: number, apiKey: string): Promise<AwardItem[]> {
  console.log(`🏆 Parsing Grammy Awards ${year} directly with tool calling...`);
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'user', content: `Welke artiesten wonnen de Grammy Awards ${year}? Geef alle belangrijke categorieën.` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'report_grammy_winners',
            description: 'Report all Grammy Award winners for the given year',
            parameters: {
              type: 'object',
              properties: {
                winners: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string', description: 'Award category name' },
                      winner: { type: 'string', description: 'Winner name and work title' },
                      other_nominees: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['category', 'winner']
                  }
                }
              },
              required: ['winners']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'report_grammy_winners' } }
      })
    });

    if (!response.ok) {
      console.error(`Grammy API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log(`  ✅ Grammy Awards: ${parsed.winners?.length || 0} categories parsed`);
      return parsed.winners || [];
    }
    
    return [];
  } catch (error) {
    console.error('Grammy parsing error:', error);
    return [];
  }
}

async function parseBritAwardsDirect(year: number, apiKey: string): Promise<AwardItem[]> {
  console.log(`🏆 Parsing Brit Awards ${year} directly with tool calling...`);
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'user', content: `Welke artiesten wonnen de Brit Awards ${year}? Geef alle categorieën met winnaars.` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'report_brit_winners',
            description: 'Report all Brit Award winners for the given year',
            parameters: {
              type: 'object',
              properties: {
                winners: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string', description: 'Award category name' },
                      winner: { type: 'string', description: 'Winner name' },
                      other_nominees: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['category', 'winner']
                  }
                }
              },
              required: ['winners']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'report_brit_winners' } }
      })
    });

    if (!response.ok) {
      console.error(`Brit Awards API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log(`  ✅ Brit Awards: ${parsed.winners?.length || 0} categories parsed`);
      return parsed.winners || [];
    }
    
    return [];
  } catch (error) {
    console.error('Brit Awards parsing error:', error);
    return [];
  }
}

async function parseEdisonAwardsDirect(year: number, apiKey: string): Promise<AwardItem[]> {
  console.log(`🏆 Parsing Edison Awards ${year} directly with tool calling...`);
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'user', content: `Welke artiesten wonnen de Edison Awards (Nederlandse muziekprijs) ${year}? Geef alle categorieën met winnaars.` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'report_edison_winners',
            description: 'Report all Edison Award winners for the given year',
            parameters: {
              type: 'object',
              properties: {
                winners: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string', description: 'Award category name (Pop, Rock, Hip-Hop, etc.)' },
                      winner: { type: 'string', description: 'Winner name and album' },
                      other_nominees: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['category', 'winner']
                  }
                }
              },
              required: ['winners']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'report_edison_winners' } }
      })
    });

    if (!response.ok) {
      console.error(`Edison Awards API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log(`  ✅ Edison Awards: ${parsed.winners?.length || 0} categories parsed`);
      return parsed.winners || [];
    }
    
    return [];
  } catch (error) {
    console.error('Edison Awards parsing error:', error);
    return [];
  }
}

// ============================================
// DIRECT AI QUERIES - Other sections
// ============================================
async function fetchDirectAIData(year: number, apiKey: string): Promise<Record<string, string>> {
  console.log(`🎯 Fetching direct AI data for ${year} with specific queries using Gemini Pro...`);
  
  const MODEL = 'google/gemini-2.5-pro';
  
  const specificQueries = [
    {
      key: 'in_memoriam',
      prompt: `Muzikanten en artiesten overleden in ${year} - VOLLEDIGE LIJST:

Geef voor elke artiest:
- Naam (leeftijd) - datum overlijden
- Bekend van: [belangrijkste werk]
- Doodsoorzaak (indien bekend)

Inclusief: rockartiesten, popsterren, country, jazz, hip-hop, electronic/DJ's, Nederlandse artiesten, producers, bandleden.

Begin direct met de lijst, geordend op overlijdensdatum. Minimaal 25 artiesten.`
    },
    {
      key: 'top_tours',
      prompt: `TOP 15 best verdienende concerttours ${year}:

Format per tour:
1. [Artiest] - [Tour Naam]: $[X] miljoen/miljard | [X] shows | [X] miljoen bezoekers

Sorteer op opbrengst, hoogste eerst. Geef concrete cijfers.`
    },
    {
      key: 'viral_hits',
      prompt: `Grootste virale hits en streaming records ${year}:

VIRAL HITS (TikTok/Reels):
1-10. [Artiest - Nummer] - [Wat maakte het viral]

SPOTIFY RECORDS ${year}:
• Meest gestreamde artiest: [naam] - [X] miljard streams
• Meest gestreamde nummer: [nummer] - [X] miljard streams
• Meest gestreamde album: [album]
• Snelst naar 1 miljard streams: [nummer]

Geef concrete cijfers waar beschikbaar.`
    },
    {
      key: 'dutch_music',
      prompt: `Nederlandse muziek ${year}:

TOP 10 NEDERLANDSE HITS ${year}:
1-10. [Artiest - Titel]

NEDERLANDSE ARTIESTEN OVERLEDEN ${year}:
[naam, leeftijd, datum, bekend van]

Geef concrete hits en informatie.`
    },
    {
      key: 'streaming_records',
      prompt: `Streaming statistieken ${year}:

SPOTIFY WRAPPED ${year}:
• #1 Meest gestreamde artiest wereldwijd: [naam] - [X] miljard streams
• #1 Meest gestreamde nummer: [artiest - titel] - [X] miljard streams
• #1 Meest gestreamde album: [artiest - album]
• Meest gestreamde nieuwe artiest: [naam]

RECORDS GEBROKEN:
• Snelst naar 1 miljard streams: [titel] in [X] dagen
• Meeste daily streams ooit: [titel] - [X] miljoen
• Langste #1 streak op Global 50: [titel] - [X] weken

INDUSTRIE CIJFERS:
• Totaal streaming omzet ${year}: $[X] miljard
• Groei t.o.v. vorig jaar: [X]%`
    },
    {
      key: 'album_releases',
      prompt: `TOP 20 belangrijkste album releases ${year}:

Format:
1. [Artiest] - "[Album]" ([releasedatum])
   Label: [naam] | Genre: [genre]
   First week: [X] verkopen/streams | Chart: #[X]
   Singles: [titels]

Mix van pop, rock, hip-hop, R&B, country, electronic.
Inclusief 2-3 Nederlandse/Europese releases.`
    }
  ];

  const results: Record<string, string> = {};
  
  for (const { key, prompt } of specificQueries) {
    try {
      console.log(`  🎯 AI Query (${MODEL}): ${key}...`);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'system',
              content: `Je bent een muziekencyclopedie met volledige kennis van ${year}. 
Geef DIRECT en FEITELIJK antwoord zonder disclaimers of "ik weet niet zeker".
Vul ALLE gevraagde categorieën in met de daadwerkelijke winnaars/informatie.
Schrijf NOOIT "nog niet bekend" - geef de echte data.`
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        results[key] = data.choices?.[0]?.message?.content || '';
        console.log(`  ✅ ${key}: ${results[key].length} chars`);
      } else {
        console.error(`  ❌ ${key} failed: ${response.status}`);
        results[key] = '';
      }
      
      await delay(800);
      
    } catch (error) {
      console.error(`  ❌ Error ${key}:`, error);
      results[key] = '';
    }
  }
  
  return results;
}

// ============================================
// PERPLEXITY API - Real-time web search data
// ============================================
async function fetchPerplexityMusicData(year: number, apiKey: string): Promise<Record<string, string>> {
  console.log(`🔍 Fetching Perplexity data for ${year}...`);
  
  const queries = [
    { key: 'in_memoriam', query: `Famous musicians singers artists who died in ${year} complete list with exact dates ages causes of death` },
    { key: 'top_albums', query: `Best selling critically acclaimed albums ${year} sales figures chart positions certifications` },
    { key: 'top_tours', query: `Highest grossing concert tours ${year} revenue attendance Billboard Pollstar` },
    { key: 'viral_hits', query: `TikTok viral songs ${year} Spotify streaming records most streamed songs artists` },
    { key: 'dutch_music', query: `Nederlandse muziek ${year} Edison Awards winnaars Top 40 hits Dutch artists succes` },
    { key: 'festivals', query: `Music festivals ${year} Coachella Glastonbury Pinkpop headliners attendance` },
    { key: 'industry_stats', query: `Music industry statistics ${year} streaming revenue vinyl sales IFPI RIAA` }
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
            { role: 'system', content: 'You are a music industry researcher. Provide detailed factual information with specific names, dates, numbers. Be comprehensive.' },
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
      
      await delay(1500);
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
    
    const albumsResponse = await fetch(
      `https://api.spotify.com/v1/search?q=year:${year}&type=album&limit=50&market=NL`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );
    
    const albumsData = albumsResponse.ok ? await albumsResponse.json() : null;
    
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
// AI AGGREGATION - Combine all data sources (without awards)
// ============================================
async function generateYearOverviewWithAI(
  year: number,
  directAIData: Record<string, string>,
  perplexityData: Record<string, string> | null,
  spotifyData: any,
  discogsData: any,
  youtubeData: any,
  apiKey: string
): Promise<any> {
  console.log(`🤖 Generating AI overview with collected data...`);
  
  const prompt = `Je bent een Nederlandse muziekjournalist die een UITGEBREID jaaroverzicht voor ${year} samenstelt.

KRITIEK: Gebruik ALLEEN de onderstaande VERZAMELDE DATA. Verzin GEEN informatie. Alle data hieronder is GEVERIFIEERD.

================================================================================
                        PRIMAIRE DATA (MEEST BETROUWBAAR)
================================================================================

=== IN MEMORIAM ${year} (OVERLEDEN ARTIESTEN) ===
${directAIData?.in_memoriam || 'Geen data'}

=== BESTE TOURS ${year} ===
${directAIData?.top_tours || 'Geen data'}

=== VIRALE HITS & STREAMING ${year} ===
${directAIData?.viral_hits || 'Geen data'}
${directAIData?.streaming_records || ''}

=== NEDERLANDSE MUZIEK ${year} ===
${directAIData?.dutch_music || 'Geen data'}

=== BELANGRIJKSTE ALBUMS ${year} ===
${directAIData?.album_releases || 'Geen data'}

================================================================================
                        AANVULLENDE BRONNEN
================================================================================

=== PERPLEXITY WEB SEARCH ===
In Memoriam: ${perplexityData?.in_memoriam?.substring(0, 500) || 'N/A'}
Tours: ${perplexityData?.top_tours?.substring(0, 500) || 'N/A'}
NL Muziek: ${perplexityData?.dutch_music?.substring(0, 500) || 'N/A'}
Industrie: ${perplexityData?.industry_stats?.substring(0, 500) || 'N/A'}

=== SPOTIFY DATA ===
Albums ${year}: ${JSON.stringify(spotifyData?.albums?.slice(0, 10) || [])}
Artiesten: ${JSON.stringify(spotifyData?.artists?.slice(0, 10) || [])}

=== DISCOGS VINYL DATA ===
Totaal Releases: ${discogsData?.total_releases || 'Onbekend'}
Genre Verdeling: ${JSON.stringify(discogsData?.genre_distribution || [])}
Vinyl: ${discogsData?.vinyl_count || '?'}, CD: ${discogsData?.cd_count || '?'}

=== YOUTUBE TOP VIDEOS ===
${JSON.stringify(youtubeData?.videos?.slice(0, 5) || [])}

================================================================================

TAAK: Genereer een UITGEBREID jaaroverzicht JSON (ZONDER awards sectie - die wordt apart afgehandeld).

Retourneer ALLEEN valid JSON (geen markdown):

{
  "global_overview": {
    "narrative": "Uitgebreide Nederlandse samenvatting (500-800 woorden) met ALLE belangrijke events en cijfers",
    "highlights": ["10-15 specifieke hoogtepunten met namen en cijfers"]
  },
  "top_artists": [
    {
      "name": "Artiest uit data",
      "achievement": "Specifieke prestatie ${year}",
      "genre": "Genre",
      "total_streams_billions": null,
      "notable_songs": ["Hits"],
      "image_url": null
    }
  ],
  "top_albums": [
    {
      "artist": "Artiest",
      "title": "Album",
      "description": "Beschrijving 80-120 woorden",
      "release_date": "YYYY-MM-DD",
      "label": "Label",
      "certifications": [],
      "image_url": null
    }
  ],
  "in_memoriam": {
    "narrative": "Respectvolle herdenking (250-300 woorden) - noem ALLE overleden artiesten",
    "artists": [
      {
        "name": "Volledige naam",
        "years": "Geboortejaar-Sterfjaar",
        "date_of_death": "YYYY-MM-DD",
        "age": 75,
        "cause": "Doodsoorzaak indien bekend",
        "known_for": "Belangrijkste werk/band",
        "notable_works": ["Bekende werken"],
        "legacy": "Korte beschrijving erfenis",
        "image_url": null
      }
    ]
  },
  "dutch_music": {
    "narrative": "Nederlandse muziekscene ${year} (250 woorden) - hits, doorbraken",
    "highlights": ["NL hoogtepunten"],
    "top_artists": ["Nederlandse artiesten ${year}"],
    "edison_winners": []
  },
  "streaming_viral": {
    "narrative": "Streaming en viral ${year} (250 woorden) met cijfers",
    "viral_hits": [{"song": "Titel", "artist": "Artiest", "platform": "TikTok", "streams_millions": 1000}],
    "streaming_records": ["Record met cijfer"],
    "spotify_wrapped": {"most_streamed_artist": "Artiest", "most_streamed_song": "Titel"}
  },
  "tours_festivals": {
    "narrative": "Live muziek ${year} (250 woorden) met opbrengsten",
    "biggest_tours": [{"artist": "Artiest", "tour_name": "Tour", "gross_millions": 500, "shows": 100, "attendance_millions": 2}],
    "festivals": [{"name": "Festival", "headliners": ["Artiesten"], "attendance": 80000}]
  },
  "genre_trends": {
    "narrative": "Genre ontwikkelingen ${year} (150 woorden)",
    "rising_genres": [{"genre": "Genre", "growth_percentage": 20}],
    "popular_genres": [{"genre": "Pop", "percentage": 30}]
  },
  "industry_stats": {
    "total_albums_released": ${discogsData?.total_releases || 'null'},
    "vinyl_releases": ${discogsData?.vinyl_count || 'null'},
    "vinyl_sales_growth_percentage": null,
    "streaming_revenue_billions": null,
    "live_music_revenue_billions": null
  }
}

KRITIEK:
- Minimaal 12 top artiesten
- Minimaal 12 top albums  
- ALLE overleden artiesten met exacte data (minimaal 15)
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
        { role: 'system', content: 'Je bent een expert muziekjournalist. Genereer UITGEBREIDE, COMPLETE content. Gebruik ALLE aangeleverde data - sla niets over. Return ALLEEN valid JSON zonder markdown codeblocks.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 16000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI generation failed: ${response.status}`);
  }

  const aiData = await response.json();
  let content = aiData.choices?.[0]?.message?.content || '';

  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  console.log('AI response length:', content.length);
  
  try {
    const overview = JSON.parse(content);
    console.log('✅ Parsed overview successfully');
    console.log(`  - Top artists: ${overview.top_artists?.length || 0}`);
    console.log(`  - Top albums: ${overview.top_albums?.length || 0}`);
    console.log(`  - In Memoriam: ${overview.in_memoriam?.artists?.length || 0}`);
    return overview;
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Content preview:', content.substring(0, 500));
    throw new Error('Failed to parse AI response as JSON');
  }
}

// ============================================
// FETCH ARTWORK FOR AI-GENERATED CONTENT
// ============================================
async function enrichWithArtwork(narratives: any, spotifyToken: string | null): Promise<any> {
  if (!spotifyToken) return narratives;
  
  console.log('🖼️ Enriching with Spotify artwork...');
  
  try {
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

    // Step 1: Fetch AWARDS directly with tool calling (NEW - bypasses second AI)
    console.log('📊 Step 1: Fetching awards DIRECTLY with tool calling...');
    const [grammyAwards, britAwards, edisonAwards] = await Promise.all([
      parseGrammyAwardsDirect(year, LOVABLE_API_KEY),
      parseBritAwardsDirect(year, LOVABLE_API_KEY),
      parseEdisonAwardsDirect(year, LOVABLE_API_KEY)
    ]);
    
    console.log(`  📋 Awards fetched: Grammy=${grammyAwards.length}, Brit=${britAwards.length}, Edison=${edisonAwards.length}`);

    // Step 2: Fetch direct AI data for other sections
    console.log('📊 Step 2: Fetching direct AI data for other sections...');
    const directAIData = await fetchDirectAIData(year, LOVABLE_API_KEY);

    // Step 3: Fetch from other sources in parallel
    console.log('📊 Step 3: Fetching from external APIs...');
    const [perplexityData, spotifyData, discogsData, youtubeData] = await Promise.all([
      PERPLEXITY_API_KEY ? fetchPerplexityMusicData(year, PERPLEXITY_API_KEY) : null,
      (SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET) ? fetchSpotifyData(year, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET) : null,
      DISCOGS_TOKEN ? fetchDiscogsYearData(year, DISCOGS_TOKEN) : null,
      YOUTUBE_API_KEY ? fetchYouTubeData(year, YOUTUBE_API_KEY) : null
    ]);

    console.log('📊 Data collection complete');

    // Step 4: Generate overview with AI (without awards - those are direct)
    let narratives = await generateYearOverviewWithAI(
      year,
      directAIData,
      perplexityData,
      spotifyData,
      discogsData,
      youtubeData,
      LOVABLE_API_KEY
    );

    // Step 5: INJECT AWARDS DIRECTLY (bypassing AI aggregation)
    console.log('📊 Step 5: Injecting directly fetched awards...');
    narratives.awards = {
      narrative: `Het awardsseizoen van ${year} bracht vele memorabele momenten. De Grammy Awards, Brit Awards en Edison Awards bekroonden het beste van de muziekindustrie.`,
      grammy: grammyAwards,
      brit_awards: britAwards,
      edison: edisonAwards,
      mtv_vma: []
    };

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
    console.log(`  - Grammy Awards: ${grammyAwards.length} categories`);
    console.log(`  - Brit Awards: ${britAwards.length} categories`);
    console.log(`  - Edison Awards: ${edisonAwards.length} categories`);

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
