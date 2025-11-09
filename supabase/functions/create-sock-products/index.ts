import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateProductSlug(artist: string, album: string): string {
  const base = `${artist}-${album}-socks`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.substring(0, 80);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sockId, styleVariants } = await req.json();

    if (!sockId) {
      return new Response(
        JSON.stringify({ error: 'sockId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📦 Creating sock products for:', sockId);

    // Get sock details
    const { data: sockData, error: sockError } = await supabase
      .from('album_socks')
      .select('*')
      .eq('id', sockId)
      .single();

    if (sockError || !sockData) {
      throw new Error('Sock not found');
    }

    const images = styleVariants?.length > 0 
      ? styleVariants.map((v: any) => v.url)
      : [sockData.base_design_url];

    // Create Premium Merino Wool Socks
    const productSlug = generateProductSlug(sockData.artist_name, sockData.album_title);
    const description = `Premium merino wol sokken geïnspireerd op "${sockData.album_title}" van ${sockData.artist_name}.

✨ 70% merino wool, 25% polyamide, 5% elastaan
🌟 Temperatuurregulerende eigenschappen
💪 Extra versterkte hiel en teen
🎁 Luxe geschenkverpakking
🎨 Exclusief ${sockData.design_theme} design

${styleVariants?.length > 0 ? 'Verkrijgbaar in 7 unieke stijlen!' : ''}

Perfect voor muziekliefhebbers. Extreem comfortabel en duurzaam.`;

    const { data: product, error: productError } = await supabase
      .from('platform_products')
      .insert({
        title: `${sockData.album_title} Socks - ${sockData.artist_name}`,
        artist: sockData.artist_name,
        description: description,
        media_type: 'merchandise',
        categories: ['socks', 'music-merch', 'album-inspired', 'premium'],
        tags: [
          sockData.artist_name.toLowerCase(),
          'socks',
          'merino-wool',
          'one-size',
          'premium',
          'music-fashion',
          sockData.genre?.toLowerCase() || 'music',
          sockData.design_theme
        ],
        price: 24.95,
        stock_quantity: 999,
        slug: productSlug,
        images: images,
        primary_image: images[0],
        status: 'active',
        published_at: new Date().toISOString(),
        is_featured: true,
        discogs_id: sockData.discogs_id,
        year: sockData.release_year,
        genre: sockData.genre
      })
      .select()
      .single();

    if (productError) {
      console.error('Failed to create product:', productError);
      throw new Error(`Failed to create product: ${productError.message}`);
    }

    console.log('✅ Premium merino socks created');

    // Update album_socks record with product ID
    const { error: updateError } = await supabase
      .from('album_socks')
      .update({
        product_id: product.id,
        is_published: true
      })
      .eq('id', sockId);

    if (updateError) {
      console.error('Failed to update sock record:', updateError);
    }

    console.log('🎉 Product created and linked successfully');

    return new Response(
      JSON.stringify({
        success: true,
        product_id: product.id,
        slug: productSlug,
        products_created: 1
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error creating sock products:', error);
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
