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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, photoUrl, batchId } = await req.json();

    if (action === 'start') {
      // Create batch record
      const newBatchId = crypto.randomUUID();
      
      const { error: batchError } = await supabase
        .from('photo_batch_queue')
        .insert({
          id: newBatchId,
          photo_url: photoUrl,
          status: 'processing',
          total_jobs: 10, // 7 posters + 1 canvas + 1 tshirt + 1 socks
          completed_jobs: 0
        });

      if (batchError) throw batchError;

      console.log(`🚀 Started batch ${newBatchId} for photo: ${photoUrl}`);

      // Start all background processes
      EdgeRuntime.waitUntil(processPhotoBatch(newBatchId, photoUrl, supabase));

      return new Response(JSON.stringify({
        success: true,
        batchId: newBatchId,
        message: 'Batch processing started in background'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      const { data: batch } = await supabase
        .from('photo_batch_queue')
        .select('*')
        .eq('id', batchId)
        .single();

      return new Response(JSON.stringify(batch), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Batch processor error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processPhotoBatch(batchId: string, photoUrl: string, supabase: any) {
  try {
    console.log(`📋 Processing batch ${batchId}`);
    
    const updateProgress = async (completed: number, currentJob: string, result?: any) => {
      await supabase
        .from('photo_batch_queue')
        .update({ 
          completed_jobs: completed,
          current_job: currentJob,
          results: result ? { ...result } : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);
    };

    const results: any = {
      posters: { variants: [], productIds: [] },
      canvas: { imageUrl: null, productId: null },
      tshirt: { baseDesign: null, variants: [], productIds: [] },
      socks: { imageUrl: null, productId: null },
      errors: []
    };

    // Job 1-7: Generate 7 poster styles
    try {
      await updateProgress(0, 'Generating 7 poster styles...');
      
      const { data: posterData, error: posterError } = await supabase.functions.invoke(
        'batch-generate-poster-styles',
        {
          body: {
            posterUrl: photoUrl,
            eventId: `batch-${batchId}`,
            artistName: 'Custom Photo'
          }
        }
      );

      if (posterError) throw posterError;
      
      results.posters.variants = posterData.styleVariants || [];
      await updateProgress(7, 'Poster styles completed, creating products...');
      console.log(`✅ Generated ${results.posters.variants.length} poster styles`);

      // Create poster products for each variant
      try {
        for (const variant of results.posters.variants) {
          const { data: posterProduct, error: productError } = await supabase.functions.invoke(
            'create-poster-product',
            {
              body: {
                stylizedImageBase64: variant.url,
                artist: 'Custom Photo',
                title: `Photo ${new Date().toISOString().split('T')[0]}`,
                style: variant.style,
                price: 49.95,
                styleVariants: []
              }
            }
          );

          if (!productError && posterProduct?.product_id) {
            results.posters.productIds.push(posterProduct.product_id);
            console.log(`✅ Created poster product: ${posterProduct.product_id}`);
          }
        }
      } catch (productError) {
        console.error('Poster product creation failed:', productError);
        results.errors.push({ job: 'posters-products', error: productError.message });
      }
      
    } catch (error) {
      console.error('Poster generation failed:', error);
      results.errors.push({ job: 'posters', error: error.message });
    }

    // Job 8: Generate Canvas (Warm Grayscale)
    try {
      await updateProgress(7, 'Generating canvas (warm grayscale)...');
      
      const { data: canvasStyle, error: canvasError } = await supabase.functions.invoke(
        'stylize-photo',
        {
          body: {
            imageUrl: photoUrl,
            style: 'warmGrayscale',
            preserveComposition: true
          }
        }
      );

      if (canvasError) throw canvasError;
      
      results.canvas.imageUrl = canvasStyle.stylizedImageUrl;
      await updateProgress(8, 'Canvas style completed, creating product...');
      console.log(`✅ Generated canvas style`);

      // Create canvas product
      try {
        const { data: canvasProduct, error: productError } = await supabase.functions.invoke(
          'create-canvas-product',
          {
            body: {
              stylizedImageBase64: canvasStyle.stylizedImageUrl,
              artist: 'Custom Photo',
              title: `Photo ${new Date().toISOString().split('T')[0]}`,
              style: 'warmGrayscale',
              price: 79.95,
              styleVariants: []
            }
          }
        );

        if (!productError && canvasProduct?.product_id) {
          results.canvas.productId = canvasProduct.product_id;
          console.log(`✅ Created canvas product: ${canvasProduct.product_id}`);
        }
      } catch (productError) {
        console.error('Canvas product creation failed:', productError);
        results.errors.push({ job: 'canvas-product', error: productError.message });
      }
      
    } catch (error) {
      console.error('Canvas generation failed:', error);
      results.errors.push({ job: 'canvas', error: error.message });
    }

    // Job 9: Generate T-shirt design + 7 variants
    try {
      await updateProgress(8, 'Generating T-shirt design + 7 styles...');
      
      // First generate base T-shirt design
      const { data: tshirtDesign, error: tshirtError } = await supabase.functions.invoke(
        'generate-tshirt-design',
        {
          body: {
            albumCoverUrl: photoUrl,
            albumTitle: 'Custom Photo',
            artistName: 'Custom Artist',
            colorPalette: {
              primary_color: '#000000',
              secondary_color: '#FFFFFF',
              accent_color: '#808080',
              design_theme: 'custom-photo'
            }
          }
        }
      );

      if (tshirtError) throw tshirtError;

      // Then generate 7 style variants
      const { data: tshirtVariants, error: variantsError } = await supabase.functions.invoke(
        'batch-generate-tshirt-styles',
        {
          body: {
            baseDesignUrl: tshirtDesign.base_design_url,
            tshirtId: tshirtDesign.tshirt_id
          }
        }
      );

      if (variantsError) throw variantsError;

      results.tshirt.baseDesign = tshirtDesign.base_design_url;
      results.tshirt.variants = tshirtVariants.styleVariants || [];
      
      await updateProgress(9, 'T-shirt styles completed, creating products...');
      console.log(`✅ Generated T-shirt with ${results.tshirt.variants.length} variants`);

      // Create T-shirt products
      try {
        const { data: tshirtProducts, error: productError } = await supabase.functions.invoke(
          'create-tshirt-products',
          {
            body: {
              tshirtId: tshirtDesign.tshirt_id,
              styleVariants: tshirtVariants.styleVariants
            }
          }
        );

        if (!productError && tshirtProducts) {
          if (tshirtProducts.standard_product_id) {
            results.tshirt.productIds.push(tshirtProducts.standard_product_id);
          }
          if (tshirtProducts.premium_product_id) {
            results.tshirt.productIds.push(tshirtProducts.premium_product_id);
          }
          console.log(`✅ Created ${results.tshirt.productIds.length} T-shirt products`);
        }
      } catch (productError) {
        console.error('T-shirt product creation failed:', productError);
        results.errors.push({ job: 'tshirt-products', error: productError.message });
      }
      
    } catch (error) {
      console.error('T-shirt generation failed:', error);
      results.errors.push({ job: 'tshirt', error: error.message });
    }

    // Job 10: Generate Socks (Pop Art Posterize)
    try {
      await updateProgress(9, 'Generating socks design (pop art)...');
      
      const { data: socksData, error: socksError } = await supabase.functions.invoke(
        'generate-sock-design',
        {
          body: {
            albumCoverUrl: photoUrl,
            artistName: 'Custom Artist',
            albumTitle: 'Custom Photo',
            colorPalette: {
              primary_color: '#000000',
              secondary_color: '#FFFFFF',
              accent_color: '#808080',
              design_theme: 'custom-photo',
              color_palette: ['#000000', '#FFFFFF', '#808080'],
              pattern_type: 'custom-photo'
            }
          }
        }
      );

      if (socksError) throw socksError;
      
      results.socks.imageUrl = socksData.base_design_url;
      await updateProgress(10, 'Socks design completed, creating product...');
      console.log(`✅ Generated socks design`);

      // Create socks product
      try {
        const { data: socksProduct, error: productError } = await supabase.functions.invoke(
          'create-sock-products',
          {
            body: {
              sockId: socksData.sock_id,
              styleVariants: []
            }
          }
        );

        if (!productError && socksProduct?.product_id) {
          results.socks.productId = socksProduct.product_id;
          console.log(`✅ Created socks product: ${socksProduct.product_id}`);
        }
      } catch (productError) {
        console.error('Socks product creation failed:', productError);
        results.errors.push({ job: 'socks-product', error: productError.message });
      }
      
    } catch (error) {
      console.error('Socks generation failed:', error);
      results.errors.push({ job: 'socks', error: error.message });
    }

    // Mark batch as completed
    await supabase
      .from('photo_batch_queue')
      .update({
        status: results.errors.length > 0 ? 'completed_with_errors' : 'completed',
        completed_jobs: 10,
        current_job: 'All jobs completed',
        results: results,
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId);

    console.log(`✅ Batch ${batchId} completed with ${results.errors.length} errors`);

  } catch (error) {
    console.error(`💥 Fatal error in batch ${batchId}:`, error);
    
    await supabase
      .from('photo_batch_queue')
      .update({
        status: 'failed',
        current_job: `Failed: ${error.message}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId);
  }
}
