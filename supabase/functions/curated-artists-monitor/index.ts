import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MINIMUM_ARTISTS = 200;
const MINIMUM_WEEKLY_PRODUCTS = 50;
const ARTIST_STALE_DAYS = 7;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Starting curated artists monitoring...');

    // Check 1: Artists zonder producten (> 7 dagen oud)
    const sevenDaysAgo = new Date(Date.now() - ARTIST_STALE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: curatedArtists, error: artistsError } = await supabase
      .from('curated_artists')
      .select('id, artist_name, releases_found_count, last_crawled_at')
      .eq('is_active', true)
      .lt('last_crawled_at', sevenDaysAgo);

    if (artistsError) throw artistsError;

    // For each artist, check if they have metal print products
    const artistsWithoutProducts = [];
    if (curatedArtists && curatedArtists.length > 0) {
      for (const artist of curatedArtists) {
        const { count, error: countError } = await supabase
          .from('platform_products')
          .select('*', { count: 'exact', head: true })
          .eq('artist', artist.artist_name)
          .eq('media_type', 'metal_print')
          .eq('status', 'active');

        if (!countError && count === 0) {
          artistsWithoutProducts.push(artist);
        }
      }
    }

    console.log(`📊 Artists without products: ${artistsWithoutProducts.length}`);

    // Check 2: Totaal aantal actieve artiesten
    const { count: totalActiveArtists, error: countError } = await supabase
      .from('curated_artists')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) throw countError;

    const needsNewArtists = (totalActiveArtists || 0) < MINIMUM_ARTISTS;
    console.log(`📊 Total active artists: ${totalActiveArtists} (min: ${MINIMUM_ARTISTS})`);

    // Check 3: Nieuwe content laatste 7 dagen
    const { count: recentProducts, error: productsError } = await supabase
      .from('platform_products')
      .select('*', { count: 'exact', head: true })
      .eq('media_type', 'metal_print')
      .gte('created_at', sevenDaysAgo);

    if (productsError) throw productsError;

    const lowProductivity = (recentProducts || 0) < MINIMUM_WEEKLY_PRODUCTS;
    console.log(`📊 Recent metal prints (7d): ${recentProducts} (min: ${MINIMUM_WEEKLY_PRODUCTS})`);

    // Prepare alert summary
    const alerts = {
      needs_new_artists: needsNewArtists,
      low_productivity: lowProductivity,
      artists_without_products: artistsWithoutProducts.length,
      total_active_artists: totalActiveArtists,
      recent_products: recentProducts,
      artist_details: artistsWithoutProducts.slice(0, 10).map(a => a.artist_name)
    };

    // Determine severity
    let severity = 'info';
    if (needsNewArtists || artistsWithoutProducts.length > 15) {
      severity = 'high';
    } else if (lowProductivity || artistsWithoutProducts.length > 5) {
      severity = 'medium';
    }

    console.log(`⚠️ Alert severity: ${severity}`);

    return new Response(JSON.stringify({
      status: 'success',
      severity,
      alerts,
      summary: {
        needs_attention: needsNewArtists || lowProductivity || artistsWithoutProducts.length > 5,
        message: needsNewArtists 
          ? `⚠️ Nieuwe artiesten nodig! Slechts ${totalActiveArtists} actieve artiesten (min: ${MINIMUM_ARTISTS})`
          : lowProductivity
          ? `⚠️ Lage productiviteit! Slechts ${recentProducts} nieuwe producten (min: ${MINIMUM_WEEKLY_PRODUCTS}/week)`
          : artistsWithoutProducts.length > 5
          ? `⚠️ ${artistsWithoutProducts.length} artiesten zonder producten`
          : '✅ Content pipeline ziet er goed uit'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Monitoring error:', error);
    return new Response(JSON.stringify({ 
      status: 'error',
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
