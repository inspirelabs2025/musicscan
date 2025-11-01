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
    const { discogs_id, catalog_number, artist, title, price = 49.95 } = await req.json();
    
    console.log('🎨 Starting ART product creation:', { discogs_id, catalog_number, artist, title });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Search Discogs for the release
    let releaseData: any;
    
    if (discogs_id) {
      console.log('📀 Searching by Discogs ID:', discogs_id);
      const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
        body: { direct_discogs_id: discogs_id.toString() }
      });
      if (error) throw new Error(`Discogs search failed: ${error.message}`);
      releaseData = data;
    } else if (catalog_number || (artist && title)) {
      console.log('🔍 Searching by catalog/artist/title');
      const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
        body: { catalog_number, artist, title }
      });
      if (error) throw new Error(`Discogs search failed: ${error.message}`);
      
      if (!data?.results || data.results.length === 0) {
        throw new Error('No results found on Discogs');
      }
      releaseData = data.results[0];
    } else {
      throw new Error('Please provide either discogs_id or catalog_number/artist/title');
    }

    console.log('✅ Found release:', releaseData.title);

    // Step 2: Create or find release in database
    const { data: releaseId, error: releaseError } = await supabase.functions.invoke('find-or-create-release', {
      body: {
        discogs_id: parseInt(releaseData.discogs_id),
        artist: releaseData.artist,
        title: releaseData.title,
        label: releaseData.label,
        catalog_number: releaseData.catalog_number,
        year: releaseData.year,
        format: releaseData.format,
        genre: releaseData.genre,
        country: releaseData.country,
        style: releaseData.style,
        discogs_url: releaseData.discogs_url,
        master_id: releaseData.master_id
      }
    });

    if (releaseError) throw new Error(`Failed to create release: ${releaseError.message}`);
    console.log('💾 Release saved:', releaseId);

    // Step 3: Fetch artwork
    console.log('🖼️ Fetching artwork...');
    const { data: artworkData, error: artworkError } = await supabase.functions.invoke('fetch-album-artwork', {
      body: {
        discogs_url: releaseData.discogs_url,
        artist: releaseData.artist,
        title: releaseData.title,
        item_id: null // We'll update the product later
      }
    });

    if (artworkError) {
      console.warn('⚠️ Artwork fetch failed:', artworkError.message);
    }

    const artworkUrl = artworkData?.artwork_url || releaseData.cover_image;
    console.log('🖼️ Artwork URL:', artworkUrl);

    // Step 4: Generate rich description with Perplexity
    console.log('🤖 Generating description with Perplexity...');
    const perplexityPrompt = `Write a compelling 150-word product description for a metal print of the album cover "${releaseData.title}" by ${releaseData.artist}. Include:
- Why this album cover is iconic and culturally significant
- The visual elements that make it perfect for wall art
- How it would look as a high-quality metal print
- Perfect for collectors and music lovers
Keep it engaging, focus on the art and design, and make it SEO-friendly. Use professional but enthusiastic tone.`;

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: 'You are an expert in music history and art descriptions for e-commerce.' },
          { role: 'user', content: perplexityPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    const perplexityData = await perplexityResponse.json();
    const enrichedDescription = perplexityData.choices?.[0]?.message?.content || 
      `Hoogwaardige metaalprint van de iconische albumhoes van ${releaseData.title} door ${releaseData.artist}. Perfect voor aan de muur en een must-have voor elke muziekliefhebber.`;

    console.log('✍️ Description generated');

    // Step 5: Check for existing product
    const { data: existingProducts } = await supabase
      .from('platform_products')
      .select('id')
      .eq('discogs_id', releaseData.discogs_id)
      .eq('media_type', 'art')
      .maybeSingle();

    if (existingProducts) {
      console.log('⚠️ Product already exists:', existingProducts.id);
      return new Response(
        JSON.stringify({ 
          error: 'Product already exists',
          product_id: existingProducts.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      );
    }

    // Step 6: Create ART product
    console.log('🎨 Creating ART product...');
    
    const productTitle = `${releaseData.artist} - ${releaseData.title} [Metaalprint]`;
    const slug = `${releaseData.artist}-${releaseData.title}-metaalprint`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 80);

    const { data: product, error: productError } = await supabase
      .from('platform_products')
      .insert({
        title: productTitle,
        artist: releaseData.artist,
        slug: slug,
        description: enrichedDescription,
        long_description: `# ${productTitle}\n\n${enrichedDescription}\n\n## Specificaties\n- **Materiaal**: Hoogwaardig aluminium\n- **Afmeting**: 30x30cm (standaard)\n- **Print kwaliteit**: HD, UV-bestendig\n- **Montage**: Klaar om op te hangen\n\n## Over dit album\n- **Artist**: ${releaseData.artist}\n- **Titel**: ${releaseData.title}\n- **Jaar**: ${releaseData.year || 'Onbekend'}\n- **Genre**: ${releaseData.genre || 'Onbekend'}\n- **Label**: ${releaseData.label || 'Onbekend'}`,
        media_type: 'art',
        format: 'Metal Print - 30x30cm',
        condition_grade: 'New',
        price: price,
        stock_quantity: 999,
        primary_image: artworkUrl,
        additional_images: artworkUrl ? [artworkUrl] : [],
        categories: ['album-art', 'metaalprint', releaseData.genre?.toLowerCase() || 'music'],
        tags: [releaseData.artist?.toLowerCase(), releaseData.genre?.toLowerCase(), 'wall-art', 'metal-print', 'music-art'],
        discogs_id: parseInt(releaseData.discogs_id),
        discogs_url: releaseData.discogs_url,
        status: 'active',
        published_at: new Date().toISOString(),
        is_featured: false,
        on_sale: false
      })
      .select()
      .single();

    if (productError) throw new Error(`Failed to create product: ${productError.message}`);

    console.log('✅ ART product created:', product.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        product_id: product.id,
        product_slug: product.slug,
        message: `ART product created: ${productTitle}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ Error creating ART product:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
