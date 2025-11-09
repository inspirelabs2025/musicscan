import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function cleanJsonResponse(content: string): string {
  // Strip markdown code blocks (```json ... ``` or ``` ... ```)
  return content
    .replace(/^```(?:json)?\s*\n?/i, '')  // Remove opening ```json or ```
    .replace(/\n?```\s*$/i, '')            // Remove closing ```
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { albumCoverUrl, discogsId, artistName, albumTitle } = await req.json();

    if (!albumCoverUrl) {
      return new Response(
        JSON.stringify({ error: 'albumCoverUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎨 Extracting colors for:', artistName, '-', albumTitle);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI for color extraction
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
              {
                type: 'text',
                text: `Analyze this album cover and extract color information for sock design.

Return a JSON object with this exact structure:
{
  "primary_color": "#HEXCODE",
  "secondary_color": "#HEXCODE", 
  "accent_color": "#HEXCODE",
  "color_palette": ["#HEX1", "#HEX2", "#HEX3", "#HEX4", "#HEX5"],
  "design_theme": "psychedelic|minimalist|grunge|vintage|modern|abstract",
  "pattern_type": "stripes|geometric|dots|abstract|graphic",
  "era": "description of visual era/style"
}

Guidelines:
- primary_color: Most dominant/background color
- secondary_color: Second most prominent
- accent_color: Most striking/eye-catching detail color
- color_palette: 5 colors that work together on fabric
- Ensure colors have enough contrast for visibility on socks
- Consider how colors will look when repeated as patterns
- Avoid too light/washed out colors for fabric printing`
              },
              {
                type: 'image_url',
                image_url: {
                  url: albumCoverUrl
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      throw new Error(`AI API returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const cleanContent = cleanJsonResponse(aiData.choices[0].message.content);
    const colorData = JSON.parse(cleanContent);

    console.log('✅ Colors extracted:', colorData);

    return new Response(
      JSON.stringify({
        success: true,
        ...colorData,
        discogs_id: discogsId,
        artist_name: artistName,
        album_title: albumTitle
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error extracting colors:', error);
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
