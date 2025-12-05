import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MONTH_NAMES_NL = [
  '', 'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'
];

interface MonthStatistics {
  total_streams_billions?: number;
  top_streamed_song?: string;
  top_streamed_song_streams?: string;
  top_streamed_artist?: string;
  top_streamed_artist_listeners?: string;
  vinyl_sales_growth?: string;
  concert_revenue_millions?: number;
  tickets_sold?: string;
  tiktok_viral_songs?: number;
  new_albums_released?: number;
  grammy_nominations?: number;
}

interface MonthData {
  releases: any[];
  news: any[];
  stories: any[];
  in_memoriam: any[];
  concerts: any[];
  streaming: any[];
  awards: any[];
  dutch_music: any[];
  statistics: MonthStatistics;
}

// ============================================
// PERPLEXITY API - Real-time web search
// ============================================
async function fetchPerplexityMonthData(year: number, month: number, monthName: string, apiKey: string): Promise<Record<string, string>> {
  console.log(`🔍 Fetching Perplexity data for ${monthName} ${year}...`);
  
  const queries = [
    { 
      key: 'releases', 
      query: `Most important new music album releases ${monthName} ${year}. Include artist name, album title, release date, label, genre, first week sales numbers, chart positions (Billboard 200 position, UK Albums position), streaming numbers in first week. List at least 15 major releases with specific numbers.` 
    },
    { 
      key: 'news', 
      query: `Music industry news headlines ${monthName} ${year}. Major announcements, record deals with dollar amounts, collaborations, controversies, streaming milestones with specific numbers, label news. List at least 10 significant news items with concrete figures.` 
    },
    { 
      key: 'stories', 
      query: `Special music stories and remarkable events ${monthName} ${year}. Reunions, comebacks, viral moments, surprise releases, record-breaking achievements with specific numbers, unique collaborations.` 
    },
    { 
      key: 'in_memoriam', 
      query: `Musicians singers songwriters producers who died ${monthName} ${year}. Include exact date, age, cause of death if known, what they were famous for, career statistics (albums sold, awards won). Complete list.` 
    },
    { 
      key: 'concerts', 
      query: `Major concerts tours festivals ${monthName} ${year}. Include artist/band, venue, city, dates, exact attendance figures, ticket revenue in dollars, ticket prices. Notable performances with specific numbers.` 
    },
    { 
      key: 'streaming', 
      query: `Spotify Apple Music streaming records charts ${monthName} ${year}. Most streamed songs with exact stream counts, artists with monthly listener numbers, albums with first week streams. New records broken with specific numbers. Global chart positions. Include: total streams for top songs, monthly listeners for top artists, playlist additions.` 
    },
    { 
      key: 'awards', 
      query: `Music awards ceremonies nominations winners ${monthName} ${year}. Grammy nominations count per artist, AMA winners, MTV awards, Edison awards, any music awards that happened this month. Include number of nominations and wins per artist.` 
    },
    { 
      key: 'dutch_music', 
      query: `Nederlandse muziek nieuws ${monthName} ${year}. Dutch Top 40 positions with weeks at #1, 538 Hitzone chart positions, Nederlandse artiesten streaming cijfers, Edison nominaties aantallen, concerten Nederland met bezoekersaantallen, Nederlandse releases met verkoopcijfers.` 
    },
    {
      key: 'statistics',
      query: `Music industry statistics ${monthName} ${year}. Provide specific numbers for: total global streams on Spotify (in billions), most streamed song with exact stream count, most streamed artist with monthly listeners, vinyl/physical sales percentage growth, total concert ticket revenue (in millions USD), total concert tickets sold globally, TikTok viral songs count, number of new albums released by major labels, Grammy nominations total. Only include verified statistics with exact numbers.`
    }
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
            { 
              role: 'system', 
              content: `You are a music industry researcher specializing in ${monthName} ${year}. Provide detailed, factual information with specific names, dates, and numbers. Format your response as structured data that can be parsed. Be comprehensive and include as many items as possible.` 
            },
            { role: 'user', content: query }
          ],
          temperature: 0.1,
          max_tokens: 3000
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
// GEMINI PRO - Structured data extraction
// ============================================
async function extractStructuredData(rawData: Record<string, string>, year: number, month: number, monthName: string, apiKey: string): Promise<MonthData> {
  console.log(`🎯 Extracting structured data with Gemini Pro...`);
  
  const result: MonthData = {
    releases: [],
    news: [],
    stories: [],
    in_memoriam: [],
    concerts: [],
    streaming: [],
    awards: [],
    dutch_music: [],
    statistics: {}
  };
  
  // Extract releases
  if (rawData.releases) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'user', 
              content: `Extract album releases from this text and return as JSON array. Each item should have: artist, album, release_date, label, genre, description.

Text:
${rawData.releases}

Return ONLY valid JSON array, no markdown.` 
            }
          ],
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result.releases = JSON.parse(cleaned);
        console.log(`  ✅ Releases: ${result.releases.length} items`);
      }
    } catch (e) {
      console.error('  ❌ Releases extraction failed:', e);
    }
    await delay(500);
  }
  
  // Extract news
  if (rawData.news) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'user', 
              content: `Extract music news items from this text and return as JSON array. Each item should have: title, date, summary, category (one of: industry, artist, streaming, legal, collaboration).

Text:
${rawData.news}

Return ONLY valid JSON array, no markdown.` 
            }
          ],
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result.news = JSON.parse(cleaned);
        console.log(`  ✅ News: ${result.news.length} items`);
      }
    } catch (e) {
      console.error('  ❌ News extraction failed:', e);
    }
    await delay(500);
  }
  
  // Extract in memoriam
  if (rawData.in_memoriam) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'user', 
              content: `Extract deceased musicians from this text and return as JSON array. Each item should have: name, age, date (format: DD ${monthName} ${year}), cause (if known), known_for.

Text:
${rawData.in_memoriam}

Return ONLY valid JSON array, no markdown.` 
            }
          ],
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result.in_memoriam = JSON.parse(cleaned);
        console.log(`  ✅ In Memoriam: ${result.in_memoriam.length} items`);
      }
    } catch (e) {
      console.error('  ❌ In Memoriam extraction failed:', e);
    }
    await delay(500);
  }
  
  // Extract concerts
  if (rawData.concerts) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'user', 
              content: `Extract concerts/tours from this text and return as JSON array. Each item should have: artist, tour_name, venue, city, date, attendance, revenue (if known).

Text:
${rawData.concerts}

Return ONLY valid JSON array, no markdown.` 
            }
          ],
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result.concerts = JSON.parse(cleaned);
        console.log(`  ✅ Concerts: ${result.concerts.length} items`);
      }
    } catch (e) {
      console.error('  ❌ Concerts extraction failed:', e);
    }
    await delay(500);
  }
  
  // Extract streaming data
  if (rawData.streaming) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'user', 
              content: `Extract streaming statistics from this text and return as JSON array. Each item should have: type (record/chart/milestone), title, artist, statistic, platform.

Text:
${rawData.streaming}

Return ONLY valid JSON array, no markdown.` 
            }
          ],
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result.streaming = JSON.parse(cleaned);
        console.log(`  ✅ Streaming: ${result.streaming.length} items`);
      }
    } catch (e) {
      console.error('  ❌ Streaming extraction failed:', e);
    }
    await delay(500);
  }
  
  // Extract awards
  if (rawData.awards) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'user', 
              content: `Extract music awards from this text and return as JSON array. Each item should have: award_show, category, winner, nominees (array).

Text:
${rawData.awards}

Return ONLY valid JSON array, no markdown.` 
            }
          ],
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result.awards = JSON.parse(cleaned);
        console.log(`  ✅ Awards: ${result.awards.length} items`);
      }
    } catch (e) {
      console.error('  ❌ Awards extraction failed:', e);
    }
    await delay(500);
  }
  
  // Extract Dutch music
  if (rawData.dutch_music) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'user', 
              content: `Extract Dutch music news from this text and return as JSON array. Each item should have: type (hit/news/concert/award), title, artist, description.

Text:
${rawData.dutch_music}

Return ONLY valid JSON array, no markdown.` 
            }
          ],
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result.dutch_music = JSON.parse(cleaned);
        console.log(`  ✅ Dutch Music: ${result.dutch_music.length} items`);
      }
    } catch (e) {
      console.error('  ❌ Dutch Music extraction failed:', e);
    }
  }
  
  // Extract stories from raw data
  if (rawData.stories) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'user', 
              content: `Extract special music stories from this text and return as JSON array. Each item should have: title, date, story, artists (array), significance.

Text:
${rawData.stories}

Return ONLY valid JSON array, no markdown.` 
            }
          ],
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result.stories = JSON.parse(cleaned);
        console.log(`  ✅ Stories: ${result.stories.length} items`);
      }
    } catch (e) {
      console.error('  ❌ Stories extraction failed:', e);
    }
  }
  
  // Extract statistics
  if (rawData.statistics) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'user', 
              content: `Extract music industry statistics from this text and return as a single JSON object (not array). Include these fields if data is available:
- total_streams_billions: number (total Spotify streams in billions)
- top_streamed_song: string (name of most streamed song)
- top_streamed_song_streams: string (stream count with unit, e.g. "1.2 billion")
- top_streamed_artist: string (name of most streamed artist)  
- top_streamed_artist_listeners: string (monthly listeners with unit, e.g. "115 million")
- vinyl_sales_growth: string (percentage growth, e.g. "+12%")
- concert_revenue_millions: number (total concert revenue in millions USD)
- tickets_sold: string (total tickets sold with unit, e.g. "45 million")
- tiktok_viral_songs: number (count of viral songs)
- new_albums_released: number (count of major album releases)
- grammy_nominations: number (total Grammy nominations announced)

Text:
${rawData.statistics}

Return ONLY valid JSON object, no markdown. Use null for unknown values.` 
            }
          ],
          temperature: 0.1
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        result.statistics = JSON.parse(cleaned);
        console.log(`  ✅ Statistics extracted`);
      }
    } catch (e) {
      console.error('  ❌ Statistics extraction failed:', e);
    }
  }
  
  return result;
}

// ============================================
// GENERATE NARRATIVE
// ============================================
async function generateNarrative(data: MonthData, year: number, monthName: string, apiKey: string): Promise<string> {
  console.log(`📝 Generating narrative for ${monthName} ${year}...`);
  
  const dataContext = `
RELEASES (${data.releases.length}): ${JSON.stringify(data.releases.slice(0, 10))}
NEWS (${data.news.length}): ${JSON.stringify(data.news.slice(0, 8))}
IN MEMORIAM (${data.in_memoriam.length}): ${JSON.stringify(data.in_memoriam)}
CONCERTS (${data.concerts.length}): ${JSON.stringify(data.concerts.slice(0, 8))}
STREAMING: ${JSON.stringify(data.streaming.slice(0, 8))}
AWARDS: ${JSON.stringify(data.awards.slice(0, 8))}
DUTCH MUSIC: ${JSON.stringify(data.dutch_music.slice(0, 8))}
STORIES: ${JSON.stringify(data.stories.slice(0, 5))}
`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `Je bent een Nederlandse muziekjournalist die een boeiend maandoverzicht schrijft. Schrijf levendig, informatief en met passie voor muziek. Gebruik emoji's strategisch.` 
          },
          { 
            role: 'user', 
            content: `Schrijf een boeiend Nederlands narratief over de muziekindustrie in ${monthName} ${year}. 

Gebruik deze data:
${dataContext}

Structuur (400-600 woorden):
1. 🎵 Opening - Kernthema van de maand
2. 📀 Belangrijkste releases 
3. 📰 Grootste nieuwsitems
4. 🕯️ In Memoriam (indien van toepassing)
5. 🎤 Concerten & tours
6. 📊 Streaming highlights
7. 🇳🇱 Nederlandse muziek
8. ✨ Afsluiting

Schrijf als een echt artikel, niet als een opsomming. Verbind de onderwerpen met elkaar.` 
          }
        ],
        temperature: 0.7
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.choices?.[0]?.message?.content || '';
    }
  } catch (e) {
    console.error('Narrative generation failed:', e);
  }
  
  return '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { year, month, regenerate = false } = await req.json();
    
    if (!year || !month) {
      throw new Error('Year and month are required');
    }
    
    const monthName = MONTH_NAMES_NL[month];
    console.log(`🗓️ Generating month overview for ${monthName} ${year}...`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check cache
    if (!regenerate) {
      const { data: cached } = await supabase
        .from('month_overview_cache')
        .select('*')
        .eq('year', year)
        .eq('month', month)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (cached) {
        console.log('✅ Returning cached data');
        return new Response(JSON.stringify({
          success: true,
          data: cached,
          cached: true
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }
    
    // Get API keys
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const { data: perplexitySecret } = await supabase
      .from('app_secrets')
      .select('secret_value')
      .eq('secret_key', 'PERPLEXITY_API_KEY')
      .maybeSingle();
    
    const perplexityApiKey = perplexitySecret?.secret_value || Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('Missing LOVABLE_API_KEY');
    }
    
    // Fetch data from Perplexity
    const rawData = await fetchPerplexityMonthData(year, month, monthName, perplexityApiKey || '');
    
    // Extract structured data with Gemini
    const structuredData = await extractStructuredData(rawData, year, month, monthName, lovableApiKey);
    
    // Generate narrative
    const narrative = await generateNarrative(structuredData, year, monthName, lovableApiKey);
    
    // Prepare result
    const result = {
      year,
      month,
      month_name: monthName,
      data_points: structuredData,
      generated_narratives: {
        main: narrative,
        sections: {
          releases: `${structuredData.releases.length} belangrijke releases`,
          news: `${structuredData.news.length} nieuwsitems`,
          in_memoriam: `${structuredData.in_memoriam.length} artiesten overleden`,
          concerts: `${structuredData.concerts.length} concerten/tours`,
          streaming: `${structuredData.streaming.length} streaming items`,
          awards: `${structuredData.awards.length} awards`,
          dutch_music: `${structuredData.dutch_music.length} NL items`
        }
      },
      sources: ['perplexity', 'gemini-flash'],
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Upsert to cache
    const { error: upsertError } = await supabase
      .from('month_overview_cache')
      .upsert({
        year,
        month,
        month_name: monthName,
        data_points: structuredData,
        generated_narratives: result.generated_narratives,
        sources: result.sources,
        expires_at: result.expires_at,
        updated_at: new Date().toISOString()
      }, { onConflict: 'year,month' });
    
    if (upsertError) {
      console.error('Cache upsert error:', upsertError);
    }
    
    console.log('✅ Month overview generated successfully');
    
    return new Response(JSON.stringify({
      success: true,
      data: result,
      cached: false
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
