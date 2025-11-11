import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_PROMPTS = {
  vintage: `Transform the design into a vintage-style aesthetic:
- Apply faded, worn-in look to the DESIGN elements (slightly muted colors)
- Subtle distressed texture on the print pattern (small cracks, weathering)
- Retro color palette with warm, desaturated tones in the design
- Keep BLACK T-shirt base but give it a slightly vintage wash look
- The all-over design should look aged and weathered
- Maintain 80s/90s streetwear aesthetic
- Album artwork elements still recognizable but with vintage patina

**MAINTAIN BASE DESIGN:**
- Keep the BLACK T-shirt base
- Maintain the all-over integrated design composition
- Design flows throughout entire T-shirt (collar to hem)
- Photorealistic product photography with 3D form
- No cropping - complete T-shirt visible`,

  neon: `Transform the design into a bold neon-style aesthetic:
- Vibrant, fluorescent colors in the design (hot pink, electric blue, lime green, neon yellow)
- Keep BLACK T-shirt base for high contrast
- The all-over design pattern reimagined with neon glow effects
- Bright, eye-catching pop art style integrated throughout
- Colors should appear to "pop" off the black fabric
- Modern streetwear aesthetic
- Sharp, bold print quality flowing across entire shirt

**MAINTAIN BASE DESIGN:**
- Keep the BLACK T-shirt base
- Maintain the all-over integrated design composition
- Design flows throughout entire T-shirt
- Photorealistic product photography with 3D form
- No cropping - complete T-shirt visible`,

  pastel: `Transform the design into a soft pastel-style aesthetic:
- Dreamy pastel color palette in the design (soft pink, baby blue, mint, lavender, peach)
- Keep BLACK T-shirt base for beautiful contrast with pastels
- The all-over design pattern reimagined with gentle, muted tones
- Soft, aesthetic vibe with romantic feel throughout the shirt
- Subtle gradients and soft edges in the pattern
- Modern, Instagram-worthy style integrated into fabric
- Keep artwork recognizable but softened

**MAINTAIN BASE DESIGN:**
- Keep the BLACK T-shirt base
- Maintain the all-over integrated design composition
- Design flows throughout entire T-shirt
- Photorealistic product photography with 3D form
- No cropping - complete T-shirt visible`,

  monochrome: `Transform the design into a high-contrast monochrome aesthetic:
- Strict black, white, and grey color scheme in the design pattern
- Keep BLACK T-shirt base
- High contrast print with bright whites and greys flowing throughout
- The all-over design converted to bold B&W graphic elements
- Sharp, clean lines with strong visual impact across entire shirt
- Modern minimalist aesthetic
- Graphic design poster style integrated into fabric

**MAINTAIN BASE DESIGN:**
- Keep the BLACK T-shirt base
- Maintain the all-over integrated design composition
- Design flows throughout entire T-shirt
- Photorealistic product photography with 3D form
- No cropping - complete T-shirt visible`,

  watercolor: `Transform the design into an artistic watercolor-style aesthetic:
- Hand-painted watercolor aesthetic with soft edges in the pattern
- Keep BLACK T-shirt base for dramatic watercolor contrast
- The all-over design reimagined as watercolor painting throughout shirt
- Flowing colors with organic bleeds and gradients across fabric
- Artistic, gallery-quality feel integrated into the garment
- Visible brush strokes and paint texture in the pattern
- Contemporary art wear style

**MAINTAIN BASE DESIGN:**
- Keep the BLACK T-shirt base
- Maintain the all-over integrated design composition
- Design flows throughout entire T-shirt
- Photorealistic product photography with 3D form
- No cropping - complete T-shirt visible`,

  grunge: `Transform the design into an edgy grunge-style aesthetic:
- Distressed, raw aesthetic with rough textures in the pattern
- Keep BLACK T-shirt base (perfect for grunge aesthetic)
- The all-over design with grungy, weathered treatment throughout
- Rough edges, paint splatters, scratches in the pattern
- Underground music scene vibe integrated across entire shirt
- Rebellious, alternative style flowing from collar to hem
- Heavy distressing but artwork still recognizable

**MAINTAIN BASE DESIGN:**
- Keep the BLACK T-shirt base
- Maintain the all-over integrated design composition
- Design flows throughout entire T-shirt
- Photorealistic product photography with 3D form
- No cropping - complete T-shirt visible`,

  minimalist: `Transform the design into a clean minimalist-style aesthetic:
- Ultra-simple, refined design approach with essential elements only
- Keep BLACK T-shirt base for modern minimal contrast
- The all-over design simplified to key visual elements flowing throughout
- Clean lines, strategic negative space across the shirt
- Modern Scandinavian aesthetic integrated into fabric
- Understated elegance with subtle pattern distribution
- High-quality, boutique fashion feel

**MAINTAIN BASE DESIGN:**
- Keep the BLACK T-shirt base
- Maintain the all-over integrated design composition
- Design flows throughout entire T-shirt
- Photorealistic product photography with 3D form
- No cropping - complete T-shirt visible`
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
