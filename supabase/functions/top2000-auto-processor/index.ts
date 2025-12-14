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

    // Step 1: Check for unenriched songs
    const { count: unenrichedCount } = await supabase
      .from('top2000_entries')
      .select('*', { count: 'exact', head: true })
      .is('enriched_at', null);

    console.log(`📊 Unenriched songs: ${unenrichedCount}`);

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
    const { data: allYears } = await supabase
      .from('top2000_entries')
      .select('year')
      .order('year');

    const uniqueYears = [...new Set(allYears?.map(e => e.year) || [])];
    
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
        body: JSON.stringify({ editionYear: yearToAnalyze })
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
