import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { product_id, product_ids } = await req.json();
    
    const idsToProcess = product_id ? [product_id] : (product_ids || []);
    
    if (idsToProcess.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No product_id or product_ids provided' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔄 Starting artwork refetch for ${idsToProcess.length} product(s)`);

    const results = [];

    for (const productId of idsToProcess) {
      try {
        console.log(`\n📦 Processing product: ${productId}`);
        
        // Fetch product info
        const { data: product, error: fetchError } = await supabase
          .from('platform_products')
          .select('id, artist, title, discogs_url, discogs_id, media_type')
          .eq('id', productId)
          .single();

        if (fetchError || !product) {
          console.log(`❌ Product not found: ${productId}`);
          results.push({
            product_id: productId,
            status: 'error',
            error: 'Product not found'
          });
          continue;
        }

        console.log(`🎵 Fetching artwork for: ${product.artist} - ${product.title}`);

        // Call fetch-album-artwork function
        const artworkResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-album-artwork`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            artist: product.artist,
            title: product.title,
            discogs_url: product.discogs_url,
            media_type: product.media_type || 'merchandise',
            item_id: product.id,
            item_type: 'platform_products'
          })
        });

        if (!artworkResponse.ok) {
          const errorText = await artworkResponse.text();
          console.log(`❌ Artwork fetch failed for ${productId}:`, errorText);
          results.push({
            product_id: productId,
            status: 'error',
            error: 'Artwork fetch failed',
            details: errorText
          });
          continue;
        }

        const artworkData = await artworkResponse.json();

        if (artworkData.success && artworkData.artwork_url) {
          console.log(`✅ Artwork updated for ${productId}: ${artworkData.artwork_url}`);
          results.push({
            product_id: productId,
            status: 'success',
            artwork_url: artworkData.artwork_url,
            source: artworkData.source || 'unknown'
          });
        } else {
          console.log(`⚠️ No artwork found for ${productId}`);
          results.push({
            product_id: productId,
            status: 'no_artwork',
            message: 'No artwork found'
          });
        }

      } catch (error) {
        console.error(`❌ Error processing ${productId}:`, error);
        results.push({
          product_id: productId,
          status: 'error',
          error: error.message
        });
      }

      // Add small delay between requests to be respectful
      if (idsToProcess.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const noArtworkCount = results.filter(r => r.status === 'no_artwork').length;

    console.log(`\n✅ Refetch complete: ${successCount} success, ${errorCount} errors, ${noArtworkCount} no artwork`);

    return new Response(JSON.stringify({ 
      success: true,
      total: idsToProcess.length,
      successful: successCount,
      errors: errorCount,
      no_artwork: noArtworkCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in refetch-product-artwork function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
