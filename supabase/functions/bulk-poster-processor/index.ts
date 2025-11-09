import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DESCRIPTION_TEMPLATE = (artistName: string) => `
Breng kracht, stijl en energie in je interieur met deze opvallende ${artistName} pop art poster. Een explosie van kleur en attitude — perfect voor wie houdt van muziek, kunst en iconische podiummomenten.

Met zijn levendige neonkleuren en expressieve lijnen is dit kunstwerk een echte blikvanger aan elke muur, van woonkamer tot studio.
Gedrukt op hoogwaardig posterpapier met diepe contrasten en heldere afwerking.

**Details**
- Formaat: 50 × 70 cm
- Type: Poster
- Materiaal: Premium kunstdrukpapier
- Stijl: Pop Art / Muziek Icon

Perfect voor: muziekliefhebbers, pop art fans en iedereen die wat extra power aan zijn muur wil hangen.
`.trim();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Starting bulk poster processor tick...');

    // Fetch one pending item
    const { data: queueItems, error: fetchError } = await supabase
      .from('poster_processing_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 3)
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching queue:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch queue', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('📭 No pending items in queue');
      return new Response(
        JSON.stringify({ message: 'No pending items', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const item = queueItems[0];
    console.log(`🎨 Processing: ${item.artist_name} (attempt ${item.retry_count + 1}/3)`);

    // Mark as processing
    await supabase
      .from('poster_processing_queue')
      .update({ status: 'processing' })
      .eq('id', item.id);

    try {
      // 1. Download image from storage
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('shop-products')
        .download(item.storage_path);

      if (downloadError || !imageData) {
        throw new Error(`Failed to download image: ${downloadError?.message}`);
      }

      // Convert to base64 (chunked to avoid stack overflow)
      const arrayBuffer = await imageData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
      }
      
      const base64 = btoa(binary);
      const imageBase64 = `data:${imageData.type};base64,${base64}`;

      console.log('📥 Image downloaded, generating style variants...');

      // 2. Generate 7 style variants
      const { data: stylesData, error: stylesError } = await supabase.functions.invoke(
        'batch-generate-poster-styles',
        {
          body: {
            posterUrl: imageBase64,
            eventId: item.id,
            artistName: item.artist_name
          }
        }
      );

      if (stylesError || !stylesData?.success) {
        throw new Error(`Style generation failed: ${stylesError?.message || 'Unknown error'}`);
      }

      const styleVariants = stylesData.styleVariants || [];
      console.log(`✨ Generated ${styleVariants.length} style variants`);

      if (styleVariants.length === 0) {
        throw new Error('No style variants generated');
      }

      // 3. Create product with first variant as primary
      const primaryVariant = styleVariants[0];
      const title = `${item.artist_name} Pop Art Poster (50x70 cm)`;
      const description = DESCRIPTION_TEMPLATE(item.artist_name);

      console.log('🛍️ Creating product...');

      const { data: productData, error: productError } = await supabase.functions.invoke(
        'create-poster-product',
        {
          body: {
            stylizedImageBase64: primaryVariant.url,
            artist: item.artist_name,
            title: title,
            description: description,
            style: 'multi-style',
            price: 49.95,
            styleVariants: styleVariants.slice(1) // Exclude first variant (used as primary)
          }
        }
      );

      if (productError || !productData?.success) {
        throw new Error(`Product creation failed: ${productError?.message || 'Unknown error'}`);
      }

      console.log(`✅ Product created: ${productData.productId}`);

      // 4. Mark as completed
      await supabase
        .from('poster_processing_queue')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          product_id: productData.productId
        })
        .eq('id', item.id);

      return new Response(
        JSON.stringify({
          success: true,
          processed: 1,
          artistName: item.artist_name,
          productId: productData.productId,
          stylesGenerated: styleVariants.length
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (processingError) {
      console.error('❌ Processing error:', processingError);

      const newRetryCount = item.retry_count + 1;
      const isFinalFailure = newRetryCount >= 3;

      await supabase
        .from('poster_processing_queue')
        .update({
          status: isFinalFailure ? 'failed' : 'pending',
          retry_count: newRetryCount,
          error_message: processingError.message,
          processed_at: isFinalFailure ? new Date().toISOString() : null
        })
        .eq('id', item.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: processingError.message,
          artistName: item.artist_name,
          retryCount: newRetryCount,
          willRetry: !isFinalFailure
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Bulk poster processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
