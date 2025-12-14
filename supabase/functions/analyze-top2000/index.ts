import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANALYSIS_PROMPT = `Je bent een muziekdata-analist, cultureel historicus en AI-onderzoeker gespecialiseerd in muziekcanon, langetermijnpopulariteit en collectief stemgedrag.

Je werkt voor MusicScan, een platform waar muziek wordt benaderd als cultureel erfgoed en tijdsdocument, niet als hitlijst.

Analyseer de volgende Top 2000 data en beantwoord expliciet:
- Wat blijft?
- Wat verdwijnt?
- Wat vormt de Nederlandse muziekcanon?

ANALYSEDOMEINEN:

1. Canon & stabiliteit
- Welke nummers zijn structureel aanwezig?
- Classificeer elk nummer als: cultureel_anker, stabiele_klassieker, golfbeweging, of tijdelijk

2. Artiest-analyse
- Welke artiesten domineren structureel?
- Identificeer: Canon-artiesten, Artiesten in verval, Artiesten met cyclische herwaardering

3. Tijd & generatie
- Gemiddelde leeftijd van nummers per jaar
- Verschuivingen per decennium
- Koppel aan nostalgie en overerving van muzieksmaak

4. Genre-dynamiek
- Genre-aandeel per jaar
- Opkomende vs afnemende genres
- Identificeer genre-verzadiging, erosie, dominantie

5. Nederlandstalig vs internationaal
- Aandeel Nederlandse artiesten per jaar
- Welke Nederlandse nummers functioneren als cultureel erfgoed?

OUTPUT FORMAT (JSON):
{
  "main_narrative": "Verhalende analyse van 200-300 woorden over de Top 2000 trends",
  "key_insights": [
    {"insight": "Tekst", "category": "canon|artist|genre|dutch|decade", "importance": 1-10}
  ],
  "canon_tracks": [
    {"artist": "...", "title": "...", "classification": "cultureel_anker|stabiele_klassieker|golfbeweging|tijdelijk", "avg_position": 0, "years_present": 0, "trend": "stijgend|dalend|stabiel"}
  ],
  "dominant_artists": [
    {"artist": "...", "total_entries": 0, "unique_songs": 0, "best_position": 0, "status": "canon|in_verval|cyclisch"}
  ],
  "genre_shifts": [
    {"genre": "...", "trend": "opkomend|dalend|stabiel", "peak_year": 0, "description": "..."}
  ],
  "dutch_analysis": {
    "percentage_per_year": {},
    "cultural_icons": ["..."],
    "rising_dutch": ["..."],
    "declining_dutch": ["..."]
  },
  "decade_analysis": {
    "dominant_decade": "...",
    "nostalgia_peak": "...",
    "emerging_decades": ["..."],
    "fading_decades": ["..."]
  },
  "story_hooks": [
    {"title": "...", "description": "...", "suitable_for": ["blog", "dashboard", "poster"]}
  ]
}

REGELS:
- Schrijf in het Nederlands
- Cultureel, helder, menselijk - geen technische termen
- Verzin geen externe gebeurtenissen
- Trek alleen uitlegbare conclusies
- Genereer 10-15 key insights en 5-10 story hooks`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body (optional analysis_id to process)
    const body = await req.json().catch(() => ({}));
    const { analysis_id, force } = body;

    // Find pending analysis or use provided ID
    let analysisRecord;
    if (analysis_id) {
      const { data } = await supabase
        .from('top2000_analyses')
        .select('*')
        .eq('id', analysis_id)
        .single();
      analysisRecord = data;
    } else {
      // Find any pending analysis
      const { data } = await supabase
        .from('top2000_analyses')
        .select('*')
        .eq('main_narrative', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      analysisRecord = data;
    }

    if (!analysisRecord && !force) {
      return new Response(JSON.stringify({ message: 'No pending analysis found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all Top 2000 data
    const { data: entries, error: entriesError } = await supabase
      .from('top2000_entries')
      .select('*')
      .order('year', { ascending: true })
      .order('position', { ascending: true });

    if (entriesError) throw entriesError;

    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ error: 'No Top 2000 data found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Analyzing ${entries.length} Top 2000 entries`);

    // Get unique years
    const years = [...new Set(entries.map(e => e.year))].sort();

    // Prepare data summary for AI (limit tokens by summarizing)
    const dataSummary = prepareDataSummary(entries);

    // Call Lovable AI for analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: ANALYSIS_PROMPT },
          { role: 'user', content: `Hier is de Top 2000 data van ${years.length} jaren (${years[0]}-${years[years.length-1]}):\n\n${dataSummary}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    let analysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('Failed to parse AI analysis result');
    }

    const generationTime = Date.now() - startTime;

    // Update or create analysis record
    const updateData = {
      analysis_year: new Date().getFullYear(),
      years_covered: years,
      main_narrative: analysisResult.main_narrative,
      key_insights: analysisResult.key_insights,
      canon_tracks: analysisResult.canon_tracks,
      dominant_artists: analysisResult.dominant_artists,
      genre_shifts: analysisResult.genre_shifts,
      dutch_analysis: analysisResult.dutch_analysis,
      decade_analysis: analysisResult.decade_analysis,
      story_hooks: analysisResult.story_hooks,
      generation_time_ms: generationTime,
      updated_at: new Date().toISOString(),
    };

    if (analysisRecord) {
      await supabase
        .from('top2000_analyses')
        .update(updateData)
        .eq('id', analysisRecord.id);
    } else {
      await supabase
        .from('top2000_analyses')
        .insert(updateData);
    }

    console.log(`Analysis completed in ${generationTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      years_analyzed: years.length,
      entries_analyzed: entries.length,
      generation_time_ms: generationTime,
      analysis: analysisResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-top2000:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function prepareDataSummary(entries: any[]): string {
  // Group by year
  const byYear: Record<number, any[]> = {};
  entries.forEach(e => {
    if (!byYear[e.year]) byYear[e.year] = [];
    byYear[e.year].push(e);
  });

  // Create summary with key statistics
  const years = Object.keys(byYear).map(Number).sort();
  
  let summary = `## Dataset Overview\n`;
  summary += `Jaren: ${years.join(', ')}\n`;
  summary += `Totaal entries: ${entries.length}\n\n`;

  // Track presence across years
  const trackPresence: Record<string, { years: number[], positions: number[], artist: string, title: string }> = {};
  
  entries.forEach(e => {
    const key = `${e.artist}|||${e.title}`;
    if (!trackPresence[key]) {
      trackPresence[key] = { years: [], positions: [], artist: e.artist, title: e.title };
    }
    trackPresence[key].years.push(e.year);
    trackPresence[key].positions.push(e.position);
  });

  // Most stable tracks (present in most years)
  const stableTracks = Object.values(trackPresence)
    .sort((a, b) => b.years.length - a.years.length)
    .slice(0, 100);

  summary += `## Meest stabiele nummers (top 100):\n`;
  stableTracks.forEach((t, i) => {
    const avgPos = Math.round(t.positions.reduce((a, b) => a + b, 0) / t.positions.length);
    summary += `${i + 1}. ${t.artist} - ${t.title} | ${t.years.length} jaar | gem. positie: ${avgPos}\n`;
  });

  // Artist statistics
  const artistStats: Record<string, { entries: number, songs: Set<string>, bestPos: number }> = {};
  entries.forEach(e => {
    if (!artistStats[e.artist]) {
      artistStats[e.artist] = { entries: 0, songs: new Set(), bestPos: 2001 };
    }
    artistStats[e.artist].entries++;
    artistStats[e.artist].songs.add(e.title);
    artistStats[e.artist].bestPos = Math.min(artistStats[e.artist].bestPos, e.position);
  });

  const topArtists = Object.entries(artistStats)
    .map(([artist, stats]) => ({ artist, ...stats, songs: stats.songs.size }))
    .sort((a, b) => b.entries - a.entries)
    .slice(0, 50);

  summary += `\n## Top 50 artiesten:\n`;
  topArtists.forEach((a, i) => {
    summary += `${i + 1}. ${a.artist} | ${a.entries} entries | ${a.songs} nummers | beste: #${a.bestPos}\n`;
  });

  // Per year top 10
  summary += `\n## Top 10 per jaar:\n`;
  years.forEach(year => {
    summary += `\n### ${year}:\n`;
    byYear[year].slice(0, 10).forEach(e => {
      summary += `${e.position}. ${e.artist} - ${e.title}\n`;
    });
  });

  // Genre distribution if available
  const genreCounts: Record<string, number> = {};
  entries.forEach(e => {
    if (e.genres) {
      e.genres.forEach((g: string) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    }
  });

  if (Object.keys(genreCounts).length > 0) {
    summary += `\n## Genre verdeling:\n`;
    Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .forEach(([genre, count]) => {
        summary += `${genre}: ${count}\n`;
      });
  }

  // Dutch artists
  const dutchEntries = entries.filter(e => 
    e.country?.toLowerCase() === 'netherlands' || 
    e.country?.toLowerCase() === 'nederland' ||
    e.country?.toLowerCase() === 'nl'
  );
  
  summary += `\n## Nederlandse artiesten:\n`;
  summary += `Totaal Nederlandse entries: ${dutchEntries.length} (${Math.round(dutchEntries.length / entries.length * 100)}%)\n`;

  return summary;
}
