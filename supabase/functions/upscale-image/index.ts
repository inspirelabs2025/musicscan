import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, targetWidth, targetHeight } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    if (!imageBase64) {
      throw new Error('Missing imageBase64');
    }

    console.log(`🎨 Starting AI upscaling to ${targetWidth}x${targetHeight}`);

    const upscalePrompt = `Upscale this vintage concert poster to higher resolution (target: ${targetWidth}x${targetHeight}px).

CRITICAL REQUIREMENTS:
- Maintain exact colors and design
- Preserve all text legibility and sharpness
- Keep vintage aesthetic, grain, and paper texture
- Only increase pixel density and clarity
- DO NOT add details that weren't in the original
- DO NOT change composition, layout, or cropping
- DO NOT alter the artistic style
- Enhance sharpness and reduce blur while keeping authenticity

Output a high-resolution version that looks identical but clearer.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                text: upscalePrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Insufficient credits. Please add credits to your workspace.');
      }
      
      throw new Error(`AI upscaling failed: ${response.status}`);
    }

    const data = await response.json();
    const upscaledImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!upscaledImageUrl) {
      throw new Error('No upscaled image returned from AI');
    }

    console.log('✅ AI upscaling completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        upscaledImageBase64: upscaledImageUrl 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in upscale-image:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
