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
    const { discogs_id, catalog_number, artist, title, price = 49.95, master_id } = await req.json();
    
    console.log('🎨 Starting ART product creation:', { discogs_id, catalog_number, artist, title, master_id });
    
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Search Discogs for the release
    let releaseData: any;
    let masterMetadata: any = null;
    
    // If master_id is provided, fetch master data first
    if (master_id) {
      console.log('🎭 Fetching Master metadata:', master_id);
      try {
        const masterResponse = await fetch(`https://api.discogs.com/masters/${master_id}`, {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylValue/1.0'
          }
        });
        
        if (masterResponse.ok) {
          masterMetadata = await masterResponse.json();
          console.log('✅ Master metadata retrieved:', {
            artists: masterMetadata.artists?.map((a: any) => a.name).join(', '),
            title: masterMetadata.title
          });
        }
      } catch (e) {
        console.warn('⚠️ Failed to fetch master metadata:', (e as Error).message);
      }
      
      // Search using master_id to get the main release
      console.log('📀 Searching via Master ID:', master_id);
      const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
        body: { direct_discogs_id: master_id.toString() }
      });
      if (error) throw new Error(`Discogs search failed: ${error.message}`);
      const first = data?.results?.[0];
      if (!first) throw new Error('No results found on Discogs');
      releaseData = first;
    } else if (discogs_id) {
      console.log('📀 Searching by Discogs ID:', discogs_id);
      const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
        body: { direct_discogs_id: discogs_id.toString() }
      });
      if (error) throw new Error(`Discogs search failed: ${error.message}`);
      const first = data?.results?.[0];
      if (!first) throw new Error('No results found on Discogs');
      releaseData = first;
      
      // Log what we received from the search
      console.log('🔍 Received from search:', {
        release_id: releaseData.discogs_id,
        master_id: releaseData.master_id,
        original_master_id: releaseData.original_master_id
      });
    } else if (catalog_number || (artist && title)) {
      console.log('🔍 Searching by catalog/artist/title');
      const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
        body: { catalog_number, artist, title }
      });
      if (error) throw new Error(`Discogs search failed: ${error.message}`);
      
      if (!data?.results || data.results.length === 0) {
        console.log('❌ No results found on Discogs');
        return new Response(
          JSON.stringify({ 
            error: 'No results found on Discogs',
            details: 'Please check the artist and title spelling'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      releaseData = data.results[0];
    } else {
      throw new Error('Please provide either discogs_id or catalog_number/artist/title');
    }

    console.log('✅ Found release:', releaseData.title);
    
    // Determine master_id from all available sources
    const masterIdCandidate = master_id || releaseData.original_master_id || releaseData.master_id;
    
    // If we have a master_id but haven't fetched metadata yet, fetch it now
    if (masterIdCandidate && !masterMetadata) {
      console.log('🎯 Fetching Master metadata for ID:', masterIdCandidate);
      try {
        const masterResponse = await fetch(`https://api.discogs.com/masters/${masterIdCandidate}`, {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylValue/1.0'
          }
        });
        
        if (masterResponse.ok) {
          masterMetadata = await masterResponse.json();
          console.log('✅ Master metadata retrieved for naming:', {
            artists: masterMetadata.artists?.map((a: any) => a.name).join(', '),
            title: masterMetadata.title
          });
        } else {
          console.log(`⚠️ Master metadata fetch returned ${masterResponse.status}, will use release data for naming`);
        }
      } catch (e) {
        console.warn('⚠️ Failed to fetch master metadata, will use release data for naming:', (e as Error).message);
      }
    }
    
    if (!masterIdCandidate) {
      console.log('ℹ️ No master_id available, will use release metadata for naming');
    }

    // Step 2: Create or find release in database
    // Normalize fields for DB function types
    const parsedYear = typeof releaseData.year === 'number'
      ? releaseData.year
      : parseInt(String(releaseData.year || ''), 10);
    const yearValue = Number.isFinite(parsedYear) ? parsedYear : null;

    const styleValue = Array.isArray(releaseData.style)
      ? releaseData.style
      : (typeof releaseData.style === 'string' && releaseData.style.length
          ? releaseData.style.split(',').map((s: string) => s.trim()).filter(Boolean)
          : null);

    // Use master metadata for names if available, otherwise fall back to release data
    let artistValue: string;
    let albumTitle: string;
    
    if (masterMetadata) {
      // Extract from master metadata
      artistValue = masterMetadata.artists?.map((a: any) => a.name).join(', ') || releaseData.artist || '';
      albumTitle = masterMetadata.title || '';
      console.log(`🎭 Using Master metadata for names (Master ID: ${masterIdCandidate}):`, { artist: artistValue, title: albumTitle });
    } else {
      // Fall back to release data
      artistValue = releaseData.artist || '';
      if (!artistValue && typeof releaseData.title === 'string' && releaseData.title.includes(' - ')) {
        artistValue = releaseData.title.split(' - ')[0].trim();
      }
      
      // Extract clean album title
      albumTitle = typeof releaseData.title === 'string'
        ? (releaseData.title.includes(' - ')
            ? releaseData.title.split(' - ').slice(1).join(' - ').trim()
            : releaseData.title)
        : '';
      console.log('📀 Fallback to Release data for names:', { artist: artistValue, title: albumTitle });
    }

    // Normalize genre, label, format to strings (not arrays)
    const genreValue = Array.isArray(releaseData.genre) 
      ? releaseData.genre.join(', ') 
      : (releaseData.genre || null);
    const labelValue = Array.isArray(releaseData.label) 
      ? releaseData.label[0] 
      : (releaseData.label || null);
    const formatValue = Array.isArray(releaseData.format) 
      ? releaseData.format.join(', ') 
      : (releaseData.format || null);

    console.log('📦 RPC payload:', {
      discogs_id: releaseData.discogs_id,
      artist: artistValue,
      year: yearValue,
      genre: genreValue,
      style: styleValue ? `[${styleValue.length} items]` : null
    });

    const { data: releaseResp, error: releaseError } = await supabase.functions.invoke('find-or-create-release', {
      body: {
        discogs_id: parseInt(releaseData.discogs_id),
        artist: artistValue,
        title: releaseData.title,
        label: labelValue,
        catalog_number: releaseData.catalog_number,
        year: yearValue,
        format: formatValue,
        genre: genreValue,
        country: releaseData.country,
        style: styleValue,
        discogs_url: releaseData.discogs_url,
        master_id: masterIdCandidate ? parseInt(masterIdCandidate) : null
      }
    });

    if (releaseError) throw new Error(`Failed to create release: ${releaseError.message}`);
    const release_id = releaseResp?.release_id;
    if (!release_id) throw new Error('No release_id returned from find-or-create-release');
    console.log('💾 Release saved with ID:', release_id);

    // Step 3: Get initial artwork URL (for product creation)
    const masterId = masterIdCandidate;
    console.log('🖼️ Master ID for artwork:', masterId || 'none');
    
    const artworkUrl = releaseData.cover_image;
    console.log('🖼️ Initial artwork URL:', artworkUrl);

    // Step 4: Generate rich description with Perplexity
    console.log('🤖 Generating description with Perplexity...');
    const perplexityPrompt = `Write a compelling 150-word product description for a metal print of the album cover "${releaseData.title}" by ${artistValue}. Include:
- Why this album cover is iconic and culturally significant
- The visual elements that make it perfect for wall art
- How it would look as a high-quality metal print
- Perfect for collectors and music lovers
Keep it engaging, focus on the art and design, and make it SEO-friendly. Use professional but enthusiastic tone.`;

    let enrichedDescription = `Hoogwaardige metaalprint van de iconische albumhoes van ${albumTitle || releaseData.title} door ${artistValue || releaseData.artist}. Perfect voor aan de muur en een must-have voor elke muziekliefhebber.`;

    if (perplexityKey) {
      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              { role: 'system', content: 'Be precise and concise.' },
              { role: 'user', content: perplexityPrompt }
            ],
            temperature: 0.7,
            max_tokens: 300
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          enrichedDescription = perplexityData.choices?.[0]?.message?.content || enrichedDescription;
          console.log('✍️ Description generated');
        } else {
          console.warn('⚠️ Perplexity returned non-2xx, using fallback:', perplexityResponse.status);
        }
      } catch (e) {
        console.warn('⚠️ Perplexity call failed, using fallback description:', (e as Error).message);
      }
    } else {
      console.warn('⚠️ PERPLEXITY_API_KEY missing, using fallback description');
    }

    // Step 5: Check for existing product
    const { data: existingProducts } = await supabase
      .from('platform_products')
      .select('id')
      .eq('discogs_id', releaseData.discogs_id)
      .eq('media_type', 'merchandise')
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

    const productTitle = `${artistValue} - ${albumTitle} [Metaalprint]`;

    // Generate a unique slug using DB function to avoid collisions
    let slug = '';
    try {
      const { data: slugData, error: slugError } = await supabase.rpc('generate_product_slug', {
        p_title: productTitle,
        p_artist: artistValue
      });
      if (slugError) throw slugError;
      slug = slugData as string;
    } catch (e) {
      console.warn('⚠️ Slug generation via RPC failed, falling back to local slug:', (e as Error).message);
      slug = `${artistValue}-${albumTitle}-metaalprint`
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 80);
    }

    // Defensive normalization for categories and tags
    const genreStr = genreValue || 'music';
    const firstGenre = genreStr.split(',')[0].trim().toLowerCase();
    const categories = ['album-art', 'metaalprint', firstGenre];
    
    const tags = [
      artistValue.toLowerCase(),
      ...(genreStr ? genreStr.split(',').map((g: string) => g.trim().toLowerCase()) : []),
      'wall-art',
      'metal-print',
      'music-art'
    ].filter(Boolean);

    const images = artworkUrl ? [artworkUrl] : [];

    console.log('📝 Product payload keys:', {
      title: productTitle.substring(0, 40),
      release_id,
      discogs_id: releaseData.discogs_id,
      images_count: images.length,
      categories_count: categories.length,
      tags_count: tags.length
    });

    // Build the correct Discogs URL - use master URL if available
    let finalDiscogsUrl = releaseData.discogs_url;
    if (masterIdCandidate) {
      finalDiscogsUrl = `https://www.discogs.com/master/${masterIdCandidate}`;
      console.log(`🎯 Using Master URL for product: ${finalDiscogsUrl}`);
    } else {
      console.log(`📀 Using Release URL for product: ${finalDiscogsUrl}`);
    }

    const { data: product, error: productError } = await supabase
      .from('platform_products')
      .insert({
        title: productTitle,
        artist: artistValue,
        slug: slug,
        description: enrichedDescription,
        long_description: `# ${productTitle}\n\n${enrichedDescription}\n\n## Specificaties\n- **Materiaal**: Hoogwaardig aluminium\n- **Afmeting**: 30x30cm (standaard)\n- **Print kwaliteit**: HD, UV-bestendig\n- **Montage**: Klaar om op te hangen\n\n## Over dit album\n- **Artist**: ${artistValue}\n- **Titel**: ${albumTitle}\n- **Jaar**: ${yearValue || 'Onbekend'}\n- **Genre**: ${genreStr}\n- **Label**: ${labelValue || 'Onbekend'}`,
        media_type: 'merchandise',
        format: 'Metal Print - 30x30cm',
        condition_grade: null,
        price: price,
        stock_quantity: 999,
        primary_image: artworkUrl,
        images: images,
        categories: categories,
        tags: tags,
        discogs_id: parseInt(releaseData.discogs_id),
        discogs_url: finalDiscogsUrl,
        release_id: release_id,
        status: 'active',
        published_at: new Date().toISOString(),
        is_featured: false,
        is_on_sale: false
      })
      .select()
      .single();

    if (productError) throw new Error(`Failed to create product: ${productError.message}`);

    console.log('✅ ART product created:', product.id);

    // Step 7: Fetch and store high-quality artwork for the product
    console.log('🎨 Fetching high-quality artwork for product...');
    try {
      await supabase.functions.invoke('fetch-album-artwork', {
        body: {
          master_id: masterId,
          discogs_url: releaseData.discogs_url,
          artist: artistValue,
          title: albumTitle,
          item_id: product.id,
          item_type: 'platform_products'
        }
      });
      console.log('✅ Product artwork updated');
    } catch (artErr) {
      console.warn('⚠️ Product artwork update failed (non-blocking):', artErr);
    }

    // Step 8: Generate blog post automatically
    console.log('📝 Generating blog post...');
    let blogData = null;
    try {
      const { data: blogResponse, error: blogError } = await supabase.functions.invoke('plaat-verhaal-generator', {
        body: {
          albumId: product.id, // ✅ Use product ID with correct artist/title
          albumType: 'product', // ✅ New type for platform_products
          autoPublish: true, // Automatically publish the blog
          forceRegenerate: false // Don't regenerate if blog already exists
        }
      });

      if (blogError) {
        console.warn('⚠️ Blog generation failed (non-blocking):', blogError.message);
      } else {
        blogData = blogResponse;
        console.log('✅ Blog post generated:', blogData?.blog?.id);
        
        // Step 9: Fetch and store artwork for the blog post
        if (blogData?.blog?.id) {
          console.log('🎨 Fetching high-quality artwork for blog...');
          try {
            await supabase.functions.invoke('fetch-album-artwork', {
              body: {
                master_id: masterId,
                discogs_url: releaseData.discogs_url,
                artist: artistValue,
                title: albumTitle,
                item_id: blogData.blog.id,
                item_type: 'music_stories'
              }
            });
            console.log('✅ Blog artwork updated');
          } catch (artErr) {
            console.warn('⚠️ Blog artwork update failed (non-blocking):', artErr);
          }
        }
      }
    } catch (blogErr) {
      console.warn('⚠️ Blog generation error (non-blocking):', blogErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        product_id: product.id,
        product_slug: product.slug,
        discogs_id: releaseData.discogs_id,
        master_id: masterId || null,
        blog_generated: !!blogData?.blog,
        blog_id: blogData?.blog?.id || null,
        blog_slug: blogData?.blog?.slug || null,
        message: `ART product created: ${productTitle}${blogData?.blog ? ' + blog post' : ''}`
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
