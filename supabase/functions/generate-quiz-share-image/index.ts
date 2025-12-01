import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quizResultId, score, totalQuestions, percentage, quizType, badgeTitle, badgeEmoji, username } = await req.json();

    console.log('Generating quiz share image:', { quizResultId, percentage, quizType, badgeTitle });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Image generation not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate share image using AI
    const quizTypeLabel = quizType === 'physical_only' ? 'Fysieke Collectie' :
                         quizType === 'spotify_only' ? 'Spotify' :
                         quizType === 'mixed' ? 'Mixed' : 'Muziek';

    const prompt = `Create a visually striking social media share card (1200x630 pixels, 16:9 aspect ratio) for a music quiz result.

Design requirements:
- Modern, clean design with a dark purple/blue gradient background
- Large, bold score display: "${percentage}%" in the center
- Below the score: "${score}/${totalQuestions} correct"
- Badge display: "${badgeEmoji} ${badgeTitle}"
- Quiz type indicator: "${quizTypeLabel} Quiz"
- "MusicScan" branding in the corner
- Decorative music-related elements (subtle vinyl records, music notes, headphones)
- Celebration confetti or sparkles effect for scores above 75%
- Professional, shareable design suitable for social media
- Text must be clearly readable

The design should feel celebratory and make people want to take the quiz themselves.`;

    console.log('Calling Lovable AI for image generation...');

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
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI image generation failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Image generation failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('AI response received');

    const imageUrl = aiResponse.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error('No image in AI response');
      return new Response(
        JSON.stringify({ error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract base64 data and upload to storage
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `quiz-share-${quizResultId}.png`;
    const filePath = `quiz-shares/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('fanwall-photos')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload image', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('fanwall-photos')
      .getPublicUrl(filePath);

    console.log('Share image uploaded successfully:', publicUrl);

    // Update quiz result with image URL
    if (quizResultId) {
      await supabase
        .from('quiz_results')
        .update({ share_image_url: publicUrl })
        .eq('id', quizResultId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        shareImageUrl: publicUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quiz-share-image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
