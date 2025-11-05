import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Processing Discogs Queue...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Pick 1 pending item (oldest first)
    const { data: item, error: fetchError } = await supabase
      .from('discogs_import_log')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch queue item: ${fetchError.message}`);
    }

    if (!item) {
      console.log('No pending items in queue');
      return new Response(
        JSON.stringify({ success: true, message: 'Queue is empty' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing: ${item.artist} - ${item.title} (Release ID: ${item.discogs_release_id})`);

    // ✅ STRICT VALIDATION: Ensure release ID is a valid positive integer
    if (!item.discogs_release_id || typeof item.discogs_release_id !== 'number' || item.discogs_release_id <= 0) {
      console.error(`❌ Invalid release ID: ${item.discogs_release_id}, marking as failed`);
      
      await supabase
        .from('discogs_import_log')
        .update({
          status: 'failed',
          error_message: `Invalid release ID: ${item.discogs_release_id} (must be positive integer)`,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      return new Response(
        JSON.stringify({
          success: false,
          status: 'failed',
          item_id: item.id,
          error: 'Invalid release ID format',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`✅ Validated Release ID: ${item.discogs_release_id}`);

    // 2. Update status to processing
    const { error: updateError } = await supabase
      .from('discogs_import_log')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', item.id);

    if (updateError) {
      console.error('Failed to update status to processing:', updateError);
    }

    // 3. Call create-art-product with Release ID
    try {
      console.log(`Calling create-art-product for Release ID: ${item.discogs_release_id}...`);

      const { data: productData, error: productError } = await supabase.functions.invoke('create-art-product', {
        body: {
          discogs_id: item.discogs_release_id, // ✅ Release ID (integer, no prefix)
          price: 49.95,
        }
      });

      if (productError) {
        throw productError;
      }

      // 4. Update status based on response
      if (productData?.already_exists) {
        console.log(`Product already exists, marking as skipped`);
        
        await supabase
          .from('discogs_import_log')
          .update({
            status: 'skipped',
            product_id: productData.product_id,
            error_message: 'Product already exists',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        return new Response(
          JSON.stringify({
            success: true,
            status: 'skipped',
            item_id: item.id,
            discogs_release_id: item.discogs_release_id,
            product_id: productData.product_id,
            message: 'Product already exists',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Product created successfully: ${productData.product_id}`);

      await supabase
        .from('discogs_import_log')
        .update({
          status: 'completed',
          product_id: productData.product_id,
          blog_id: productData.blog_id || null,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', item.id);

      // 5. Rate limiting: 30 second delay before next item
      console.log('Waiting 30 seconds before next item (OpenAI rate limiting)...');
      await new Promise(resolve => setTimeout(resolve, 30000));

      return new Response(
        JSON.stringify({
          success: true,
          status: 'completed',
          item_id: item.id,
          discogs_release_id: item.discogs_release_id,
          product_id: productData.product_id,
          blog_id: productData.blog_id,
          product_slug: productData.product_slug,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error: any) {
      console.error('Error creating product:', error);

      // Retry logic
      const newRetryCount = item.retry_count + 1;
      const errorMessage = error?.message || 'Unknown error';

      if (newRetryCount < item.max_retries) {
        console.log(`Retry ${newRetryCount}/${item.max_retries} for item ${item.id}`);

        await supabase
          .from('discogs_import_log')
          .update({
            status: 'pending', // Back to pending for retry
            retry_count: newRetryCount,
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        return new Response(
          JSON.stringify({
            success: false,
            status: 'retry_scheduled',
            item_id: item.id,
            retry_count: newRetryCount,
            error: errorMessage,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      } else {
        console.log(`Max retries reached for item ${item.id}, marking as failed`);

        await supabase
          .from('discogs_import_log')
          .update({
            status: 'failed',
            error_message: errorMessage,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        return new Response(
          JSON.stringify({
            success: false,
            status: 'failed',
            item_id: item.id,
            error: errorMessage,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('Error in process-discogs-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
