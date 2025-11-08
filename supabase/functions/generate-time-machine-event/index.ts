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
    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Voer een geldige concert beschrijving in (minimaal 10 karakters)' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating Time Machine event from prompt:', prompt);

    const systemPrompt = `Je bent een muziekhistoricus die expert is in legendarische concerten en muziekgeschiedenis.
Gegeven een concert beschrijving, genereer je gedetailleerde, feitelijk accurate informatie over het evenement in het Nederlands.

Je genereert:
1. Een pakkende event titel (zonder jaar)
2. Een subtitel die de sfeer weergeeft
3. Volledige venue informatie
4. Historische context (waarom was dit concert belangrijk?)
5. Culturele betekenis (impact op muziekgeschiedenis)
6. Een meeslepend verhaal (400-600 woorden) over de avond, geschreven alsof je erbij was
7. Suggesties voor poster stijl passend bij het tijdperk
8. Relevante tags

Het verhaal moet levendig zijn, details bevatten, en de lezer meenemen naar die avond.`;

    const userPrompt = `Parse en genereer een compleet Time Machine event voor dit concert:

"${prompt}"

Genereer alle informatie in het Nederlands. Wees zo specifiek en gedetailleerd mogelijk.`;

    // Use Lovable AI with tool calling for structured output
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_time_machine_event",
            description: "Generate structured Time Machine event data",
            parameters: {
              type: "object",
              properties: {
                event_title: { 
                  type: "string", 
                  description: "Pakkende titel zonder jaar (bijv. 'The Beatles Shea Stadium')" 
                },
                event_subtitle: { 
                  type: "string", 
                  description: "Korte subtitel die de sfeer weergeeft" 
                },
                artist_name: { type: "string", description: "Artiest naam" },
                venue_name: { type: "string", description: "Venue naam" },
                venue_city: { type: "string", description: "Stad" },
                venue_country: { type: "string", description: "Land" },
                concert_date: { 
                  type: "string", 
                  description: "Datum in ISO format (YYYY-MM-DD)" 
                },
                tour_name: { 
                  type: "string", 
                  description: "Tour naam indien bekend, anders null" 
                },
                historical_context: { 
                  type: "string", 
                  description: "Historische context in 100-150 woorden" 
                },
                cultural_significance: { 
                  type: "string", 
                  description: "Culturele betekenis in 100-150 woorden" 
                },
                story_content: { 
                  type: "string", 
                  description: "Uitgebreid verhaal van 400-600 woorden in markdown format" 
                },
                attendance_count: { 
                  type: "number", 
                  description: "Aantal bezoekers indien bekend, anders null" 
                },
                ticket_price_original: { 
                  type: "number", 
                  description: "Originele ticketprijs indien bekend, anders null" 
                },
                poster_style: { 
                  type: "string", 
                  description: "Suggestie voor poster stijl (bijv. 'Vintage 1960s psychedelic rock poster')" 
                },
                tags: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Array van relevante tags (5-8 tags)" 
                }
              },
              required: [
                "event_title", "event_subtitle", "artist_name", "venue_name", 
                "venue_city", "venue_country", "concert_date", "historical_context",
                "cultural_significance", "story_content", "poster_style", "tags"
              ],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { 
          type: "function", 
          function: { name: "generate_time_machine_event" } 
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Lovable AI credits opgebruikt. Voeg credits toe aan je workspace.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI response received:', JSON.stringify(aiResponse));

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('AI did not return structured data');
    }

    const eventData = JSON.parse(toolCall.function.arguments);
    console.log('Parsed event data:', eventData);

    // Validate required fields
    const requiredFields = [
      'event_title', 'artist_name', 'venue_name', 'venue_city', 
      'venue_country', 'concert_date', 'story_content'
    ];
    
    for (const field of requiredFields) {
      if (!eventData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Return the generated event data
    return new Response(
      JSON.stringify({ 
        success: true,
        eventData: {
          ...eventData,
          // Set some defaults
          is_published: false,
          is_featured: false,
          enable_metal_print: true,
          enable_standard_print: true,
          metal_price: 49.95,
          standard_price: 24.95
        }
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-time-machine-event:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
