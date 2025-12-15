import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateSlug(artist: string, title: string): string {
  const base = `${artist}-${title}-socks`
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

    const { artist, title, imageUrl, tags = [] } = await req.json();

    if (!artist || !title || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'artist, title and imageUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🧦 Creating Christmas sock for: ${artist} - ${title}`);

    const slug = generateSlug(artist, title);

    // Step 1: Create album_socks record
    const { data: sockRecord, error: sockInsertError } = await supabase
      .from('album_socks')
      .insert({
        artist_name: artist,
        album_title: title,
        album_cover_url: imageUrl,
        base_design_url: imageUrl,
        slug: slug,
        primary_color: '#C41E3A', // Christmas red
        secondary_color: '#228B22', // Christmas green
        accent_color: '#FFD700', // Gold
        design_theme: 'pop-art-posterize',
        pattern_type: 'christmas',
        genre: 'Christmas',
        is_published: true,
        description: `🎄 Kerst sokken geïnspireerd op "${title}" van ${artist}. Premium merino wol met feestelijk design.`
      })
      .select()
      .single();

    if (sockInsertError) {
      console.error('❌ Failed to create album_socks record:', sockInsertError);
      throw new Error(`Failed to create sock record: ${sockInsertError.message}`);
    }

    console.log(`✅ Created album_socks record: ${sockRecord.id}`);

    // Step 2: Call create-sock-products with the sockId
    const { data: productResult, error: productError } = await supabase.functions.invoke('create-sock-products', {
      body: { 
        sockId: sockRecord.id,
        styleVariants: null // Use base design
      }
    });

    if (productError) {
      console.error('❌ Failed to create sock product:', productError);
      // Still return success since the sock record was created
      return new Response(
        JSON.stringify({
          success: true,
          sockId: sockRecord.id,
          productIds: [],
          message: 'Sock record created but product creation failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎉 Christmas sock created successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        sockId: sockRecord.id,
        productId: productResult?.product_id,
        productIds: productResult?.product_id ? [productResult.product_id] : [],
        slug: slug
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error creating Christmas sock:', error);
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
