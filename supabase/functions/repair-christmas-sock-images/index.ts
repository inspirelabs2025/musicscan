import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Repair Christmas sock products that have base64 images by re-fetching artwork and uploading to storage
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔧🎄 ===== REPAIR CHRISTMAS SOCK IMAGES START =====');

    // Find Christmas sock products with base64 images
    const { data: brokenProducts, error: fetchError } = await supabase
      .from('platform_products')
      .select('id, title, artist, slug, primary_image')
      .like('primary_image', 'data:image%')
      .contains('tags', ['christmas'])
      .limit(5); // Process 5 at a time

    if (fetchError) {
      console.error('❌ Error fetching broken products:', fetchError);
      throw fetchError;
    }

    if (!brokenProducts || brokenProducts.length === 0) {
      console.log('✅ No Christmas sock products with base64 images found!');
      return new Response(
        JSON.stringify({ success: true, message: 'All Christmas sock images are already fixed', repaired: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${brokenProducts.length} products with base64 images to repair`);

    let repaired = 0;
    const errors: string[] = [];

    for (const product of brokenProducts) {
      console.log(`\n🔧 Repairing: ${product.artist} - ${product.title}`);

      try {
        // Extract artist name from title (format: "Title Socks - Artist")
        const artistName = product.artist || product.title?.split(' - ').pop() || 'Unknown';
        const songTitle = product.title?.replace(' Socks - ' + artistName, '').replace(' Socks', '') || 'Unknown';

        console.log(`   Artist: ${artistName}, Song: ${songTitle}`);

        // Fetch fresh artwork
        const artworkResponse = await supabase.functions.invoke('fetch-album-artwork', {
          body: {
            artist: artistName,
            title: songTitle,
            media_type: 'single'
          }
        });

        if (artworkResponse.error || !artworkResponse.data?.artwork_url) {
          console.error(`   ❌ Failed to fetch artwork for ${artistName} - ${songTitle}`);
          errors.push(`${product.id}: No artwork found`);
          continue;
        }

        const artworkUrl = artworkResponse.data.artwork_url;
        console.log(`   ✅ Artwork found: ${artworkUrl}`);

        // Apply posterize style
        const stylizeResponse = await supabase.functions.invoke('stylize-photo', {
          body: {
            imageUrl: artworkUrl,
            style: 'posterize',
            outputPath: `socks/christmas-repair-${Date.now()}.png`
          }
        });

        if (stylizeResponse.error || !stylizeResponse.data?.stylizedImageUrl) {
          console.error(`   ❌ Failed to stylize image for ${artistName}`);
          errors.push(`${product.id}: Stylize failed`);
          continue;
        }

        const styledImageUrl = stylizeResponse.data.stylizedImageUrl;
        console.log(`   ✅ Styled image: ${styledImageUrl}`);

        // Update the product with the new image URL
        const { error: updateError } = await supabase
          .from('platform_products')
          .update({
            primary_image: styledImageUrl,
            images: [styledImageUrl]
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`   ❌ Failed to update product ${product.id}:`, updateError);
          errors.push(`${product.id}: Update failed - ${updateError.message}`);
          continue;
        }

        console.log(`   ✅ Product ${product.id} repaired successfully!`);
        repaired++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.error(`   ❌ Error processing ${product.id}:`, err);
        errors.push(`${product.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log('\n🎉 ===== REPAIR COMPLETE =====');
    console.log(`✅ Repaired: ${repaired}/${brokenProducts.length}`);
    if (errors.length > 0) {
      console.log(`❌ Errors: ${errors.length}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        repaired,
        total: brokenProducts.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in repair function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
