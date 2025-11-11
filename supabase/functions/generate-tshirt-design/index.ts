import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateSlug(artist: string, album: string): string {
  const combined = `${artist}-${album}-tshirts`;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName, albumTitle, albumCoverUrl, colorPalette, discogsId, releaseYear, genre, userId } = await req.json();

    console.log('🎨 Starting T-shirt design generation for:', albumTitle, 'by', artistName);

    if (!artistName || !albumTitle || !albumCoverUrl) {
      throw new Error('Missing required fields: artistName, albumTitle, or albumCoverUrl');
    }

    const startTime = Date.now();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate slug
    const slug = generateSlug(artistName, albumTitle);
    console.log('📝 Generated slug:', slug);

    // Check if design already exists
    const { data: existingDesign } = await supabase
      .from('album_tshirts')
      .select('id, slug, base_design_url')
      .eq('slug', slug)
      .maybeSingle();

    if (existingDesign) {
      console.log('✅ T-shirt design already exists, returning existing design');
      return new Response(
        JSON.stringify({
          tshirt_id: existingDesign.id,
          slug: existingDesign.slug,
          base_design_url: existingDesign.base_design_url,
          color_palette: colorPalette
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI for T-shirt design generation
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Create premium black T-shirts with a creative, all-over design inspired by this album artwork. The design should be INTEGRATED into the T-shirt fabric, not just placed on top.

**CRITICAL DESIGN REQUIREMENTS:**
- Base: Premium BLACK T-shirts (crew neck or V-neck, not white/colored - BLACK)
- Design Integration: The album artwork elements should flow creatively THROUGHOUT the entire T-shirt
- Coverage: Design elements from collar to hem, across chest, back, and sleeves
- Style: Deconstructed, abstract interpretation that remains RECOGNIZABLE to the original album
- The artwork's key visual elements, colors, and iconic details must be identifiable
- Think: all-over print fashion, high-end streetwear, not just a chest logo

**COMPOSITION:**
- Show T-shirt standing upright on invisible mannequin/ghost mannequin
- 3D perspective showing form, natural fabric draping, and subtle wrinkles
- Design should follow the T-shirt's contours naturally (wrapping around curves)
- Front, chest, shoulders, sides all feature integrated design elements
- Professional product photography with studio lighting creating depth and shadows

**DESIGN STYLE:**
- Photorealistic merchandise photography (NOT flat mockup)
- The album's visual DNA is woven into the fabric pattern
- Creative reinterpretation: break down iconic elements and flow them across the shirt
- Maintain recognizability: someone should say "oh, that's [album name]!"
- Premium, wearable streetwear aesthetic
- Clean white or light grey background
- Ultra high resolution

**CRITICAL COMPOSITION RULES - NO CROPPING:**
- The COMPLETE T-shirt must be visible (collar to bottom hem)
- DO NOT CROP the top (collar/neck area must be fully visible)
- DO NOT CROP the sides or bottom
- Full frame composition with entire product within boundaries
- Safe zones: Top 8%, Bottom 15%, Sides 5%

**EXAMPLE APPROACH:**
If the album cover has geometric shapes → distribute those shapes across the shirt
If it has a color palette → use those colors in an all-over pattern
If it has iconic imagery → abstract and repeat those elements creatively
The result should feel like custom designer streetwear, not just "album cover printed on chest"`;

    console.log('🎨 Calling AI for T-shirt design with album artwork...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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
                  url: albumCoverUrl
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
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Not enough Lovable AI credits. Please add credits to your workspace at Settings → Workspace → Usage.',
            errorType: 'INSUFFICIENT_CREDITS',
            success: false 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI generation failed: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      throw new Error('No image generated by AI');
    }

    console.log('✅ AI generated T-shirt design successfully');

    // Convert base64 to blob and upload to storage
    const base64Data = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `${slug}-${Date.now()}.png`;
    const filePath = `tshirts/${fileName}`;

    console.log('📤 Uploading to storage:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('time-machine-posters')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('time-machine-posters')
      .getPublicUrl(filePath);

    console.log('✅ T-shirt design uploaded:', publicUrl);

    // Save to database
    const { data: tshirtData, error: dbError } = await supabase
      .from('album_tshirts')
      .insert({
        artist_name: artistName,
        album_title: albumTitle,
        album_cover_url: albumCoverUrl,
        discogs_id: discogsId,
        release_year: releaseYear,
        genre: genre,
        primary_color: colorPalette.primary_color,
        secondary_color: colorPalette.secondary_color,
        accent_color: colorPalette.accent_color,
        color_palette: colorPalette,
        design_theme: colorPalette.design_theme,
        pattern_type: colorPalette.pattern_type || 'artwork-print',
        user_id: userId,
        base_design_url: publicUrl,
        slug: slug,
        generation_time_ms: Date.now() - startTime,
        description: `Premium T-shirt featuring the iconic album artwork of "${albumTitle}" by ${artistName}. The original album cover is prominently displayed on this high-quality shirt.`,
        story_text: `This unique T-shirt showcases the complete album artwork from ${artistName}'s ${releaseYear || 'classic'} album "${albumTitle}". Wear a piece of music history with the full album cover design on this comfortable T-shirt.`
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('✅ T-shirt design saved to database:', tshirtData.id);

    return new Response(
      JSON.stringify({
        tshirt_id: tshirtData.id,
        slug: tshirtData.slug,
        base_design_url: tshirtData.base_design_url,
        color_palette: colorPalette
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-tshirt-design:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
