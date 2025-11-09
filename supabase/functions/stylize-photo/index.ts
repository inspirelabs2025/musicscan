import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_PRESETS = {
  vectorCartoon: "Transform this photo into a stunning vector illustration with dramatic flowing color gradients and painterly quality. Use bold, sweeping color transitions (yellows, oranges, purples, pinks, magentas) that flow naturally across the forms and create dimensional depth. Strong light and shadow contrasts with smooth gradient blending - similar to high-end digital illustration art on ArtStation. Maintain facial expression, emotional depth, and anatomical accuracy. Rich, saturated colors with dramatic lighting effects and glowing highlights. Deep black or dark gradient background for maximum visual impact. The style should feel artistic and expressive - elevated artistic interpretation with smooth vector contours, vibrant color flow, and a painted quality. NOT oversimplified cartoon, but premium digital art illustration. Ultra high resolution, professional gallery-quality illustration.",
  posterize: "Transform this photo into a bold posterized pop art style with vibrant colors, high contrast, and simplified shapes. Use 4-6 distinct color zones. Black background. Similar to Andy Warhol style.",
  oilPainting: "Transform this into an expressive oil painting with thick, visible impasto brush strokes and rich textured oil paint. Use bold, dynamic brushwork with heavy paint application creating depth and dimension. Deep, saturated colors with dramatic light and shadow play. Emphasize the tactile quality of oil paint - thick dabs, layered strokes, palette knife marks. Style inspired by Van Gogh's expressive technique combined with classical portraiture richness. Raw, energetic brushwork with lustrous oil sheen.",
  watercolor: "Convert to a soft watercolor painting with flowing colors, white paper texture, and delicate edges.",
  pencilSketch: "Transform into a detailed pencil sketch drawing with fine hatching, shading, and realistic pencil textures.",
  comicBook: "Convert to comic book style with bold outlines, halftone dots, dramatic shadows, and vibrant flat colors.",
  abstract: "Transform into abstract geometric art with bold shapes, striking colors, and modern artistic interpretation."
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, style = 'vectorCartoon' } = await req.json();
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const stylePrompt = STYLE_PRESETS[style as keyof typeof STYLE_PRESETS] || STYLE_PRESETS.vectorCartoon;

    console.log(`🎨 Stylizing photo with style: ${style}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: stylePrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      
      throw new Error(`AI transformation failed: ${errorText}`);
    }

    const data = await response.json();
    const stylizedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!stylizedImageUrl) {
      throw new Error('No stylized image received from AI');
    }

    console.log('✅ Photo stylized successfully');

    return new Response(
      JSON.stringify({
        success: true,
        stylizedImageUrl,
        style,
        message: 'Photo stylized successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in stylize-photo:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
