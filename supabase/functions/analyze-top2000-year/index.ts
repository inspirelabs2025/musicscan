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

    const { edition_year } = await req.json();

    if (!edition_year) {
      throw new Error('edition_year is required');
    }

    console.log(`Analyzing Top 2000 edition ${edition_year}`);

    // Fetch all entries for this year
    const { data: entries, error: fetchError } = await supabase
      .from('top2000_entries')
      .select('*')
      .eq('year', edition_year)
      .order('position', { ascending: true });

    if (fetchError) throw fetchError;

    if (!entries || entries.length === 0) {
      throw new Error(`No entries found for year ${edition_year}`);
    }

    console.log(`Found ${entries.length} entries for ${edition_year}`);

    // Calculate distributions
    const genreDistribution: Record<string, number> = {};
    const artistTypeDistribution: Record<string, number> = {};
    const languageDistribution: Record<string, number> = {};
    const decadeDistribution: Record<string, number> = {};
    let enrichedCount = 0;
    let dutchCount = 0;

    for (const entry of entries) {
      // Count enriched entries
      if (entry.enriched_at) {
        enrichedCount++;
      }

      // Artist type distribution
      if (entry.artist_type) {
        artistTypeDistribution[entry.artist_type] = (artistTypeDistribution[entry.artist_type] || 0) + 1;
      }

      // Language distribution
      if (entry.language) {
        languageDistribution[entry.language] = (languageDistribution[entry.language] || 0) + 1;
        if (entry.language === 'dutch') {
          dutchCount++;
        }
      }

      // Decade distribution
      if (entry.decade) {
        decadeDistribution[entry.decade] = (decadeDistribution[entry.decade] || 0) + 1;
      }

      // Genre distribution (from subgenre or genres array)
      if (entry.subgenre) {
        const genre = entry.subgenre.toLowerCase();
        genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
      } else if (entry.genres && entry.genres.length > 0) {
        for (const genre of entry.genres) {
          const g = genre.toLowerCase();
          genreDistribution[g] = (genreDistribution[g] || 0) + 1;
        }
      }
    }

    // Calculate Dutch percentage
    const dutchPercentage = enrichedCount > 0 
      ? ((dutchCount / enrichedCount) * 100).toFixed(2)
      : 0;

    // Get top 10 for summary
    const top10 = entries.slice(0, 10);
    const top10Summary = top10.map((e, i) => 
      `${i + 1}. ${e.artist} - ${e.title}`
    ).join('\n');

    // Generate narrative with AI
    let analysisNarrative = '';
    let uniqueInsights: string[] = [];

    if (apiKey && enrichedCount > 0) {
      const statsContext = `
Top 2000 ${edition_year} Statistieken:
- Totaal entries: ${entries.length}
- Verrijkt: ${enrichedCount}
- Nederlands: ${dutchCount} (${dutchPercentage}%)

Top 10:
${top10Summary}

Genre verdeling (top 10):
${Object.entries(genreDistribution)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([g, c]) => `- ${g}: ${c}`)
  .join('\n')}

Artiest types:
${Object.entries(artistTypeDistribution)
  .sort((a, b) => b[1] - a[1])
  .map(([t, c]) => `- ${t}: ${c}`)
  .join('\n')}

Decades:
${Object.entries(decadeDistribution)
  .sort((a, b) => b[1] - a[1])
  .map(([d, c]) => `- ${d}: ${c}`)
  .join('\n')}
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
                content: 'Je bent een Nederlandse muziekjournalist die de Top 2000 analyseert.'
              },
              {
                role: 'user',
                content: `Analyseer deze Top 2000 editie ${edition_year} data en schrijf:

1. Een korte narratieve samenvatting (max 200 woorden) over de kenmerken van deze editie
2. 5 unieke inzichten of opvallende patronen

Data:
${statsContext}

Geef je antwoord in dit JSON format:
{
  "narrative": "...",
  "insights": ["inzicht 1", "inzicht 2", "inzicht 3", "inzicht 4", "inzicht 5"]
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
          analysisNarrative = parsed.narrative || '';
          uniqueInsights = parsed.insights || [];
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
      }
    }

    // Upsert the year analysis
    const { error: upsertError } = await supabase
      .from('top2000_year_analyses')
      .upsert({
        edition_year,
        genre_distribution: genreDistribution,
        artist_type_distribution: artistTypeDistribution,
        language_distribution: languageDistribution,
        decade_distribution: decadeDistribution,
        dutch_percentage: parseFloat(dutchPercentage as string) || 0,
        top_10_summary: top10Summary,
        unique_insights: uniqueInsights,
        total_entries: entries.length,
        enriched_entries: enrichedCount,
        analysis_narrative: analysisNarrative,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'edition_year'
      });

    if (upsertError) throw upsertError;

    console.log(`Analysis complete for ${edition_year}`);

    return new Response(JSON.stringify({
      success: true,
      edition_year,
      total_entries: entries.length,
      enriched_entries: enrichedCount,
      dutch_percentage: dutchPercentage,
      genre_count: Object.keys(genreDistribution).length,
      has_narrative: !!analysisNarrative,
      insights_count: uniqueInsights.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyze-top2000-year:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
