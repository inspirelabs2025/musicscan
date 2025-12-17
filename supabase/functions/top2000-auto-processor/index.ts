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
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Top 2000 Auto Processor starting...');

    // Step 1: Check for unenriched songs in master songs table
    const { count: unenrichedCount } = await supabase
      .from('top2000_songs')
      .select('*', { count: 'exact', head: true })
      .is('enriched_at', null);

    console.log(`📊 Unenriched unique songs: ${unenrichedCount}`);

    if (unenrichedCount && unenrichedCount > 0) {
      // Still have songs to enrich - process a batch
      console.log('🎵 Processing enrichment batch...');
      
      const enrichResponse = await fetch(`${supabaseUrl}/functions/v1/enrich-top2000-songs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batchSize: 50 })
      });

      const enrichResult = await enrichResponse.json();
      console.log('✅ Enrichment batch result:', enrichResult);

      return new Response(JSON.stringify({
        phase: 'enrichment',
        remaining: unenrichedCount - (enrichResult.enriched || 0),
        result: enrichResult
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: Check for years that need analysis
    // Use RPC or raw query to get distinct years (avoid 1000-row limit)
    const { data: allYears } = await supabase
      .rpc('get_distinct_top2000_years');

    // Fallback if RPC doesn't exist
    let uniqueYears: number[] = [];
    if (allYears && Array.isArray(allYears)) {
      uniqueYears = allYears.map((e: any) => e.year);
    } else {
      // Manual approach: query with limit per year
      const { data: entries2016 } = await supabase.from('top2000_entries').select('year').eq('year', 2016).limit(1);
      const { data: entries2017 } = await supabase.from('top2000_entries').select('year').eq('year', 2017).limit(1);
      const { data: entries2018 } = await supabase.from('top2000_entries').select('year').eq('year', 2018).limit(1);
      const { data: entries2019 } = await supabase.from('top2000_entries').select('year').eq('year', 2019).limit(1);
      const { data: entries2020 } = await supabase.from('top2000_entries').select('year').eq('year', 2020).limit(1);
      const { data: entries2021 } = await supabase.from('top2000_entries').select('year').eq('year', 2021).limit(1);
      const { data: entries2022 } = await supabase.from('top2000_entries').select('year').eq('year', 2022).limit(1);
      const { data: entries2023 } = await supabase.from('top2000_entries').select('year').eq('year', 2023).limit(1);
      const { data: entries2024 } = await supabase.from('top2000_entries').select('year').eq('year', 2024).limit(1);
      const { data: entries2025 } = await supabase.from('top2000_entries').select('year').eq('year', 2025).limit(1);
      
      [entries2016, entries2017, entries2018, entries2019, entries2020, entries2021, entries2022, entries2023, entries2024, entries2025]
        .forEach(entries => {
          if (entries && entries.length > 0) {
            uniqueYears.push(entries[0].year);
          }
        });
    }
    
    console.log(`📊 Found years in data: ${uniqueYears.join(', ')}`);
    
    const { data: analyzedYears } = await supabase
      .from('top2000_year_analyses')
      .select('edition_year');

    const analyzedYearSet = new Set(analyzedYears?.map(a => a.edition_year) || []);
    const unanalyzedYears = uniqueYears.filter(y => !analyzedYearSet.has(y));

    console.log(`📊 Unanalyzed years: ${unanalyzedYears.join(', ')}`);

    if (unanalyzedYears.length > 0) {
      // Analyze the first unanalyzed year
      const yearToAnalyze = unanalyzedYears[0];
      console.log(`📈 Analyzing year ${yearToAnalyze}...`);

      const analyzeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-top2000-year`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ edition_year: yearToAnalyze })
      });

      const analyzeResult = await analyzeResponse.json();
      console.log('✅ Year analysis result:', analyzeResult);

      return new Response(JSON.stringify({
        phase: 'year_analysis',
        year: yearToAnalyze,
        remainingYears: unanalyzedYears.length - 1,
        result: analyzeResult
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 3: Check if comparison needs to run
    const { data: yearAnalyses } = await supabase
      .from('top2000_year_analyses')
      .select('edition_year, comparison_included')
      .order('edition_year');

    const needsComparison = yearAnalyses && yearAnalyses.length >= 2 && 
      yearAnalyses.some(a => !a.comparison_included);

    if (needsComparison) {
      console.log('🔀 Running comparison analysis...');

      const compareResponse = await fetch(`${supabaseUrl}/functions/v1/compare-top2000-years`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const compareResult = await compareResponse.json();
      
      // Mark all years as included in comparison
      await supabase
        .from('top2000_year_analyses')
        .update({ comparison_included: true })
        .is('comparison_included', false);

      console.log('✅ Comparison result:', compareResult);

      return new Response(JSON.stringify({
        phase: 'comparison',
        result: compareResult
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Everything is complete
    console.log('✅ All processing complete - nothing to do');
    return new Response(JSON.stringify({
      phase: 'complete',
      message: 'All songs enriched, all years analyzed, comparison up to date',
      stats: {
        totalYears: uniqueYears.length,
        analyzedYears: analyzedYearSet.size
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ Auto processor error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
