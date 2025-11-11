import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_PROMPTS = {
  vintage: `Transform into a vintage-style T-shirt with these characteristics:
- Faded, worn-in look with slightly muted colors
- Subtle distressed texture on the print (small cracks, fading)
- Retro color palette with warm, desaturated tones
- Vintage wash T-shirt base (cream, faded black, or heather)
- The print should look slightly weathered and aged
- Maintain 80s/90s concert tee aesthetic
- Keep album artwork recognizable but with vintage patina
- Professional product photography with nostalgic feel`,

  neon: `Transform into a bold neon-style T-shirt:
- Vibrant, fluorescent colors (hot pink, electric blue, lime green, neon yellow)
- High contrast black or dark T-shirt base
- The album artwork reimagined with neon glow effects
- Bright, eye-catching pop art style
- Colors should appear to "pop" off the shirt
- Modern streetwear aesthetic
- Sharp, bold print quality
- Professional studio lighting emphasizing the brightness`,

  pastel: `Transform into a soft pastel-style T-shirt:
- Dreamy pastel color palette (soft pink, baby blue, mint, lavender, peach)
- Light-colored T-shirt base (white, cream, or light grey)
- The album artwork reimagined with gentle, muted tones
- Soft, aesthetic vibe with romantic feel
- Subtle gradients and soft edges
- Modern, Instagram-worthy style
- Keep artwork recognizable but softened
- Professional photography with soft, diffused lighting`,

  monochrome: `Transform into a high-contrast monochrome T-shirt:
- Strict black and white color scheme
- High contrast print with deep blacks and bright whites
- Grey heather or light grey T-shirt base
- The album artwork converted to bold B&W graphic
- Sharp, clean lines with strong visual impact
- Modern minimalist aesthetic
- Graphic design poster style
- Professional product photography with dramatic lighting`,

  watercolor: `Transform into an artistic watercolor-style T-shirt:
- Hand-painted watercolor aesthetic with soft edges
- Cream or natural white T-shirt base
- The album artwork reimagined as watercolor painting
- Flowing colors with organic bleeds and gradients
- Artistic, gallery-quality feel
- Visible brush strokes and paint texture
- Contemporary art wear style
- Professional photography emphasizing artistic quality`,

  grunge: `Transform into an edgy grunge-style T-shirt:
- Distressed, raw aesthetic with rough textures
- Dark T-shirt base (black, charcoal, or dark grey)
- The album artwork with grungy, weathered treatment
- Rough edges, paint splatters, scratches
- Underground music scene vibe
- Rebellious, alternative style
- Heavy distressing but artwork still clear
- Professional photography with moody, dark lighting`,

  minimalist: `Transform into a clean minimalist-style T-shirt:
- Ultra-simple, refined design approach
- White or light-colored premium T-shirt
- The album artwork simplified to essential elements
- Clean lines, ample negative space
- Modern Scandinavian aesthetic
- Understated elegance
- High-quality, boutique fashion feel
- Professional photography with pristine, bright lighting`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseDesignUrl, tshirtId } = await req.json();

    console.log('🎭 Starting batch style generation for T-shirt:', tshirtId);

    if (!baseDesignUrl || !tshirtId) {
      throw new Error('Missing baseDesignUrl or tshirtId');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const styleVariants = [];

    // Generate all 7 style variants
    for (const [styleName, stylePrompt] of Object.entries(STYLE_PROMPTS)) {
      console.log(`🎨 Generating ${styleName} variant...`);

      const prompt = `${stylePrompt}

**CRITICAL REQUIREMENTS:**
- T-shirt must be shown upright/standing (ghost mannequin or invisible mannequin)
- Natural 3D form with realistic fabric draping and folds
- Print must follow the fabric contours - NOT flat or floating
- Photorealistic rendering - this should look like REAL product photography
- Proper lighting with shadows and depth
- Ultra high resolution suitable for e-commerce
- The album artwork must remain recognizable within the style transformation
- Professional studio photography quality`;

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
                    url: baseDesignUrl
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
        console.error(`Failed to generate ${styleName} variant:`, aiResponse.status, errorText);
        
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
        continue;
      }

      const aiData = await aiResponse.json();
      const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!generatedImageUrl) {
        console.error(`No image generated for ${styleName} variant`);
        continue;
      }

      // Upload to storage
      const base64Data = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      const fileName = `${tshirtId}-${styleName}-${Date.now()}.png`;
      const filePath = `tshirts/styles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('time-machine-posters')
        .upload(filePath, imageBuffer, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) {
        console.error(`Upload error for ${styleName}:`, uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('time-machine-posters')
        .getPublicUrl(filePath);

      styleVariants.push({
        style: styleName,
        url: publicUrl,
        description: stylePrompt
      });

      console.log(`✅ ${styleName} variant uploaded`);
    }

    // Update T-shirt record with style variants
    const { error: updateError } = await supabase
      .from('album_tshirts')
      .update({ style_variants: styleVariants })
      .eq('id', tshirtId);

    if (updateError) {
      console.error('Error updating T-shirt with variants:', updateError);
      throw updateError;
    }

    console.log(`✅ All ${styleVariants.length} style variants saved to database`);

    return new Response(
      JSON.stringify({ styleVariants }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in batch-generate-tshirt-styles:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
