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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { lyricPosterId, styleVariants = [] } = await req.json();

    if (!lyricPosterId) {
      return new Response(
        JSON.stringify({ error: 'lyricPosterId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get lyric poster data
    const { data: poster, error: fetchError } = await supabase
      .from('lyric_posters')
      .select('*')
      .eq('id', lyricPosterId)
      .single();

    if (fetchError || !poster) {
      throw new Error('Lyric poster not found');
    }

    // Generate product slug
    const baseSlug = `songtekst-poster-${poster.artist_name}-${poster.song_title}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 70);

    // Generate unique slugs
    const { data: existingSlugs } = await supabase.rpc('generate_product_slug', {
      p_title: poster.song_title,
      p_artist: poster.artist_name
    });

    const standardSlug = existingSlugs || `${baseSlug}-poster`;
    const metalSlug = `${baseSlug}-metal-print`;

    // Prepare images array (main poster + style variants)
    const allImages = [poster.poster_url];
    if (styleVariants && styleVariants.length > 0) {
      allImages.push(...styleVariants.map((v: any) => v.url));
    }

    // Create description with copyright notice
    const description = `Typografische songtekst poster van "${poster.song_title}" door ${poster.artist_name}.

${poster.highlight_lines}

${poster.album_name ? `Van het album: ${poster.album_name}` : ''}

Deze unieke poster toont de volledige songtekst met prominente highlight-regels in een stijlvol typografisch design. ${poster.qr_code_url ? 'Inclusief QR-code die linkt naar het verhaal achter deze song.' : ''}

Kies uit ${styleVariants.length || 1} verschillende kunststijlen voor een uniek resultaat.

Perfect voor muziekliefhebbers en een bijzonder cadeau voor fans van ${poster.artist_name}.

${poster.license_type === 'public-domain' ? '✓ Publiek domein lyrics' : ''}`;

    // Product 1: Standard Poster
    const standardProduct = {
      title: `"${poster.song_title}" Lyrics Poster - ${poster.artist_name}`,
      slug: standardSlug,
      artist: poster.artist_name,
      description,
      media_type: 'POSTER',
      categories: ['lyric-poster', 'music-art', 'typography'],
      tags: ['lyrics', 'poster', poster.artist_name.toLowerCase(), 'music-art', 'typography'],
      price: 29.95,
      print_size: '50x70cm',
      primary_image: poster.poster_url,
      images: allImages,
      style_variants: styleVariants,
      stock_quantity: 999,
      status: 'active',
      published_at: new Date().toISOString(),
      metadata: {
        type: 'lyric_poster',
        lyric_poster_id: poster.id,
        artist: poster.artist_name,
        song: poster.song_title,
        album: poster.album_name,
        release_year: poster.release_year,
        qr_link: poster.qr_code_url,
        license_type: poster.license_type,
        copyright_notes: poster.copyright_notes
      }
    };

    const { data: standardProd, error: standardError } = await supabase
      .from('platform_products')
      .insert(standardProduct)
      .select()
      .single();

    if (standardError) throw standardError;

    // Product 2: Metal Print Deluxe
    const metalProduct = {
      ...standardProduct,
      title: `"${poster.song_title}" Metal Print Deluxe - ${poster.artist_name}`,
      slug: metalSlug,
      description: standardProduct.description + '\n\n✨ DELUXE METAALPRINT EDITIE ✨\nGedrukt op hoogwaardig aluminium dibond voor een luxe, moderne uitstraling. Strakke afwerking met diepere kleuren en een subtiele glans. Inclusief hangbeugel voor directe wandmontage.',
      price: 89.95,
      print_size: '50x70cm',
      metadata: {
        ...standardProduct.metadata,
        material: 'aluminum-dibond',
        finish: 'matte',
        mounting: 'hanging-system-included'
      }
    };

    const { data: metalProd, error: metalError } = await supabase
      .from('platform_products')
      .insert(metalProduct)
      .select()
      .single();

    if (metalError) throw metalError;

    // Update lyric_posters with product IDs
    await supabase
      .from('lyric_posters')
      .update({
        standard_product_id: standardProd.id,
        metal_product_id: metalProd.id,
        is_published: true
      })
      .eq('id', lyricPosterId);

    console.log('Created products:', standardProd.id, metalProd.id);

    return new Response(
      JSON.stringify({
        success: true,
        standard_product: {
          id: standardProd.id,
          slug: standardProd.slug,
          price: standardProd.price
        },
        metal_product: {
          id: metalProd.id,
          slug: metalProd.slug,
          price: metalProd.price
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-lyric-poster-products:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
