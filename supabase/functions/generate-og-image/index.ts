import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photoId } = await req.json();
    
    if (!photoId) {
      throw new Error('photoId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📸 Generating OG image for photo:', photoId);

    // Fetch photo details
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (photoError) throw photoError;

    // Download original image
    const imageResponse = await fetch(photo.display_url);
    const imageBlob = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBlob)));
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    // Generate OG image with overlay using Lovable AI
    const prompt = `Create a social media Open Graph image (1200x630px) with the following:
    - Main image: Use the provided photo as the background
    - Add a semi-transparent dark gradient overlay at the bottom
    - Text overlay in white: "${photo.artist || 'Music Memory'}" (large, bold)
    - Subtitle: "${photo.caption || ''}" (medium size)
    - Add "MusicScan FanWall" branding in the corner
    - Include musical note icons or vinyl record decorative elements
    - Professional, eye-catching design suitable for social media sharing`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
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
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI generation failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const ogImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!ogImageUrl) {
      throw new Error('No OG image generated');
    }

    // Convert base64 to blob and upload to storage
    const ogBase64Data = ogImageUrl.split(',')[1];
    const ogBinaryData = Uint8Array.from(atob(ogBase64Data), c => c.charCodeAt(0));

    const ogFileName = `og-images/${photoId}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fanwall-photos')
      .upload(ogFileName, ogBinaryData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('fanwall-photos')
      .getPublicUrl(ogFileName);

    // Update photo with OG image URL
    const { error: updateError } = await supabase
      .from('photos')
      .update({ og_image_url: publicUrl })
      .eq('id', photoId);

    if (updateError) throw updateError;

    console.log('✅ OG image generated and uploaded:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        og_image_url: publicUrl 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-og-image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
