import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Log to database
async function logToDatabase(supabase: any, source: string, status: string, itemsProcessed: number, errorMessage: string | null, executionTime: number) {
  try {
    await supabase.from('news_generation_logs').insert({
      source,
      status,
      items_processed: itemsProcessed,
      items_failed: 0,
      error_message: errorMessage,
      execution_time_ms: executionTime
    });
  } catch (error) {
    console.error('Failed to log to database:', error);
  }
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting daily news update...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch both news sources in parallel
    console.log('📡 Fetching news from multiple sources in parallel...');
    const [discogsResponse, perplexityResponse] = await Promise.all([
      supabase.functions.invoke('latest-discogs-news').catch(err => {
        console.error('Discogs fetch failed:', err);
        return { data: null, error: err };
      }),
      supabase.functions.invoke('music-news-enhanced').catch(err => {
        console.error('Music news enhanced fetch failed:', err);
        return { data: null, error: err };
      })
    ]);

    let discogsData = [];
    if (discogsResponse.data?.success && discogsResponse.data?.releases) {
      discogsData = discogsResponse.data.releases;
      console.log(`✅ Fetched ${discogsData.length} Discogs releases`);
    } else {
      console.log('⚠️ No Discogs data available');
    }

    let perplexityData = [];
    if (perplexityResponse.data?.blogPosts && Array.isArray(perplexityResponse.data.blogPosts)) {
      perplexityData = perplexityResponse.data.blogPosts;
      console.log(`✅ Fetched ${perplexityData.length} enhanced news items`);
    } else if (perplexityResponse.data && Array.isArray(perplexityResponse.data)) {
      perplexityData = perplexityResponse.data;
      console.log(`✅ Fetched ${perplexityData.length} enhanced news items`);
    } else {
      console.log('⚠️ No enhanced news data available');
    }

    // Clear old cache entries
    await supabase
      .from('news_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());

    // Update cache with new data
    const cacheEntries = [];
    
    if (discogsData.length > 0) {
      cacheEntries.push({
        source: 'discogs',
        content: discogsData,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    if (perplexityData.length > 0) {
      cacheEntries.push({
        source: 'perplexity',
        content: perplexityData,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    if (cacheEntries.length > 0) {
      // Delete existing cache entries for these sources
      await supabase
        .from('news_cache')
        .delete()
        .in('source', cacheEntries.map(e => e.source));

      // Insert new cache entries
      const { error: insertError } = await supabase
        .from('news_cache')
        .insert(cacheEntries);

      if (insertError) {
        console.error('Error updating cache:', insertError);
        throw insertError;
      }

      console.log(`✅ Updated cache with ${cacheEntries.length} sources`);
    }

    const executionTime = Date.now() - startTime;
    const totalItems = discogsData.length + perplexityData.length;

    // Log to database
    await logToDatabase(
      supabase,
      'daily-news-update',
      totalItems > 0 ? 'success' : 'no_items',
      totalItems,
      null,
      executionTime
    );

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      discogs_count: discogsData.length,
      perplexity_count: perplexityData.length,
      cache_updated: cacheEntries.length > 0,
      execution_time_ms: executionTime
    };

    console.log('✅ Daily news update completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Error in daily news update:', error);
    
    // Log error to database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await logToDatabase(
        supabase,
        'daily-news-update',
        'error',
        0,
        error.message,
        executionTime
      );
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      timestamp: new Date().toISOString(),
      execution_time_ms: executionTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});