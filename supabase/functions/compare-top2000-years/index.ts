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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting Top 2000 year comparison analysis');

    // Fetch all year analyses
    const { data: yearAnalyses, error: fetchError } = await supabase
      .from('top2000_year_analyses')
      .select('*')
      .order('edition_year', { ascending: true });

    if (fetchError) throw fetchError;

    if (!yearAnalyses || yearAnalyses.length < 2) {
      throw new Error('Need at least 2 year analyses to compare');
    }

    console.log(`Comparing ${yearAnalyses.length} years: ${yearAnalyses.map(y => y.edition_year).join(', ')}`);

    // Calculate trends
    const trends = {
      dutch_percentage: [] as { year: number; value: number }[],
      genre_evolution: {} as Record<string, { year: number; count: number }[]>,
      artist_type_evolution: {} as Record<string, { year: number; count: number }[]>,
      decade_shift: {} as Record<string, { year: number; count: number }[]>,
    };

    // Track consistent entries (songs that appear every year)
    const songAppearances: Record<string, number[]> = {};

    for (const analysis of yearAnalyses) {
      // Dutch percentage trend
      trends.dutch_percentage.push({
        year: analysis.edition_year,
        value: analysis.dutch_percentage || 0
      });

      // Genre evolution
      const genres = analysis.genre_distribution as Record<string, number> || {};
      for (const [genre, count] of Object.entries(genres)) {
        if (!trends.genre_evolution[genre]) {
          trends.genre_evolution[genre] = [];
        }
        trends.genre_evolution[genre].push({
          year: analysis.edition_year,
          count: count as number
        });
      }

      // Artist type evolution
      const artistTypes = analysis.artist_type_distribution as Record<string, number> || {};
      for (const [type, count] of Object.entries(artistTypes)) {
        if (!trends.artist_type_evolution[type]) {
          trends.artist_type_evolution[type] = [];
        }
        trends.artist_type_evolution[type].push({
          year: analysis.edition_year,
          count: count as number
        });
      }

      // Decade shift
      const decades = analysis.decade_distribution as Record<string, number> || {};
      for (const [decade, count] of Object.entries(decades)) {
        if (!trends.decade_shift[decade]) {
          trends.decade_shift[decade] = [];
        }
        trends.decade_shift[decade].push({
          year: analysis.edition_year,
          count: count as number
        });
      }
    }

    // Find top stable genres (appear in most years)
    const stableGenres = Object.entries(trends.genre_evolution)
      .filter(([_, data]) => data.length >= yearAnalyses.length * 0.8)
      .sort((a, b) => {
        const avgA = a[1].reduce((sum, d) => sum + d.count, 0) / a[1].length;
        const avgB = b[1].reduce((sum, d) => sum + d.count, 0) / b[1].length;
        return avgB - avgA;
      })
      .slice(0, 10)
      .map(([genre]) => genre);

    // Calculate genre trend directions
    const genreTrends: Record<string, 'rising' | 'falling' | 'stable'> = {};
    for (const [genre, data] of Object.entries(trends.genre_evolution)) {
      if (data.length >= 3) {
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        const avgFirst = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;
        
        if (avgSecond > avgFirst * 1.2) {
          genreTrends[genre] = 'rising';
        } else if (avgSecond < avgFirst * 0.8) {
          genreTrends[genre] = 'falling';
        } else {
          genreTrends[genre] = 'stable';
        }
      }
    }

    // Generate comparison narrative with AI
    let comparisonNarrative = '';
    let keyFindings: string[] = [];

    if (apiKey) {
      const yearsRange = `${yearAnalyses[0].edition_year}-${yearAnalyses[yearAnalyses.length - 1].edition_year}`;
      
      const trendSummary = `
Top 2000 Vergelijking ${yearsRange} (${yearAnalyses.length} edities)

Nederlands aandeel trend:
${trends.dutch_percentage.map(d => `${d.year}: ${d.value.toFixed(1)}%`).join('\n')}

Stijgende genres: ${Object.entries(genreTrends).filter(([_, t]) => t === 'rising').map(([g]) => g).join(', ') || 'geen'}
Dalende genres: ${Object.entries(genreTrends).filter(([_, t]) => t === 'falling').map(([g]) => g).join(', ') || 'geen'}
Stabiele genres: ${stableGenres.join(', ')}

Artiest types per jaar:
${yearAnalyses.map(y => {
  const types = y.artist_type_distribution as Record<string, number> || {};
  return `${y.edition_year}: bands=${types.band || 0}, solo_man=${types.solo_man || 0}, solo_woman=${types.solo_woman || 0}`;
}).join('\n')}

Decade verdeling evolutie:
${yearAnalyses.map(y => {
  const decades = y.decade_distribution as Record<string, number> || {};
  return `${y.edition_year}: 70s=${decades['70s'] || 0}, 80s=${decades['80s'] || 0}, 90s=${decades['90s'] || 0}`;
}).join('\n')}
`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Je bent een Nederlandse muziekhistoricus die de evolutie van de Top 2000 analyseert over meerdere jaren.'
              },
              {
                role: 'user',
                content: `Analyseer deze Top 2000 vergelijkingsdata en schrijf:

1. Een uitgebreide narratieve analyse (300-400 woorden) over de evolutie van de Top 2000 over deze periode. Focus op:
   - Hoe is de muziekcanon veranderd?
   - Welke generaties domineren en hoe verschuift dit?
   - Nederlands vs internationaal: trends?
   - Welke genres winnen/verliezen terrein?
   - Bands vs solisten: ontwikkelingen?

2. 7 belangrijke bevindingen met data-onderbouwing

Data:
${trendSummary}

Geef je antwoord in dit JSON format:
{
  "narrative": "...",
  "key_findings": ["bevinding 1", "bevinding 2", ...]
}

Alleen JSON, geen andere tekst.`
              }
            ],
            temperature: 0.5,
          }),
        });

        if (response.ok) {
          const aiResult = await response.json();
          let content = aiResult.choices[0].message.content;
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(content);
          comparisonNarrative = parsed.narrative || '';
          keyFindings = parsed.key_findings || [];
        }
      } catch (aiError) {
        console.error('AI comparison error:', aiError);
      }
    }

    // Store in top2000_analyses table
    const analysisData = {
      trends,
      stable_genres: stableGenres,
      genre_trends: genreTrends,
      years_compared: yearAnalyses.map(y => y.edition_year),
      key_findings: keyFindings,
      narrative: comparisonNarrative
    };

    const { error: upsertError } = await supabase
      .from('top2000_analyses')
      .upsert({
        id: 'comparison-analysis', // Fixed ID for the comparison
        analysis_type: 'comparison',
        years_range: `${yearAnalyses[0].edition_year}-${yearAnalyses[yearAnalyses.length - 1].edition_year}`,
        main_narrative: comparisonNarrative,
        key_insights: keyFindings,
        data_summary: analysisData,
        generated_at: new Date().toISOString(),
        status: 'completed'
      }, {
        onConflict: 'id'
      });

    if (upsertError) {
      console.error('Error storing comparison:', upsertError);
    }

    console.log('Comparison analysis complete');

    return new Response(JSON.stringify({
      success: true,
      years_compared: yearAnalyses.length,
      stable_genres: stableGenres,
      rising_genres: Object.entries(genreTrends).filter(([_, t]) => t === 'rising').map(([g]) => g),
      falling_genres: Object.entries(genreTrends).filter(([_, t]) => t === 'falling').map(([g]) => g),
      has_narrative: !!comparisonNarrative,
      key_findings_count: keyFindings.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in compare-top2000-years:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
