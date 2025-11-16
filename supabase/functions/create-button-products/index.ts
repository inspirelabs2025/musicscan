import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      baseDesignUrl, 
      artist, 
      title, 
      styleVariants = [],
      description 
    } = await req.json();

    if (!baseDesignUrl || !artist || !title) {
      throw new Error('baseDesignUrl, artist, and title are required');
    }

    console.log('🔘 Creating button products:', { artist, title });

    const products = [];

    // Create products for both sizes (35mm and 45mm)
    const sizes = [
      { size: '3.5cm', price: 4.50, label: '35mm' },
      { size: '4cm', price: 5.50, label: '45mm' }
    ];

    for (const { size, price, label } of sizes) {
      // Generate unique slug
      const baseSlug = `button-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${label}`;
      let slug = baseSlug;
      let counter = 1;

      // Check for uniqueness
      while (true) {
        const { data: existing } = await supabase
          .from('platform_products')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const productData = {
        title: `${artist} - ${title} Button (${label})`,
        slug,
        artist,
        description: description || `Hoogwaardige button badge van ${artist} - ${title}. Professionele kwaliteit met veiligheidspin op de achterkant. Diameter: ${size}.`,
        price,
        primary_image: baseDesignUrl,
        media_type: 'merchandise',
        categories: ['buttons', 'badges', 'merchandise'],
        stock_quantity: 100,
        status: 'active',
        published_at: new Date().toISOString(),
        metadata: {
          size,
          pin_type: 'safety_pin',
          style_variants: styleVariants,
          original_artist: artist,
          original_title: title,
          product_dimensions: {
            diameter: size,
            thickness: '3mm'
          }
        }
      };

      const { data: product, error: productError } = await supabase
        .from('platform_products')
        .insert(productData)
        .select()
        .single();

      if (productError) {
        console.error('Error creating product:', productError);
        throw productError;
      }

      products.push(product);
      console.log(`✅ Created button product: ${product.slug}`);
    }

    console.log(`✅ Successfully created ${products.length} button products`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        products,
        product_ids: products.map(p => p.id),
        product_slugs: products.map(p => p.slug)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-button-products:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
