import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_PROMPTS = {
  vintage: "Place on vintage washed T-shirt with retro colors and slightly faded look",
  neon: "Bold neon colors on black T-shirt with vibrant pop art style",
  pastel: "Soft pastel tones on white T-shirt with dreamy aesthetic",
  monochrome: "Black and white print on grey T-shirt with high contrast",
  watercolor: "Watercolor style print on cream T-shirt with artistic feel",
  grunge: "Distressed grunge style on dark T-shirt with edgy look",
  minimalist: "Clean minimalist design on white T-shirt with modern aesthetic"
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

      const prompt = `Transform this T-shirt design: ${stylePrompt}. Keep the album artwork visible and recognizable. Professional product photography. Ultra high resolution.`;

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
