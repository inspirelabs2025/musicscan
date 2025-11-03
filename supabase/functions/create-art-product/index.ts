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

    // ✅ Normalize Discogs ID (detect and preserve m/M prefix for Master IDs)
    const idStr = String(discogs_id).trim();
    const isMasterId = /^[mM]/.test(idStr);
    const normalizedId = idStr.replace(/^[mM]/i, '');
    
    console.log(`📋 Discogs ID:`, {
      input: discogs_id,
      normalized: normalizedId,
      isMaster: isMasterId,
      willSendToSearch: idStr // Send WITH prefix to optimized-catalog-search
    });

    // ✅ VALIDATION: Detect and fix artist/title swaps
    let validatedArtist = artist;
    let validatedTitle = title;

    if (artist && title) {
      const artistLower = artist.toLowerCase();
      const titleLower = title.toLowerCase();
      
      // Heuristic checks for common swap patterns
      const swapIndicators = [
        // Artist field contains typical album title words
        /^(the|a|an)\s/i.test(artist) && artist.length > title.length,
        // Artist contains year (albums often have years in title)
        /\b(19|20)\d{2}\b/.test(artist) && !/\b(19|20)\d{2}\b/.test(title),
        // Artist is significantly longer (albums usually have longer titles)
        artist.length > title.length * 1.8,
        // Title contains common artist indicators
        /\b(band|orchestra|ensemble|quartet)\b/i.test(title)
      ];
      
      const shouldSwap = swapIndicators.filter(Boolean).length >= 2;
      
      if (shouldSwap) {
        console.warn('⚠️ SWAP DETECTED - Correcting artist/title order:', {
          original: { artist, title },
          corrected: { artist: title, title: artist }
        });
        validatedArtist = title;
        validatedTitle = artist;
      } else {
        console.log('✅ Artist/title validation passed');
      }
    }

    // Use validated values going forward
    const finalArtist = validatedArtist;
    const finalTitle = validatedTitle;

    console.log('📝 Validated input:', { artist: finalArtist, title: finalTitle, discogs_id });
    
    const discogsToken = Deno.env.get('DISCOGS_TOKEN');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Helper function for retry with exponential backoff
    const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const result = await fn();
          return result;
        } catch (error) {
          const isLastRetry = i === maxRetries - 1;
          if (isLastRetry) throw error;
          
          const delayMs = Math.pow(2, i) * 1000; // 1s, 2s, 4s
          console.log(`⏳ Retry ${i + 1}/${maxRetries} after ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    };

    // Step 1: Search Discogs for the release with retry logic
    let releaseData: any;
    
    if (discogs_id) {
      console.log('📀 Searching by Release ID:', discogs_id);
      try {
        const result = await retryWithBackoff(async () => {
           const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
            body: { 
              direct_discogs_id: idStr, // ✅ Send WITH prefix to optimized-catalog-search
              artist: finalArtist,
              title: finalTitle
            }
          });
          if (error) {
            console.error('❌ Catalog search error:', JSON.stringify(error));
            throw new Error(`Catalog search failed: ${JSON.stringify(error)}`);
          }
          if (!data?.results?.[0]) {
            throw new Error('No results found');
          }
          return data.results[0];
        });
        releaseData = result;
      } catch (e) {
        throw new Error(`Failed to search Discogs after retries: ${(e as Error).message}`);
      }
    } else if (catalog_number || (artist && title)) {
      console.log('🔍 Searching by catalog/artist/title');
      try {
        const result = await retryWithBackoff(async () => {
          const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
            body: { 
              catalog_number, 
              artist: finalArtist, 
              title: finalTitle 
            }
          });
          if (error) {
            console.error('❌ Catalog search error:', JSON.stringify(error));
            throw new Error(`Catalog search failed: ${JSON.stringify(error)}`);
          }
          if (!data?.results || data.results.length === 0) {
            throw new Error('No results found on Discogs');
          }
          return data.results[0];
        });
        releaseData = result;
      } catch (e) {
        console.log('❌ Failed after retries:', (e as Error).message);
        return new Response(
          JSON.stringify({ 
            error: 'No results found on Discogs after retries',
            details: 'Please check the artist and title spelling, or try again in a moment'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
    } else {
      throw new Error('Please provide either discogs_id or catalog_number/artist/title');
    }

    console.log('✅ Release data retrieved:', {
      discogs_id: releaseData.discogs_id,
      api_artist: releaseData.artist,
      api_title: releaseData.title,
      input_artist: finalArtist || 'from API',
      input_title: finalTitle || 'from API',
      match: releaseData.artist === finalArtist && releaseData.title === finalTitle
    });

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

    // Use Release data for naming
    const artistValue = releaseData.artist || 
      (releaseData.title?.includes(' - ') 
        ? releaseData.title.split(' - ')[0].trim() 
        : '');

    const albumTitle = releaseData.title?.includes(' - ')
      ? releaseData.title.split(' - ').slice(1).join(' - ').trim()
      : releaseData.title || '';

    console.log('📀 Using Release data for names:', { artist: artistValue, title: albumTitle });

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
        master_id: releaseData.master_id ? parseInt(releaseData.master_id) : null
      }
    });

    if (releaseError) throw new Error(`Failed to create release: ${releaseError.message}`);
    const release_id = releaseResp?.release_id;
    if (!release_id) throw new Error('No release_id returned from find-or-create-release');
    console.log('💾 Release saved with ID:', release_id);

    // Step 3: Get initial artwork URL (for product creation)
    const masterId = releaseData.master_id || null;
    console.log('🖼️ Master ID for artwork (from release metadata):', masterId || 'none');
    
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
      .eq('media_type', 'art')
      .maybeSingle();

    if (existingProducts) {
      console.log('⚠️ Product already exists:', existingProducts.id);
      return new Response(
        JSON.stringify({ 
          success: true,
          already_exists: true,
          product_id: existingProducts.id,
          message: 'Product already exists, skipped'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
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
    const categories = ['metaal album cover', 'album-art', 'metaalprint', firstGenre];
    
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

    // ✅ Store Release ID in discogs_id column
    // ✅ Store Master ID (from release metadata) in master_id column
    const finalDiscogsUrl = releaseData.discogs_url;
    const finalDiscogsId = parseInt(releaseData.discogs_id);
    
    console.log('🎯 Storing Release ID:', {
      release_id: finalDiscogsId,
      release_url: finalDiscogsUrl,
      master_id: releaseData.master_id || 'none (from API metadata)'
    });

    const { data: product, error: productError } = await supabase
      .from('platform_products')
      .insert({
        title: productTitle,
        artist: artistValue,
        slug: slug,
        description: enrichedDescription,
        long_description: `# ${productTitle}\n\n${enrichedDescription}\n\n## Specificaties\n- **Materiaal**: Hoogwaardig aluminium\n- **Afmeting**: 30x30cm (standaard)\n- **Print kwaliteit**: HD, UV-bestendig\n- **Montage**: Klaar om op te hangen\n\n## Over dit album\n- **Artist**: ${artistValue}\n- **Titel**: ${albumTitle}\n- **Jaar**: ${yearValue || 'Onbekend'}\n- **Genre**: ${genreStr}\n- **Label**: ${labelValue || 'Onbekend'}`,
        media_type: 'art',
        format: 'Metal Print - 30x30cm',
        condition_grade: null,
        price: price,
        stock_quantity: 999,
        primary_image: artworkUrl,
        images: images,
        categories: categories,
        tags: tags,
        discogs_id: finalDiscogsId, // ✅ Always Release ID
        master_id: releaseData.master_id ? parseInt(releaseData.master_id) : null, // ✅ From Discogs API
        discogs_url: finalDiscogsUrl, // ✅ Release URL
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
