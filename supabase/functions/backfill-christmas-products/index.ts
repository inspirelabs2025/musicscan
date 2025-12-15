import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function creates products for Christmas stories that have artwork but no products
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🎄 Starting Christmas products backfill...');

    // Find Christmas stories WITH artwork but WITHOUT products in queue
    const { data: storiesNeedingProducts, error: fetchError } = await supabase
      .from('music_stories')
      .select('id, artist, single_name, slug, artwork_url')
      .filter('yaml_frontmatter->>is_christmas', 'eq', 'true')
      .not('artwork_url', 'is', null)
      .order('artist', { ascending: true })
      .limit(5);

    if (fetchError) {
      throw new Error(`Fetch error: ${fetchError.message}`);
    }

    if (!storiesNeedingProducts || storiesNeedingProducts.length === 0) {
      console.log('🎄 No Christmas stories need product creation');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No stories need products',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎄 Found ${storiesNeedingProducts.length} stories with artwork to check for products`);

    const results = {
      total: storiesNeedingProducts.length,
      created: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[]
    };

    for (const story of storiesNeedingProducts) {
      try {
        // Check if this story already has products in christmas_import_queue
        const { data: queueItem } = await supabase
          .from('christmas_import_queue')
          .select('product_ids')
          .eq('music_story_id', story.id)
          .maybeSingle();

        // Skip if already has products
        if (queueItem?.product_ids && queueItem.product_ids.length > 0) {
          console.log(`⏭️ Skipping ${story.artist} - ${story.single_name}: already has ${queueItem.product_ids.length} products`);
          results.skipped++;
          results.details.push({
            id: story.id,
            artist: story.artist,
            single: story.single_name,
            status: 'skipped',
            reason: 'already has products'
          });
          continue;
        }

        console.log(`🛍️ Creating products for: ${story.artist} - ${story.single_name}`);
        const productIds: string[] = [];

        // Create Poster Product (uses stylizedImageBase64 field which accepts URLs)
        try {
          const { data: posterResult, error: posterError } = await supabase.functions.invoke('create-poster-product', {
            body: {
              stylizedImageBase64: story.artwork_url, // Function accepts URLs too
              artist: story.artist,
              title: story.single_name,
              style: 'Christmas',
              price: 49.95
            }
          });
          if (posterError) {
            console.error('Poster error response:', posterError);
          }
          if (posterResult?.product_id) {
            productIds.push(posterResult.product_id);
            console.log(`✅ Poster created: ${posterResult.product_id}`);
          }
        } catch (e) {
          console.error('Poster creation failed:', e);
        }

        // Create Canvas Product (uses stylizedImageBase64 field which accepts URLs)
        try {
          const { data: canvasResult, error: canvasError } = await supabase.functions.invoke('create-canvas-product', {
            body: {
              stylizedImageBase64: story.artwork_url, // Function accepts URLs too
              artist: story.artist,
              title: story.single_name,
              style: 'warmGrayscale',
              price: 79.95
            }
          });
          if (canvasError) {
            console.error('Canvas error response:', canvasError);
          }
          if (canvasResult?.product_id) {
            productIds.push(canvasResult.product_id);
            console.log(`✅ Canvas created: ${canvasResult.product_id}`);
          }
        } catch (e) {
          console.error('Canvas creation failed:', e);
        }

        // Note: T-shirt and Sock products require first creating records in album_tshirts/album_socks tables
        // For Christmas singles, we focus on art products (posters and canvas) which can be created directly
        // Update christmas_import_queue with product IDs
        if (productIds.length > 0 && queueItem) {
          await supabase
            .from('christmas_import_queue')
            .update({ product_ids: productIds })
            .eq('music_story_id', story.id);
        }

        results.created++;
        results.details.push({
          id: story.id,
          artist: story.artist,
          single: story.single_name,
          status: 'created',
          product_count: productIds.length
        });

        console.log(`✅ Created ${productIds.length} products for ${story.artist} - ${story.single_name}`);

        // Rate limiting - 3 seconds between items
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        results.failed++;
        results.details.push({
          id: story.id,
          artist: story.artist,
          single: story.single_name,
          status: 'error',
          error: error.message
        });
        console.log(`❌ Error for ${story.artist}: ${error.message}`);
      }
    }

    console.log(`🎄 Product backfill complete: ${results.created} created, ${results.skipped} skipped, ${results.failed} failed`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Product backfill error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
