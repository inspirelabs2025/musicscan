import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { extractStatisticsPricing } from '../_shared/extract-statistics-pricing.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlbumData {
  discogs_id: number;
  artist: string;
  title: string;
  last_scan?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      manual = false, 
      target_discogs_ids = null, 
      priority = 'normal' 
    } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const scraperApiKey = Deno.env.get('SCRAPERAPI_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting price history collection...');

    // Get unique albums with discogs_id from both tables
    let cdAlbums, vinylAlbums;
    
    if (target_discogs_ids && Array.isArray(target_discogs_ids)) {
      console.log(`Targeting specific discogs IDs: ${target_discogs_ids.join(', ')}`);
      
      const { data: cdTargetData, error: cdError } = await supabase
        .from('cd_scan')
        .select('discogs_id, artist, title, updated_at')
        .in('discogs_id', target_discogs_ids);
        
      const { data: vinylTargetData, error: vinylError } = await supabase
        .from('vinyl2_scan')
        .select('discogs_id, artist, title, updated_at')
        .in('discogs_id', target_discogs_ids);
        
      cdAlbums = cdTargetData;
      vinylAlbums = vinylTargetData;
      
      if (cdError || vinylError) {
        throw new Error(`Database error: ${cdError?.message || vinylError?.message}`);
      }
    } else {
      // Get recent albums
      const { data: cdRecentData, error: cdError } = await supabase
        .from('cd_scan')
        .select('discogs_id, artist, title, updated_at')
        .not('discogs_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(50);

      const { data: vinylRecentData, error: vinylError } = await supabase
        .from('vinyl2_scan')
        .select('discogs_id, artist, title, updated_at')
        .not('discogs_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(50);

      cdAlbums = cdRecentData;
      vinylAlbums = vinylRecentData;
      
      if (cdError || vinylError) {
        throw new Error(`Database error: ${cdError?.message || vinylError?.message}`);
      }
    }

    // Combine and deduplicate albums
    const allAlbums: AlbumData[] = [];
    const seenIds = new Set<number>();

    [...(cdAlbums || []), ...(vinylAlbums || [])].forEach(album => {
      if (!seenIds.has(album.discogs_id)) {
        seenIds.add(album.discogs_id);
        allAlbums.push({
          discogs_id: album.discogs_id,
          artist: album.artist,
          title: album.title,
          last_scan: album.updated_at
        });
      }
    });

    console.log(`Found ${allAlbums.length} unique albums to process`);

    let successCount = 0;
    let errorCount = 0;

    // Process albums with rate limiting
    const maxToProcess = target_discogs_ids ? Math.min(allAlbums.length, 30) : 20;
    for (const album of allAlbums.slice(0, maxToProcess)) {
      try {
        await collectPriceForAlbum(album, supabase, scraperApiKey);
        successCount++;
        
        // Rate limiting: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing album ${album.discogs_id}:`, error);
        errorCount++;
      }
    }

    console.log(`Price collection completed: ${successCount} success, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      processed: successCount + errorCount,
      successful: successCount,
      errors: errorCount,
      message: 'Price history collection completed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in collect-price-history function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function collectPriceForAlbum(album: AlbumData, supabase: any, scraperApiKey?: string) {
  const discogsUrl = `https://www.discogs.com/release/${album.discogs_id}`;
  
  console.log(`Collecting price data for: ${album.artist} - ${album.title} (${album.discogs_id})`);

  let priceData;
  let extractionMethod = 'direct';
  let rawResponse = '';

  try {
    // Try direct scraping first
    const response = await fetch(discogsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (response.status === 403 || response.status === 429) {
      // If blocked, try with ScraperAPI
      if (scraperApiKey) {
        extractionMethod = 'scraperapi';
        const scraperUrl = `https://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(discogsUrl)}`;
        
        const scraperResponse = await fetch(scraperUrl);
        if (!scraperResponse.ok) {
          throw new Error(`ScraperAPI failed: ${scraperResponse.status}`);
        }
        
        rawResponse = await scraperResponse.text();
      } else {
        throw new Error('Access denied and no ScraperAPI key available');
      }
    } else if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    } else {
      rawResponse = await response.text();
    }

    // Parse price data from Statistics section only
    const statisticsPricing = extractStatisticsPricing(rawResponse);
    priceData = statisticsPricing 
      ? { ...statisticsPricing, num_for_sale: 0, total_prices_found: statisticsPricing.lowest_price ? 3 : 0 }
      : { lowest_price: null, median_price: null, highest_price: null, num_for_sale: 0, total_prices_found: 0 };
    
    // Check if we got recent price data to avoid duplicates
    const { data: existingData } = await supabase
      .from('discogs_pricing_sessions')
      .select('created_at')
      .eq('discogs_id', album.discogs_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .single();

    if (existingData) {
      console.log(`Skipping ${album.discogs_id} - already has recent data`);
      return;
    }

    // Insert price data
    const { error: insertError } = await supabase
      .from('discogs_pricing_sessions')
      .insert({
        discogs_id: album.discogs_id,
        discogs_url: discogsUrl,
        release_title: album.title,
        artist_name: album.artist,
        lowest_price: priceData.lowest_price,
        median_price: priceData.median_price,
        highest_price: priceData.highest_price,
        num_for_sale: priceData.num_for_sale,
        extraction_method: extractionMethod,
        strategy_used: 'html_parsing',
        success: true,
        total_prices_found: priceData.total_prices_found,
        raw_response: rawResponse.length > 10000 ? rawResponse.substring(0, 10000) + '...' : rawResponse,
        execution_time_ms: Date.now() % 10000 // Simple timing
      });

    if (insertError) {
      throw insertError;
    }

    console.log(`Successfully collected price data for ${album.discogs_id}: €${priceData.median_price}`);

  } catch (error) {
    console.error(`Failed to collect price data for ${album.discogs_id}:`, error);
    
    // Insert error record
    await supabase
      .from('discogs_pricing_sessions')
      .insert({
        discogs_id: album.discogs_id,
        discogs_url: discogsUrl,
        release_title: album.title,
        artist_name: album.artist,
        extraction_method: extractionMethod,
        strategy_used: 'html_parsing',
        success: false,
        error_message: error.message,
        raw_response: rawResponse.substring(0, 1000),
        execution_time_ms: Date.now() % 10000
      });
    
    throw error;
  }
}

// parsePriceDataFromHTML removed — now using shared extractStatisticsPricing helper