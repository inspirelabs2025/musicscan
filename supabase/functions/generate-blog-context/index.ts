import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { blogPostId, albumYear, albumTitle, albumArtist } = await req.json();
    
    if (!blogPostId || !albumYear || !albumTitle || !albumArtist) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating context for ${albumArtist} - ${albumTitle} (${albumYear})`);

    // Generate context using Perplexity API
    const prompt = `Generate historical and cultural context for the album "${albumTitle}" by ${albumArtist} released in ${albumYear}. 

Please provide a structured JSON response with the following format:
{
  "historical_events": [
    {
      "title": "Event Title",
      "description": "Brief description of what happened",
      "date": "Optional specific date"
    }
  ],
  "music_scene_context": [
    {
      "title": "Music Scene Development",
      "description": "What was happening in music at the time",
      "artists": ["Artist 1", "Artist 2"]
    }
  ],
  "cultural_context": [
    {
      "title": "Cultural Movement/Trend",
      "description": "Cultural significance or trends",
      "impact": "How it impacted society"
    }
  ]
}

Focus on:
1. Major world events that happened in ${albumYear}
2. The music scene and other popular albums/artists of ${albumYear}
3. Cultural movements, fashion, technology trends of ${albumYear}
4. Any specific relevance to ${albumArtist} or the genre

Keep descriptions concise (max 100 words each) and provide 2-4 items per category. Write in Dutch.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'Je bent een muziekhistoricus en cultureel expert. Geef nauwkeurige historische context in het Nederlands. Antwoord altijd alleen met geldige JSON. Schrijf beknopt en informatief.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1500,
          search_recency_filter: 'week',
          return_images: false,
          return_related_questions: false
        }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Raw Perplexity response:', generatedContent);

    // Parse the JSON response
    let contextData;
    try {
      contextData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.error('Raw content:', generatedContent);
      
      // Fallback: create minimal context data
      contextData = {
        historical_events: [
          {
            title: `Gebeurtenissen in ${albumYear}`,
            description: `Het jaar waarin ${albumTitle} werd uitgebracht was een belangrijk jaar in de geschiedenis.`,
            date: albumYear.toString()
          }
        ],
        music_scene_context: [
          {
            title: `Muziekscene ${albumYear}`,
            description: `${albumArtist} bracht ${albumTitle} uit in een tijd van muzikale innovatie.`,
            artists: [albumArtist]
          }
        ],
        cultural_context: [
          {
            title: `Cultuur in ${albumYear}`,
            description: `De culturele context van ${albumYear} beïnvloedde de muziek van die tijd.`,
            impact: "Culturele invloed op de muziek"
          }
        ]
      };
    }

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      try {
        const saveResponse = await fetch(`${supabaseUrl}/rest/v1/blog_context`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            blog_post_id: blogPostId,
            historical_events: contextData.historical_events,
            music_scene_context: contextData.music_scene_context,
            cultural_context: contextData.cultural_context,
            ai_model: 'perplexity-api',
            cached_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          })
        });

        if (!saveResponse.ok) {
          console.error('Failed to save context to database:', await saveResponse.text());
        } else {
          console.log('Context saved to database successfully');
        }
      } catch (saveError) {
        console.error('Error saving to database:', saveError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        context: contextData 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-context function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});