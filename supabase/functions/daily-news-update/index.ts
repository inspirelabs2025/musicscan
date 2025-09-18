import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiscogsRelease {
  id: number;
  title: string;
  artist: string;
  year?: number;
  artwork?: string;
  format?: string;
  label?: string;
  genre?: string[];
  style?: string[];
  country?: string;
  uri?: string;
  database_id?: string;
  release_id?: string;
}

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  category: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily news update...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch Discogs news
    console.log('Fetching Discogs releases...');
    const discogsResponse = await supabase.functions.invoke('latest-discogs-news');
    let discogsData = [];
    if (discogsResponse.data?.success && discogsResponse.data?.releases) {
      discogsData = discogsResponse.data.releases;
      console.log(`✅ Fetched ${discogsData.length} Discogs releases`);
    } else {
      console.log('❌ Failed to fetch Discogs data');
    }

    // Fetch Perplexity news
    console.log('Fetching Perplexity news...');
    const perplexityResponse = await supabase.functions.invoke('music-news-perplexity');
    let perplexityData = [];
    if (perplexityResponse.data?.success !== false && perplexityResponse.data?.length) {
      perplexityData = perplexityResponse.data;
      console.log(`✅ Fetched ${perplexityData.length} Perplexity news items`);
    } else {
      console.log('❌ Failed to fetch Perplexity data');
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

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      discogs_count: discogsData.length,
      perplexity_count: perplexityData.length,
      cache_updated: cacheEntries.length > 0
    };

    console.log('Daily news update completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daily news update:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});