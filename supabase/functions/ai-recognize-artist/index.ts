import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, mediaLibraryId } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Starting artist recognition for image: ${imageUrl.substring(0, 100)}...`);

    const prompt = `You are an expert at identifying musicians and music artists from photos.

Analyze this image and identify any musicians, bands, or music-related people visible.

Consider:
- Facial features and recognition of known artists
- Stage presence and performance context
- Musical instruments being played
- Band merchandise, logos, or branding
- Concert/venue settings
- Album artwork or vinyl covers in frame
- Promotional photos or press shots
- Any text visible that might indicate the artist name

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "primary_artist": "Artist Name or null if unknown",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why you identified this artist",
  "alternative_artists": ["Other", "Possible", "Matches"],
  "context_type": "concert|portrait|vinyl|merchandise|album_cover|press_photo|candid|unknown",
  "tags": ["genre", "era", "style"],
  "people_count": 1,
  "contains_text": ["any", "visible", "text"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', content.substring(0, 500));

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      result = {
        primary_artist: null,
        confidence: 0,
        reasoning: 'Could not parse AI response',
        alternative_artists: [],
        context_type: 'unknown',
        tags: [],
        people_count: 0,
        contains_text: []
      };
    }

    // If we have a mediaLibraryId, update the record
    if (mediaLibraryId) {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { error: updateError } = await supabase
        .from('media_library')
        .update({
          ai_status: 'completed',
          recognized_artist: result.primary_artist,
          artist_confidence: result.confidence,
          ai_tags: result.tags || [],
          ai_description: result.reasoning,
          alternative_artists: result.alternative_artists || [],
          ai_context_type: result.context_type,
          ai_reasoning: result.reasoning,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaLibraryId);
      
      if (updateError) {
        console.error('Failed to update media library record:', updateError);
      } else {
        console.log(`Updated media library record ${mediaLibraryId} with artist: ${result.primary_artist}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
        mediaLibraryId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-recognize-artist:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to recognize artist' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
