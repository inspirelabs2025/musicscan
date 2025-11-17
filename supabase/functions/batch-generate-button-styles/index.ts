import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_CONFIG: Record<string, { label: string; emoji: string }> = {
  vector: { label: "Vector Illustration", emoji: "🎨" },
  watercolor: { label: "Watercolor Paint", emoji: "💧" },
  retro: { label: "Retro Style", emoji: "🕹️" },
  neon: { label: "Neon Glow", emoji: "💡" },
  minimalist: { label: "Minimalist Line", emoji: "✏️" },
  popart: { label: "Pop Art", emoji: "💥" },
  metallic: { label: "Metallic Shine", emoji: "✨" }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { baseDesignUrl, buttonId } = await req.json();

    if (!baseDesignUrl || !buttonId) {
      throw new Error('baseDesignUrl and buttonId are required');
    }

    console.log('🎨 Starting button style generation:', { buttonId, baseDesignUrl });

    const styleVariants = [];
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Download base design
    const baseImageResponse = await fetch(baseDesignUrl);
    if (!baseImageResponse.ok) {
      throw new Error(`Failed to fetch base design: ${baseImageResponse.statusText}`);
    }
    const baseImageBlob = await baseImageResponse.blob();
    const baseImageBuffer = await baseImageBlob.arrayBuffer();
    
    // Convert to base64 without stack overflow
    const bytes = new Uint8Array(baseImageBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const baseImageBase64 = btoa(binary);

    // STEP 1: Create circular base design first
    console.log('🎨 Creating circular base button design...');

    const circularPrompt = `Transform this image into a perfect circular button design.
CRITICAL REQUIREMENTS:
- Create a PERFECT CIRCLE (not oval, not rounded square)
- Crop/compose the image to fit beautifully in a circular format
- Focus on the most important visual elements
- Ensure all edges are smooth and circular
- Professional button badge quality
- Keep the composition balanced and centered
- High contrast and clarity for small button size (35-45mm diameter)
- This will be the base for other style variations`;

    const circularResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              { type: 'text', text: circularPrompt },
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/png;base64,${baseImageBase64}` }
                  }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!circularResponse.ok) {
      const errorText = await circularResponse.text();
      console.error('Circular base creation error:', errorText);
      throw new Error(`Failed to create circular base: ${circularResponse.status}`);
    }

    const circularData = await circularResponse.json();
    const circularImageUrl = circularData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!circularImageUrl) {
      throw new Error('No circular base image generated');
    }

    // Upload circular base
    const circularBase64 = circularImageUrl.replace(/^data:image\/\w+;base64,/, '');
    const circularBuffer = Uint8Array.from(atob(circularBase64), c => c.charCodeAt(0));
    const folder = `buttons/${buttonId}`;
    const circularFileName = `${folder}/base-${Date.now()}.png`;

    const { error: circularUploadError } = await supabase.storage
      .from('product-images')
      .upload(circularFileName, circularBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000'
      });

    if (circularUploadError) {
      console.error('Circular base upload error:', circularUploadError);
      throw circularUploadError;
    }

    const { data: { publicUrl: circularBaseUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(circularFileName);

    console.log(`✅ Created circular base: ${circularBaseUrl}`);

    // Download circular base and convert to base64 for style variants
    const circularBaseResponse = await fetch(circularBaseUrl);
    if (!circularBaseResponse.ok) {
      throw new Error(`Failed to fetch circular base: ${circularBaseResponse.statusText}`);
    }
    const circularBaseBlob = await circularBaseResponse.blob();
    const circularBaseBuffer = await circularBaseBlob.arrayBuffer();
    const circularBytes = new Uint8Array(circularBaseBuffer);
    let circularBinary = '';
    for (let i = 0; i < circularBytes.length; i += chunkSize) {
      const chunk = circularBytes.subarray(i, Math.min(i + chunkSize, circularBytes.length));
      circularBinary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const circularBase64ForStyles = btoa(circularBinary);

    // Add circular base as first variant
    styleVariants.push({
      style: 'original',
      label: 'Original Circular',
      emoji: '⭕',
      url: circularBaseUrl
    });

    // STEP 2: Generate 7 style variants from the circular base
    for (const [styleKey, { label, emoji }] of Object.entries(STYLE_CONFIG)) {
      console.log(`🎨 Generating ${label} style...`);

      try {
        const prompt = getStylePrompt(styleKey, label);

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
                  { type: 'text', text: prompt },
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/png;base64,${circularBase64ForStyles}` }
                  }
                ]
              }
            ],
            modalities: ['image', 'text']
          })
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI API error for ${styleKey}:`, errorText);
          throw new Error(`AI API returned ${aiResponse.status}: ${errorText}`);
        }

        const aiData = await aiResponse.json();
        const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!generatedImageUrl) {
          throw new Error('No image generated by AI');
        }

        // Extract base64 and upload to storage
        const base64Data = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        const fileName = `${folder}/${styleKey}-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            cacheControl: '31536000'
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        styleVariants.push({
          style: styleKey,
          url: publicUrl,
          label,
          emoji
        });

        console.log(`✅ Generated ${label} style: ${publicUrl}`);

      } catch (error) {
        console.error(`Error generating ${label}:`, error);
        // Continue with other styles even if one fails
      }
    }

    const totalExpected = Object.keys(STYLE_CONFIG).length;
    const generatedCount = styleVariants.filter((s: any) => s.style !== 'original').length;
    if (generatedCount < totalExpected) {
      const msg = `Generated ${generatedCount}/${totalExpected} styles. Some styles failed.`;
      console.error(msg);
      return new Response(
        JSON.stringify({ error: msg, styleVariants }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Generated ${generatedCount}/${totalExpected} styles (+ original)`);

    return new Response(
      JSON.stringify({ styleVariants }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in batch-generate-button-styles:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getStylePrompt(styleKey: string, label: string): string {
  const basePrompt = `Transform this image into a stylized button design. 
CRITICAL: Maintain the EXACT circular shape and composition. Only change the artistic style.
The image must remain a perfect circle suitable for a round button badge.
Style: ${label}`;

  const stylePrompts: Record<string, string> = {
    vector: `${basePrompt}
- Create smooth, clean vector artwork with solid colors
- Use bold outlines and simplified shapes
- Flat color style with slight gradients for depth
- Professional graphic design look`,

    watercolor: `${basePrompt}
- Apply soft watercolor paint effects with gentle blending
- Use flowing, organic color transitions
- Add subtle paper texture
- Dreamy, artistic watercolor aesthetic`,

    retro: `${basePrompt}
- Transform into vintage 80s/90s style
- Use retro color palette (pinks, purples, teals)
- Add slight grain and nostalgic vibe
- Classic retro aesthetic with modern clarity`,

    neon: `${basePrompt}
- Apply bright neon colors with glowing effects
- High contrast with dark background elements
- Electric, vibrant color palette
- Futuristic neon sign aesthetic`,

    minimalist: `${basePrompt}
- Convert to clean line art style
- Simple, essential lines only
- Monochromatic or limited color palette
- Modern minimalist design`,

    popart: `${basePrompt}
- Bold pop art style with high contrast
- Add halftone dots pattern where appropriate
- Bright, saturated comic book colors
- Dynamic, energetic pop art aesthetic`,

    metallic: `${basePrompt}
- Apply shiny metallic effect with reflective surfaces
- Use metallic color palette (silver, gold, chrome)
- Add realistic light reflections and shine
- Premium, polished metallic look`
  };

  return stylePrompts[styleKey] || basePrompt;
}
