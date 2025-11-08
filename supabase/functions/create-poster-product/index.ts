import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StyleVariant {
  style: string;
  url: string;
  label: string;
  emoji: string;
}

interface CreatePosterRequest {
  stylizedImageBase64: string;
  artist: string;
  title: string;
  description?: string;
  style: string;
  price: number;
  styleVariants?: StyleVariant[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      stylizedImageBase64,
      artist,
      title,
      description,
      style,
      price,
      styleVariants
    }: CreatePosterRequest = await req.json();

    // Validate required fields
    if (!stylizedImageBase64 || !artist || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: stylizedImageBase64, artist, title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image format - accept both base64 data URIs and URLs
    let imageBuffer: Uint8Array;
    let mimeType: string;

    if (stylizedImageBase64.startsWith('data:image/')) {
      // Handle base64 data URI (single style generation)
      const base64Data = stylizedImageBase64.split(',')[1];
      mimeType = stylizedImageBase64.split(';')[0].split(':')[1];
      imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      console.log('Processing base64 data URI');
    } else if (stylizedImageBase64.startsWith('http')) {
      // Handle URL (batch style generation from Supabase Storage)
      console.log('Processing URL:', stylizedImageBase64);
      
      // Download the image
      const imageResponse = await fetch(stylizedImageBase64);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }
      
      // Get the image as ArrayBuffer and convert to Uint8Array
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = new Uint8Array(arrayBuffer);
      
      // Infer MIME type from URL or Content-Type header
      mimeType = imageResponse.headers.get('content-type') || 'image/png';
      console.log('Downloaded image:', { size: imageBuffer.length, mimeType });
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Must be base64 data URI or URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const cleanArtist = artist.trim().slice(0, 200);
    const cleanTitle = title.trim().slice(0, 200);
    const cleanDescription = description?.trim().slice(0, 2000);

    console.log('Creating POSTER product:', { artist: cleanArtist, title: cleanTitle, style });

    // Generate filename
    const fileExt = mimeType.split('/')[1];
    const fileName = `poster-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `posters/${fileName}`;

    // Upload to shop-products bucket
    const { error: uploadError } = await supabase.storage
      .from('shop-products')
      .upload(filePath, imageBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('shop-products')
      .getPublicUrl(filePath);

    console.log('Image uploaded:', publicUrl);

    // Generate default description if not provided
    const finalDescription = cleanDescription || `
Transform your space with this stunning ${style} artwork of ${cleanArtist}.
"${cleanTitle}" is a unique AI-generated poster that combines modern digital art techniques with classic artistic styles.

✨ Features:
- High-quality print ready
- Unique ${style} style
- Perfect for home decor or collectors
- Museum-quality poster

🎨 Style: ${style}
👤 Subject: ${cleanArtist}
    `.trim();

    // Generate slug using database function
    const { data: slugData, error: slugError } = await supabase
      .rpc('generate_product_slug', {
        p_title: cleanTitle,
        p_artist: cleanArtist
      });

    if (slugError) {
      console.error('Slug generation error:', slugError);
      throw new Error(`Failed to generate slug: ${slugError.message}`);
    }

    const slug = slugData;

    // Prepare images array - only style variants, NOT the primary image
    const styleImages = styleVariants ? styleVariants.map(v => v.url) : [];
    
    console.log('📦 Product payload:', { 
      primary_image: publicUrl,
      style_variants_count: styleImages.length, 
      has_variants: !!styleVariants
    });

    // Create platform_products record - using only columns that exist
    const { data: product, error: insertError } = await supabase
      .from('platform_products')
      .insert({
        title: cleanTitle,
        artist: cleanArtist,
        slug: slug,
        description: finalDescription,
        media_type: 'art',
        price: price || 49.95,
        stock_quantity: 999,
        primary_image: publicUrl,
        images: styleImages,
        categories: ['ART', 'POSTER'],
        tags: ['poster', style.toLowerCase(), 'ai-generated', cleanArtist.toLowerCase().replace(/\s+/g, '-')],
        status: 'active',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details
      });
      throw new Error(`Failed to create product: ${insertError.message}`);
    }

    console.log('POSTER product created:', product.id);

    return new Response(
      JSON.stringify({
        success: true,
        product_id: product.id,
        product_slug: product.slug,
        message: 'POSTER product created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in create-poster-product:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
