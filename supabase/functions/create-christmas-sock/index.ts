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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { artist, title, imageUrl } = await req.json();

    if (!artist || !title || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'artist, title and imageUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🧦🎄 Creating Christmas sock via generate-sock-design: ${artist} - ${title}`);

    const christmasPalette = {
      primary_color: '#C41E3A',
      secondary_color: '#228B22',
      accent_color: '#FFD700',
      color_palette: ['#C41E3A', '#228B22', '#FFD700'],
      design_theme: 'posterize',
      pattern_type: 'christmas'
    };

    // Step 1: Generate the SAME sock mockup output as /socks (generate-sock-design)
    const { data: sockResult, error: sockError } = await supabase.functions.invoke('generate-sock-design', {
      body: {
        artistName: artist,
        albumTitle: title,
        albumCoverUrl: imageUrl,
        colorPalette: christmasPalette,
        genre: 'Christmas'
      }
    });

    if (sockError) {
      console.error('❌ generate-sock-design failed:', sockError);
      throw new Error(`Sock generation failed: ${sockError.message}`);
    }

    const sockId = sockResult?.sock_id as string | undefined;
    if (!sockId) {
      throw new Error('Sock generation failed: missing sock_id');
    }

    // Step 2: Create shop product(s) for the sock
    const { data: productResult, error: productError } = await supabase.functions.invoke('create-sock-products', {
      body: {
        sockId,
        styleVariants: null
      }
    });

    if (productError) {
      console.error('❌ Failed to create sock product:', productError);
      // Still return success since the sock record was created
      return new Response(
        JSON.stringify({
          success: true,
          sockId,
          productIds: [],
          slug: sockResult?.slug,
          message: 'Sock design generated but product creation failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎉 Christmas sock created successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        sockId,
        productId: productResult?.product_id,
        productIds: productResult?.product_id ? [productResult.product_id] : [],
        slug: sockResult?.slug
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error creating Christmas sock:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

