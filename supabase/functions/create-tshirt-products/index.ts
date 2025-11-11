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

    console.log('📦 Creating T-shirt products for:', tshirtId);

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

    // Create standard product
    const standardTitle = `${album_title} T-Shirt - ${artist_name}`;
    const standardSlug = `${slug}-standard`;

    const standardDescription = `Premium T-shirt met artwork van "${album_title}" van ${artist_name}.

✨ Hoogwaardige katoenen T-shirt
🎨 Full-color album artwork print op de borst
👕 Unisex pasvorm
🎵 Muziek merchandise voor echte fans

Draag je favoriete album met trots op dit comfortabele T-shirt!`;

    const { data: standardProduct, error: standardError } = await supabase
      .from('platform_products')
      .insert({
        title: standardTitle,
        slug: standardSlug,
        description: standardDescription,
        price: 24.95,
        currency: 'EUR',
        stock_quantity: 999,
        allow_backorder: true,
        primary_image: base_design_url,
        images: [base_design_url],
        artist: artist_name,
        media_type: 'merchandise',
        categories: ['tshirts', 'music-merch', 'album-inspired', 'apparel'],
        tags: ['tshirts', 'music-merch', 'album-inspired', 'apparel', genre].filter(Boolean),
        is_featured: false,
        status: 'active',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (standardError) {
      console.error('Error creating standard product:', standardError);
      throw standardError;
    }

    console.log('✅ Standard T-shirt product created:', standardProduct.id);

    // Update T-shirt record with product ID
    await supabase
      .from('album_tshirts')
      .update({ 
        product_id: standardProduct.id,
        is_published: true
      })
      .eq('id', tshirtId);

    const result: any = {
      standard_product_id: standardProduct.id,
      standard_slug: standardProduct.slug
    };

    // If style variants exist, create premium product with variants
    if (styleVariants && styleVariants.length > 0) {
      const premiumTitle = `${album_title} T-Shirt Collection - ${artist_name}`;
      const premiumSlug = `${slug}-premium`;

      const premiumDescription = `Premium T-shirt collectie met ${styleVariants.length} unieke style varianten van "${album_title}" van ${artist_name}.

✨ Hoogwaardige katoenen T-shirts
🎨 ${styleVariants.length} verschillende style interpretaties
👕 Unisex pasvorm
🎵 Exclusieve muziek merchandise collectie

Kies uit ${styleVariants.length} unieke styles: ${styleVariants.map((v: any) => v.style).join(', ')}.`;

      const { data: premiumProduct, error: premiumError } = await supabase
        .from('platform_products')
        .insert({
          title: premiumTitle,
          slug: premiumSlug,
          description: premiumDescription,
          price: 29.95,
          currency: 'EUR',
          stock_quantity: 999,
          allow_backorder: true,
          primary_image: styleVariants[0].url,
          images: styleVariants.map((v: any) => v.url),
          artist: artist_name,
          media_type: 'merchandise',
          categories: ['tshirts', 'premium', 'music-merch', 'album-inspired', 'style-collection'],
          tags: ['tshirts', 'premium', 'music-merch', 'album-inspired', 'style-collection', genre].filter(Boolean),
          is_featured: true,
          status: 'active',
          published_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!premiumError && premiumProduct) {
        console.log('✅ Premium T-shirt product created:', premiumProduct.id);
        result.premium_product_id = premiumProduct.id;
        result.premium_slug = premiumProduct.slug;
      }
    }

    return new Response(
      JSON.stringify(result),
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
