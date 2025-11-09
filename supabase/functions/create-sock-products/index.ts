import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateProductSlug(artist: string, album: string, type: 'standard' | 'premium'): string {
  const suffix = type === 'premium' ? '-premium-merino' : '';
  const base = `${artist}-${album}-socks${suffix}`
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

    // Create Standard Cotton Socks
    const standardSlug = generateProductSlug(sockData.artist_name, sockData.album_title, 'standard');
    const standardDescription = `Comfortabele katoenen sokken geïnspireerd op het iconische album "${sockData.album_title}" van ${sockData.artist_name}.

🎨 Kleuren gebaseerd op originele albumcover
🧦 One size fits most (EU 38-46)
🌱 80% katoen, 18% polyamide, 2% elastaan
💫 Uniek ${sockData.design_theme} design

${styleVariants?.length > 0 ? 'Kies uit 7 verschillende stijlen!' : ''}

Perfect voor muziekliefhebbers die hun passie willen dragen!`;

    const { data: standardProduct, error: standardError } = await supabase
      .from('platform_products')
      .insert({
        title: `${sockData.album_title} Socks - ${sockData.artist_name}`,
        artist: sockData.artist_name,
        description: standardDescription,
        media_type: 'merchandise',
        categories: ['socks', 'music-merch', 'album-inspired'],
        tags: [
          sockData.artist_name.toLowerCase(),
          'socks',
          'cotton-blend',
          'one-size',
          'music-fashion',
          sockData.genre?.toLowerCase() || 'music',
          sockData.design_theme
        ],
        price: 14.95,
        stock_quantity: 999,
        slug: standardSlug,
        images: images,
        primary_image: images[0],
        status: 'active',
        published_at: new Date().toISOString(),
        discogs_id: sockData.discogs_id,
        year: sockData.release_year,
        genre: sockData.genre
      })
      .select()
      .single();

    if (standardError) {
      console.error('Failed to create standard product:', standardError);
      throw new Error(`Failed to create standard product: ${standardError.message}`);
    }

    console.log('✅ Standard cotton socks created');

    // Create Premium Merino Wool Socks
    const premiumSlug = generateProductSlug(sockData.artist_name, sockData.album_title, 'premium');
    const premiumDescription = `Luxe merino wol sokken geïnspireerd op "${sockData.album_title}" van ${sockData.artist_name}.

✨ Premium merino wool blend (70% merino, 25% polyamide, 5% elastaan)
🌟 Temperatuurregulerende eigenschappen
💪 Extra versterkte hiel en teen
🎁 Gift-ready verpakking
🎨 Exclusief ${sockData.design_theme} design

${styleVariants?.length > 0 ? 'Verkrijgbaar in 7 unieke stijlen!' : ''}

Perfect voor de serieuze muziek- en sockliefhebber. Extreem comfortabel en duurzaam.`;

    const { data: premiumProduct, error: premiumError } = await supabase
      .from('platform_products')
      .insert({
        title: `${sockData.album_title} Premium Merino Socks - ${sockData.artist_name}`,
        artist: sockData.artist_name,
        description: premiumDescription,
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
        slug: premiumSlug,
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

    if (premiumError) {
      console.error('Failed to create premium product:', premiumError);
      throw new Error(`Failed to create premium product: ${premiumError.message}`);
    }

    console.log('✅ Premium merino socks created');

    // Update album_socks record with product IDs
    const { error: updateError } = await supabase
      .from('album_socks')
      .update({
        standard_product_id: standardProduct.id,
        premium_product_id: premiumProduct.id,
        is_published: true
      })
      .eq('id', sockId);

    if (updateError) {
      console.error('Failed to update sock record:', updateError);
    }

    console.log('🎉 Products created and linked successfully');

    return new Response(
      JSON.stringify({
        success: true,
        standard_product_id: standardProduct.id,
        standard_slug: standardSlug,
        premium_product_id: premiumProduct.id,
        premium_slug: premiumSlug,
        products_created: 2
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
