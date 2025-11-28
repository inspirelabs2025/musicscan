import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tshirtId, styleVariants } = await req.json();

    console.log('📦 Creating T-shirt product for:', tshirtId);

    if (!tshirtId) {
      throw new Error('Missing tshirtId');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get T-shirt details
    const { data: tshirt, error: tshirtError } = await supabase
      .from('album_tshirts')
      .select('*')
      .eq('id', tshirtId)
      .single();

    if (tshirtError || !tshirt) {
      throw new Error('T-shirt not found');
    }

    const { artist_name, album_title, base_design_url, slug, genre } = tshirt;

    // Create T-shirt product (single version at €29.95)
    const productTitle = `${album_title} T-Shirt - ${artist_name}`;
    const productSlug = slug;

    // Use style variants if available, otherwise use base design
    const hasVariants = styleVariants && styleVariants.length > 0;
    const primaryImage = hasVariants ? styleVariants[0].url : base_design_url;
    const allImages = hasVariants ? styleVariants.map((v: any) => v.url) : [base_design_url];

    const variantText = hasVariants 
      ? `\n🎨 ${styleVariants.length} verschillende style interpretaties beschikbaar\nKies uit: ${styleVariants.map((v: any) => v.style).join(', ')}.`
      : '\n🎨 Uniek album artwork design';

    const productDescription = `Premium T-shirt met artwork van "${album_title}" van ${artist_name}.

✨ Hoogwaardige katoenen T-shirt
👕 Unisex pasvorm
🎵 Muziek merchandise voor echte fans${variantText}

Draag je favoriete album met trots op dit comfortabele T-shirt!`;

    const categories = hasVariants 
      ? ['tshirts', 'music-merch', 'album-inspired', 'apparel', 'style-collection']
      : ['tshirts', 'music-merch', 'album-inspired', 'apparel'];

    const { data: product, error: productError } = await supabase
      .from('platform_products')
      .insert({
        title: productTitle,
        slug: productSlug,
        description: productDescription,
        price: 29.95,
        currency: 'EUR',
        stock_quantity: 999,
        allow_backorder: true,
        primary_image: primaryImage,
        images: allImages,
        artist: artist_name,
        media_type: 'merchandise',
        categories,
        tags: ['tshirts', 'music-merch', 'album-inspired', 'apparel', genre].filter(Boolean),
        is_featured: hasVariants,
        status: 'active',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating T-shirt product:', productError);
      throw productError;
    }

    console.log('✅ T-shirt product created:', product.id);

    // Update T-shirt record with product ID
    await supabase
      .from('album_tshirts')
      .update({ 
        product_id: product.id,
        is_published: true
      })
      .eq('id', tshirtId);

    return new Response(
      JSON.stringify({
        product_id: product.id,
        slug: product.slug,
        // Keep backwards compatibility
        standard_product_id: product.id,
        standard_slug: product.slug
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-tshirt-products:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
