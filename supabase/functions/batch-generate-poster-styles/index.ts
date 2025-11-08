import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STYLE_CONFIG = {
  vectorCartoon: { label: 'Vector Cartoon', emoji: '🎨' },
  posterize: { label: 'Pop Art', emoji: '🎭' },
  oilPainting: { label: 'Oil Painting', emoji: '🖼️' },
  watercolor: { label: 'Watercolor', emoji: '💧' },
  pencilSketch: { label: 'Pencil Sketch', emoji: '✏️' },
  comicBook: { label: 'Comic Book', emoji: '💥' },
  abstract: { label: 'Abstract', emoji: '🌈' }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { posterUrl, eventId, artistName } = await req.json();

    if (!posterUrl || !eventId) {
      return new Response(
        JSON.stringify({ error: 'posterUrl and eventId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎨 Starting batch style generation for event:', eventId);
    
    const styleVariants = [];
    const styleKeys = Object.keys(STYLE_CONFIG);
    let successCount = 0;

    for (let i = 0; i < styleKeys.length; i++) {
      const styleKey = styleKeys[i];
      const styleInfo = STYLE_CONFIG[styleKey as keyof typeof STYLE_CONFIG];
      
      console.log(`🎨 Generating style ${i + 1}/${styleKeys.length}: ${styleInfo.label}...`);

      try {
        // Call stylize-photo function
        const { data: styleData, error: styleError } = await supabase.functions.invoke('stylize-photo', {
          body: {
            imageUrl: posterUrl,
            style: styleKey
          }
        });

        if (styleError) {
          // Log full error details to see WHAT is failing
          console.error(`❌ Stylize-photo returned error for ${styleKey}:`, {
            message: styleError.message,
            details: styleError,
            fullError: JSON.stringify(styleError)
          });
          continue;
        }

        // Also log the full response for debugging
        console.log(`📦 Stylize-photo response for ${styleKey}:`, {
          hasData: !!styleData,
          hasUrl: !!styleData?.stylizedImageUrl,
          success: styleData?.success,
          error: styleData?.error
        });

        if (!styleData?.stylizedImageUrl) {
          console.error(`❌ No stylizedImageUrl for ${styleKey}. Response:`, JSON.stringify(styleData));
          continue;
        }

        // Convert base64 to Uint8Array
        const base64Data = styleData.stylizedImageUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBlob = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to storage
        const filename = `${eventId}/${styleKey}-${Date.now()}.png`;
        const { error: uploadError } = await supabase.storage
          .from('time-machine-posters')
          .upload(`styles/${filename}`, imageBlob, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error(`❌ Upload failed for ${styleKey}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('time-machine-posters')
          .getPublicUrl(`styles/${filename}`);

        styleVariants.push({
          style: styleKey,
          url: publicUrl,
          label: styleInfo.label,
          emoji: styleInfo.emoji
        });

        successCount++;
        console.log(`✅ Style ${i + 1}/${styleKeys.length} (${styleInfo.label}) generated successfully`);

      } catch (err) {
        console.error(`❌ Error processing ${styleKey}:`, err);
      }
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
    console.error('❌ Error in batch-generate-poster-styles:', error);
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
