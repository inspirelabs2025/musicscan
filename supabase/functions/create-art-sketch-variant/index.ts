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
    const { 
      discogs_id,
      catalog_number,
      artist,
      title,
      price = 149.99,
      style = 'pencil_sketch' // pencil_sketch, ink_drawing, charcoal
    } = await req.json();

    console.log('🎨 Starting sketch variant generation:', { discogs_id, artist, title, style });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Find or create the release
    let releaseId: string;
    let albumInfo: any;

    if (discogs_id) {
      console.log('📀 Finding release by Discogs ID:', discogs_id);
      
      const { data: existingRelease } = await supabase
        .from('releases')
        .select('*')
        .eq('discogs_id', discogs_id)
        .single();

      if (existingRelease) {
        releaseId = existingRelease.id;
        albumInfo = existingRelease;
      } else {
        // Search via optimized-catalog-search
        const { data: catalogData } = await supabase.functions.invoke('optimized-catalog-search', {
          body: { 
            catalog_number: catalog_number || '',
            artist: artist || '',
            title: title || ''
          }
        });

        if (!catalogData?.results?.[0]) {
          throw new Error('Album niet gevonden op Discogs');
        }

        const firstResult = catalogData.results[0];
        albumInfo = {
          artist: firstResult.artist,
          title: firstResult.title,
          discogs_id: firstResult.discogs_id,
          year: firstResult.year,
          label: firstResult.label,
          catalog_number: firstResult.catalog_number,
          format: firstResult.format,
          genre: firstResult.genre,
          country: firstResult.country,
        };

        // Create release
        const { data: createReleaseData } = await supabase.functions.invoke('find-or-create-release', {
          body: albumInfo
        });

        releaseId = createReleaseData.release_id;
      }
    } else if (artist && title) {
      console.log('🔍 Searching by artist and title:', { artist, title });
      
      const { data: catalogData } = await supabase.functions.invoke('optimized-catalog-search', {
        body: { artist, title, catalog_number: catalog_number || '' }
      });

      if (!catalogData?.results?.[0]) {
        throw new Error('Album niet gevonden');
      }

      const firstResult = catalogData.results[0];
      albumInfo = {
        artist: firstResult.artist,
        title: firstResult.title,
        discogs_id: firstResult.discogs_id,
        year: firstResult.year,
        label: firstResult.label,
        catalog_number: firstResult.catalog_number,
        format: firstResult.format,
        genre: firstResult.genre,
        country: firstResult.country,
      };

      const { data: createReleaseData } = await supabase.functions.invoke('find-or-create-release', {
        body: albumInfo
      });

      releaseId = createReleaseData.release_id;
    } else {
      throw new Error('Discogs ID of artist + title is vereist');
    }

    // Step 2: Get album artwork URL
    console.log('🖼️ Fetching album artwork for release:', releaseId);
    
    const { data: artworkData } = await supabase.functions.invoke('fetch-album-artwork', {
      body: { 
        discogs_id: albumInfo.discogs_id,
        album_id: releaseId 
      }
    });

    if (!artworkData?.artwork_url) {
      throw new Error('Geen albumcover gevonden');
    }

    const originalArtworkUrl = artworkData.artwork_url;
    console.log('✅ Original artwork URL:', originalArtworkUrl);

    // Step 3: Generate sketch variant using Lovable AI
    console.log('🎨 Generating sketch variant with style:', style);

    const stylePrompts = {
      pencil_sketch: 'Convert this album cover into a highly detailed pencil sketch drawing. Maintain all key visual elements, composition, and layout exactly as in the original. Render in black and white with visible pencil strokes, cross-hatching for shadows, and subtle shading. The sketch should look hand-drawn with artistic texture and depth.',
      ink_drawing: 'Convert this album cover into a detailed ink drawing. Preserve all important elements and composition. Use bold black ink lines, stippling, and cross-hatching techniques. Create strong contrast between black and white areas with no gray tones. The result should look like professional pen and ink illustration.',
      charcoal: 'Convert this album cover into a charcoal drawing. Maintain the original composition and all key elements. Create dramatic contrast with smudged charcoal textures, deep blacks, and subtle gray tones. The drawing should have the characteristic soft, dusty appearance of charcoal with visible stroke marks and blending.'
    };

    const prompt = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.pencil_sketch;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: originalArtworkUrl
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI generatie gefaald: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const sketchBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!sketchBase64) {
      throw new Error('Geen sketch gegenereerd door AI');
    }

    console.log('✅ Sketch generated, size:', sketchBase64.length, 'bytes');

    // Step 4: Upload sketch to storage
    const base64Data = sketchBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `sketch-${albumInfo.discogs_id}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vinyl_images')
      .upload(`sketches/${fileName}`, buffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload gefaald: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('vinyl_images')
      .getPublicUrl(`sketches/${fileName}`);

    console.log('✅ Sketch uploaded:', publicUrl);

    // Step 5: Create ART product with sketch
    const styleName = {
      pencil_sketch: 'Pencil Sketch',
      ink_drawing: 'Ink Drawing', 
      charcoal: 'Charcoal Drawing'
    }[style] || 'Sketch';

    const productTitle = `${albumInfo.artist} - ${albumInfo.title} (${styleName})`;
    const slug = productTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 80);

    const { data: existingProduct } = await supabase
      .from('platform_products')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingProduct) {
      throw new Error('Sketch variant bestaat al voor dit album');
    }

    const { data: product, error: productError } = await supabase
      .from('platform_products')
      .insert({
        title: productTitle,
        artist: albumInfo.artist,
        slug,
        description: `Handgetekende ${styleName.toLowerCase()} variant van het iconische album "${albumInfo.title}" van ${albumInfo.artist}. Deze unieke kunstinterpretatie van de originele albumcover wordt geprint op hoogwaardig metaal voor een duurzaam en stijlvol eindresultaat. Perfect voor muziekliefhebbers en kunstcollecteurs.`,
        price,
        media_type: 'art',
        categories: ['sketch variant', 'metaal album cover'],
        primary_image: publicUrl,
        additional_images: [originalArtworkUrl],
        stock_quantity: 10,
        status: 'active',
        published_at: new Date().toISOString(),
        metadata: {
          discogs_id: albumInfo.discogs_id,
          release_id: releaseId,
          sketch_style: style,
          original_artwork: originalArtworkUrl,
          year: albumInfo.year,
          label: albumInfo.label,
          catalog_number: albumInfo.catalog_number
        }
      })
      .select()
      .single();

    if (productError) {
      console.error('Product creation error:', productError);
      throw productError;
    }

    console.log('✅ Sketch variant product created:', product.id);

    return new Response(
      JSON.stringify({
        success: true,
        product_id: product.id,
        product_slug: product.slug,
        sketch_url: publicUrl,
        original_artwork: originalArtworkUrl,
        message: `Sketch variant "${productTitle}" succesvol aangemaakt`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-art-sketch-variant:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
