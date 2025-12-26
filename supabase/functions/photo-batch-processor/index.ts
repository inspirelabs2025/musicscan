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

    const { action, photoUrl, batchId, artist, title, description, queueItemId } = await req.json();

    // NEW: Process existing queue item (used by photo-queue-auto-processor)
    if (action === 'process-existing' && queueItemId) {
      console.log(`🚀 Processing existing queue item ${queueItemId} for photo: ${photoUrl}`);

      // Start background processing for existing item
      EdgeRuntime.waitUntil(processPhotoBatchForExistingItem(queueItemId, photoUrl, artist, title, description, supabase));

      return new Response(JSON.stringify({
        success: true,
        queueItemId: queueItemId,
        message: 'Batch processing started in background for existing item'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'start') {
      // Create batch record
      const newBatchId = crypto.randomUUID();
      
      const { error: batchError } = await supabase
        .from('photo_batch_queue')
        .insert({
          id: newBatchId,
          photo_url: photoUrl,
          status: 'processing',
          total_jobs: 11, // 7 posters + 1 canvas + 1 tshirt + 1 socks + 1 buttons
          completed_jobs: 0
        });

      if (batchError) {
        console.error('❌ photo_batch_queue insert failed:', {
          message: batchError.message,
          code: batchError.code,
          details: batchError.details,
          hint: batchError.hint
        });
        
        return new Response(JSON.stringify({ 
          success: false,
          error: batchError.message,
          code: batchError.code,
          details: batchError.details,
          hint: batchError.hint
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`🚀 Started batch ${newBatchId} for photo: ${photoUrl}`);

      // Start all background processes
      EdgeRuntime.waitUntil(processPhotoBatch(newBatchId, photoUrl, artist, title, description, supabase));

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

// Process existing queue item (updates the existing item instead of creating new)
async function processPhotoBatchForExistingItem(
  queueItemId: string, 
  photoUrl: string,
  artist: string,
  title: string,
  description: string,
  supabase: any
) {
  // Reuse processPhotoBatch but with the existing queueItemId as batchId
  // The existing function updates photo_batch_queue by ID, so this will work correctly
  await processPhotoBatch(queueItemId, photoUrl, artist, title, description, supabase);
}

async function processPhotoBatch(
  batchId: string, 
  photoUrl: string,
  artist: string,
  title: string,
  description: string,
  supabase: any
) {
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
      
      // Sync to batch_queue_items after each progress update
      await syncBatchQueueStatus(batchId, supabase);
    };

    const results: any = {
      posters: { variants: [], productIds: [] },
      canvas: { imageUrl: null, productId: null },
      tshirt: { baseDesign: null, variants: [], productIds: [] },
      socks: { imageUrl: null, productId: null },
      buttons: { baseDesign: null, variants: [], productIds: [] },
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
      await updateProgress(7, 'Poster styles completed, creating product...');
      console.log(`✅ Generated ${results.posters.variants.length} poster styles`);

      // Create ONE poster product with all style variants
      try {
        const { data: posterProduct, error: productError } = await supabase.functions.invoke(
          'create-poster-product',
          {
            body: {
              stylizedImageBase64: results.posters.variants[0]?.url, // Use first variant as main image
              artist: artist,
              title: title,
              description: description,
              style: results.posters.variants[0]?.style,
              price: 49.95,
              styleVariants: results.posters.variants // Pass ALL variants
            }
          }
        );

        if (!productError && posterProduct?.product_id) {
          results.posters.productIds.push(posterProduct.product_id);
          console.log(`✅ Created poster product with ${results.posters.variants.length} style variants: ${posterProduct.product_id}`);
        } else if (productError) {
          throw productError;
        }
      } catch (productError) {
        console.error('Poster product creation failed:', productError);
        results.errors.push({ job: 'posters-product', error: productError.message });
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
              artist: artist,
              title: title,
              description: description,
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
            albumTitle: title,
            artistName: artist,
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

    // Job 10: Generate Socks (Pop Art Posterize) with retry logic
    try {
      await updateProgress(9, 'Generating socks design (pop art)...');
      
      let socksData = null;
      let socksError = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`🧦 Socks generation attempt ${attempt}/${maxRetries}`);
        
        const response = await supabase.functions.invoke(
          'generate-sock-design',
          {
            body: {
              albumCoverUrl: photoUrl,
              artistName: artist,
              albumTitle: title,
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
        
        socksData = response.data;
        socksError = response.error;
        
        if (!socksError && socksData?.base_design_url) {
          console.log(`✅ Socks generated successfully on attempt ${attempt}`);
          break;
        }
        
        console.error(`❌ Socks attempt ${attempt} failed:`, socksError?.message || 'No image generated');
        
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting 5 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      if (socksError || !socksData?.base_design_url) {
        throw new Error(socksError?.message || 'No image generated after 3 attempts');
      }
      
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

    // Job 11: Generate Buttons + 7 style variants
    try {
      await updateProgress(10, 'Generating button design + 7 styles...');
      
      // Generate circular base + 7 style variants directly
      // The batch-generate-button-styles function will create the circular base first
      const { data: buttonVariants, error: variantsError } = await supabase.functions.invoke(
        'batch-generate-button-styles',
        {
          body: {
            baseDesignUrl: photoUrl, // Send original photo, function will make it circular
            buttonId: `batch-${batchId}`
          }
        }
      );

      if (variantsError) throw variantsError;

      results.buttons.variants = buttonVariants.styleVariants || [];
      
      // Extract the circular base URL (first variant with style 'original')
      const circularBase = buttonVariants.styleVariants?.find(v => v.style === 'original');
      const baseButtonUrl = circularBase?.url || photoUrl;
      results.buttons.baseDesign = baseButtonUrl;
      
      await updateProgress(11, 'Button styles completed, creating products...');
      console.log(`✅ Generated buttons with ${results.buttons.variants.length} variants`);

      // Create button products
      try {
        const { data: buttonProducts, error: productError } = await supabase.functions.invoke(
          'create-button-products',
          {
            body: {
              baseDesignUrl: baseButtonUrl,
              artist: artist,
              title: title,
              description: description,
              styleVariants: buttonVariants.styleVariants || []
            }
          }
        );

        if (!productError && buttonProducts?.product_id) {
          results.buttons.productId = buttonProducts.product_id;
          results.buttons.productSlug = buttonProducts.product_slug;
          console.log(`✅ Created button product: ${buttonProducts.product_slug}`);
        }
      } catch (productError) {
        console.error('Button product creation failed:', productError);
        results.errors.push({ job: 'button-products', error: productError.message });
      }
      
    } catch (error) {
      console.error('Button generation failed:', error);
      results.errors.push({ job: 'buttons', error: error.message });
    }

    // Mark batch as completed
    await supabase
      .from('photo_batch_queue')
      .update({
        status: results.errors.length > 0 ? 'completed_with_errors' : 'completed',
        completed_jobs: 11,
        current_job: 'All jobs completed',
        results: results,
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId);

    console.log(`✅ Batch ${batchId} completed with ${results.errors.length} errors`);
    
    // Sync final status to batch_queue_items
    await syncBatchQueueStatus(batchId, supabase);

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
    
    // Sync failed status
    await syncBatchQueueStatus(batchId, supabase);
  }
}

// Sync status between photo_batch_queue and batch_queue_items
async function syncBatchQueueStatus(batchId: string, supabase: any) {
  try {
    // Get photo_batch_queue status
    const { data: photoBatch } = await supabase
      .from('photo_batch_queue')
      .select('status')
      .eq('id', batchId)
      .single();

    if (!photoBatch) return;

    // Find batch_queue_item by item_id (which is the photo_batch_queue.id)
    const { data: queueItem } = await supabase
      .from('batch_queue_items')
      .select('id')
      .eq('item_id', batchId)
      .single();

    if (queueItem) {
      // Map completed_with_errors to completed for batch_queue_items
      const mappedStatus = photoBatch.status === 'completed_with_errors' ? 'completed' : photoBatch.status;
      const isTerminal = mappedStatus === 'completed' || mappedStatus === 'failed';
      
      // Update batch_queue_item status (only status and processed_at)
      await supabase
        .from('batch_queue_items')
        .update({
          status: mappedStatus,
          processed_at: isTerminal ? new Date().toISOString() : null
        })
        .eq('id', queueItem.id);

      console.log(`🔄 Synced status to batch_queue_item: ${queueItem.id} (${mappedStatus})`);
    }
  } catch (error) {
    console.error('Failed to sync batch queue status:', error);
  }
}
