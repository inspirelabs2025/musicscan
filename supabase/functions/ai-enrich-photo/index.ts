import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichRequest {
  image_url: string;
  caption?: string;
  artist?: string;
  album?: string;
  venue?: string;
  city?: string;
  country?: string;
  event_date?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url, caption, artist, album, venue, city, country, event_date }: EnrichRequest = await req.json();

    console.log('📸 AI Enrich Photo request:', { image_url, artist, city });

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build context for AI
    const context = [
      artist && `Artist: ${artist}`,
      album && `Album: ${album}`,
      venue && `Venue: ${venue}`,
      city && `City: ${city}`,
      country && `Country: ${country}`,
      event_date && `Date: ${event_date}`,
      caption && `Caption: ${caption}`,
    ].filter(Boolean).join('\n');

    const prompt = `You are analyzing a music-related photo for the MusicScan FanWall. Based on the context provided, generate:

1. Up to 10 relevant tags (lowercase, single words or short phrases, focus on music genre, era, mood, instrument types)
2. SEO title (max 60 chars, include artist/band name and year/city if available, engaging and descriptive)
3. SEO description (140-160 chars, natural language, enticing, includes key details)
4. Suggested canonical path slug (format: artist-city-year-shortid, lowercase with hyphens)
5. Safety assessment (check for: nudity, violence, brand logos, copyright concerns)

Context:
${context || 'No additional context provided'}

Return JSON with this exact structure:
{
  "tags": ["rock", "concert", "1990s", "live"],
  "seo_title": "The Smashing Pumpkins Live in Rotterdam 1996",
  "seo_description": "Memorable concert photo from The Smashing Pumpkins' iconic Rotterdam show in 1996. Experience the raw energy of 90s alternative rock.",
  "slug_suggestion": "smashing-pumpkins-rotterdam-1996",
  "safety": {
    "is_safe": true,
    "concerns": []
  },
  "inferred_data": {
    "artist": "The Smashing Pumpkins",
    "confidence": 0.9
  }
}`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a music metadata expert helping to enrich photo descriptions for a music community platform.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    console.log('🤖 AI Response:', aiResponse);

    // Parse AI response
    let enrichedData;
    try {
      enrichedData = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Add uniqueness to slug
    const timestamp = Date.now().toString().slice(-6);
    enrichedData.slug_suggestion = `${enrichedData.slug_suggestion}-${timestamp}`;

    // Construct canonical URL
    enrichedData.canonical_url = `https://www.musicscan.app/photo/${enrichedData.slug_suggestion}`;

    console.log('✅ Enrichment complete:', enrichedData);

    return new Response(
      JSON.stringify(enrichedData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-enrich-photo:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
