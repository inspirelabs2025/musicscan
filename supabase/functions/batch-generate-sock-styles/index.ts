import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_CONFIG = {
  vectorIllustration: { label: 'Vector Illustration', emoji: '🎨' },
  watercolorPaint: { label: 'Watercolor Paint', emoji: '💧' },
  retroKnit: { label: 'Retro Knit', emoji: '🧶' },
  neonGlow: { label: 'Neon Glow', emoji: '💡' },
  minimalistLine: { label: 'Minimalist Line', emoji: '✏️' },
  popArt: { label: 'Pop Art', emoji: '💥' },
  metallicShine: { label: 'Metallic Shine', emoji: '✨' }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { baseDesignUrl, sockId } = await req.json();

    if (!baseDesignUrl || !sockId) {
      return new Response(
        JSON.stringify({ error: 'baseDesignUrl and sockId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎭 Starting batch style generation for sock:', sockId);
    
    const styleVariants = [];
    const styleKeys = Object.keys(STYLE_CONFIG);
    let successCount = 0;

    for (let i = 0; i < styleKeys.length; i++) {
      const styleKey = styleKeys[i];
      const styleInfo = STYLE_CONFIG[styleKey as keyof typeof STYLE_CONFIG];
      
      console.log(`🎨 Generating style ${i + 1}/${styleKeys.length}: ${styleInfo.label}...`);

      try {
        // Download base design
        const imageResponse = await fetch(baseDesignUrl);
        const imageBlob = await imageResponse.arrayBuffer();
        const base64Image = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(imageBlob)))}`;

        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        // Generate style variant
        const stylePrompt = getStylePrompt(styleKey, styleInfo.label);

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
                    text: stylePrompt
                  },
                  {
                    type: 'image_url',
                    image_url: { url: base64Image }
                  }
                ]
              }
            ],
            modalities: ['image', 'text']
          })
        });

        if (!aiResponse.ok) {
          console.error(`❌ AI API error for ${styleKey}:`, aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const styledImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!styledImageUrl) {
          console.error(`❌ No image generated for ${styleKey}`);
          continue;
        }

        // Upload styled image
        const base64Data = styledImageUrl.replace(/^data:image\/\w+;base64,/, '');
        const styledBlob = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        const filename = `${sockId}/${styleKey}-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('time-machine-posters')
          .upload(`socks/styles/${filename}`, styledBlob, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error(`❌ Upload failed for ${styleKey}:`, uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('time-machine-posters')
          .getPublicUrl(`socks/styles/${filename}`);

        styleVariants.push({
          style: styleKey,
          url: publicUrl,
          label: styleInfo.label,
          emoji: styleInfo.emoji
        });

        successCount++;
        console.log(`✅ Style ${i + 1}/${styleKeys.length} (${styleInfo.label}) generated`);

      } catch (err) {
        console.error(`❌ Error processing ${styleKey}:`, err);
      }
    }

    // Update album_socks record with style variants
    const { error: updateError } = await supabase
      .from('album_socks')
      .update({ style_variants: styleVariants })
      .eq('id', sockId);

    if (updateError) {
      console.error('Failed to update sock with style variants:', updateError);
    }

    console.log(`🎉 Batch generation complete: ${successCount}/${styleKeys.length} styles created`);

    return new Response(
      JSON.stringify({
        success: true,
        styleVariants,
        totalGenerated: successCount,
        totalAttempted: styleKeys.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error in batch-generate-sock-styles:', error);
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

function getStylePrompt(styleKey: string, label: string): string {
  const prompts: Record<string, string> = {
    vectorIllustration: 'Transform this into a clean vector illustration style with smooth gradients and sharp edges. Ultra high resolution.',
    watercolorPaint: 'Apply a watercolor paint effect with soft edges, color bleeding, and artistic brush strokes. Ultra high resolution.',
    retroKnit: 'Recreate with a vintage knitted texture pattern, showing fabric weave and yarn texture details. Ultra high resolution.',
    neonGlow: 'Transform into a vibrant neon glow style with fluorescent colors and light effects. Ultra high resolution.',
    minimalistLine: 'Convert to minimalist line art with clean contours and essential elements only. Ultra high resolution.',
    popArt: 'Apply a bold pop art style with halftone dots, high contrast, and comic book aesthetics. Ultra high resolution.',
    metallicShine: 'Add metallic shine and glossy finish with reflective highlights and luxurious appearance. Ultra high resolution.'
  };

  return prompts[styleKey] || `Apply ${label} style effect to this design. Ultra high resolution.`;
}
