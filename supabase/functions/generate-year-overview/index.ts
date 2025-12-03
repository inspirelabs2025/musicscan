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

    // Fetch all statistics from database functions
    const [
      { data: stats },
      { data: genreData },
      { data: countryData },
      { data: decadeData },
      { data: monthlyData },
      { data: topArtists },
      { data: priceInsights }
    ] = await Promise.all([
      supabase.rpc('get_year_overview_stats', { p_year: year }),
      supabase.rpc('get_genre_distribution_by_year', { p_year: year }),
      supabase.rpc('get_country_distribution_by_year', { p_year: year }),
      supabase.rpc('get_decade_distribution_by_year', { p_year: year }),
      supabase.rpc('get_monthly_trends_by_year', { p_year: year }),
      supabase.rpc('get_top_artists_by_year', { p_year: year, p_limit: 10 }),
      supabase.rpc('get_price_insights_by_year', { p_year: year })
    ]);

    const dataPoints = {
      stats: stats || {},
      genres: genreData || [],
      countries: countryData || [],
      decades: decadeData || [],
      monthly: monthlyData || [],
      topArtists: topArtists || [],
      priceInsights: priceInsights || { highest_valued: [], price_ranges: [] }
    };

    console.log('Data points collected:', JSON.stringify(dataPoints).substring(0, 500));

    // Generate AI narratives using Lovable AI Gateway
    const narratives = await generateNarratives(dataPoints, year);

    // Store in cache
    const cacheData = {
      year,
      filter_hash: 'default',
      data_points: dataPoints,
      generated_narratives: narratives,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
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

async function generateNarratives(dataPoints: any, year: number): Promise<Record<string, string>> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.log('No LOVABLE_API_KEY, returning empty narratives');
    return {};
  }

  const sections = [
    {
      id: 'global_overview',
      prompt: `Schrijf een korte, boeiende introductie (max 100 woorden) over het muziekjaar ${year} op MusicScan.
      
Data: ${dataPoints.stats.total_scans || 0} scans, ${dataPoints.stats.unique_artists || 0} artiesten, ${dataPoints.stats.vinyl_percentage || 0}% vinyl, gemiddelde prijs €${dataPoints.stats.avg_median_price || 0}.

Schrijf in het Nederlands, geen AI-terminologie, focus op community activiteit.`
    },
    {
      id: 'genre_trends',
      prompt: `Schrijf een korte analyse (max 80 woorden) over genre trends in ${year}.
      
Top genres: ${(dataPoints.genres || []).slice(0, 5).map((g: any) => `${g.genre} (${g.count})`).join(', ')}.

Schrijf in het Nederlands, informatief en engaging.`
    },
    {
      id: 'format_analysis',
      prompt: `Schrijf een korte observatie (max 60 woorden) over vinyl vs CD in ${year}.
      
Vinyl: ${dataPoints.stats.vinyl_count || 0}, CD: ${dataPoints.stats.cd_count || 0}, Vinyl percentage: ${dataPoints.stats.vinyl_percentage || 0}%.

Schrijf in het Nederlands.`
    }
  ];

  const narratives: Record<string, string> = {};

  for (const section of sections) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Je bent de MusicScan Year Overview schrijver. Schrijf kort, bondig en in het Nederlands.' },
            { role: 'user', content: section.prompt }
          ],
          max_tokens: 200
        }),
      });

      if (response.ok) {
        const data = await response.json();
        narratives[section.id] = data.choices?.[0]?.message?.content || '';
      }
    } catch (e) {
      console.error(`Error generating narrative for ${section.id}:`, e);
    }
  }

  return narratives;
}
