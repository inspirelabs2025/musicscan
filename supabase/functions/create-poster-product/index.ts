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

    // Validate image format
    if (!stylizedImageBase64.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const cleanArtist = artist.trim().slice(0, 200);
    const cleanTitle = title.trim().slice(0, 200);
    const cleanDescription = description?.trim().slice(0, 2000);

    console.log('Creating POSTER product:', { artist: cleanArtist, title: cleanTitle, style });

    // Convert base64 to blob
    const base64Data = stylizedImageBase64.split(',')[1];
    const mimeType = stylizedImageBase64.split(';')[0].split(':')[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

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

    // Create platform_products record
    const { data: product, error: insertError } = await supabase
      .from('platform_products')
      .insert({
        title: cleanTitle,
        artist: cleanArtist,
        description: finalDescription,
        media_type: 'art',
        price: price || 49.95,
        currency: 'EUR',
        stock_quantity: 999,
        low_stock_threshold: 10,
        images: styleVariants ? [publicUrl, ...styleVariants.map(v => v.url)] : [publicUrl],
        primary_image: publicUrl,
        slug: slug,
        categories: ['ART', 'POSTER'],
        tags: ['poster', style.toLowerCase(), 'ai-generated', cleanArtist.toLowerCase().replace(/\s+/g, '-')],
        status: 'active',
        published_at: new Date().toISOString(),
        is_new: true,
        is_featured: false,
        is_on_sale: false,
        view_count: 0,
        purchase_count: 0,
        metadata: styleVariants ? {
          style_variants: styleVariants,
          has_style_options: true,
          default_style: style
        } : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
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
