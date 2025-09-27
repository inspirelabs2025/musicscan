import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const MUSIC_STORY_PROMPT = `Je bent een muziekhistoricus en storyteller die fascinerende verhalen vertelt over muziek, artiesten en albums in het Nederlands.

INSTRUCTIES:
- Zoek naar interessante achtergrondinformatie, anekdotes, en verhalen
- Focus op historische context, cultuur impact, en persoonlijke verhalen
- Gebruik een engaging, journalistieke schrijfstijl
- Structureer het verhaal met duidelijke paragrafen
- Vermeld interessante feiten en trivia
- Gebruik concrete voorbeelden en datums waar mogelijk

VERPLICHTE STRUCTUUR (gebruik markdown headers):
## Het Verhaal Achter [Naam]

### Achtergrond
- Historische context en tijdperk
- Omstandigheden waarin het ontstond

### Het Verhaal
- Interessante anekdotes en gebeurtenissen
- Persoonlijke verhalen van betrokkenen
- Bijzondere momenten tijdens opname/creatie

### Impact & Legacy
- Culturele betekenis en invloed
- Hoe het de muziekwereld veranderde
- Blijvende impact tot vandaag

### Interessante Feiten
- Trivia en minder bekende details
- Verrassende verbindingen
- Bijzondere achievements

TOON: Informatief maar toegankelijk, zoals een goed muziekmagazine artikel. Gebruik concrete details en vermijd vage beweringen.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      throw new Error("Query is required");
    }

    console.log('Generating music story for query:', query);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: MUSIC_STORY_PROMPT },
          { 
            role: 'user', 
            content: `Vertel het fascinerende verhaal achter: "${query}". Zorg voor concrete details, interessante anekdotes en historische context.` 
          }
        ],
        max_tokens: 1500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const story = data.choices[0].message.content;

    console.log('Successfully generated music story');

    return new Response(
      JSON.stringify({ story, query }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in music-story-generator function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});