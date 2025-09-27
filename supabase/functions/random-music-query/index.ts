import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const RANDOM_QUERY_PROMPT = `Je bent een muziekexpert die interessante en diverse muziekquery's genereert voor verhalen. Je doel is om fascinerende, minder bekende verhalen uit de muziekgeschiedenis te ontdekken.

INSTRUCTIES:
- Genereer 1 specifieke muziekquery
- Kies uit verschillende tijdperken (1950s-2020s) 
- Mix bekende en minder bekende artiesten/nummers
- Varieer tussen solo artiesten, bands, albums en singles
- Zorg voor diversiteit in genres (rock, pop, jazz, electronic, hip-hop, folk, etc.)
- Focus op verhalen die interessant en verrassend kunnen zijn
- Vermijd de meest voor de hand liggende keuzes

FORMATEN (kies 1):
- "[Nummer] - [Artiest]" 
- "[Album] - [Artiest]"
- "[Artiest]"

VOORBEELDEN van goede keuzes:
- "Avalon - Roxy Music"
- "Autobahn - Kraftwerk" 
- "Caravan - Duke Ellington"
- "Heroes - David Bowie"
- "Gimme Shelter - The Rolling Stones"
- "What's Going On - Marvin Gaye"
- "Blue Monday - New Order"
- "Rappers Delight - Sugarhill Gang"
- "The Low End Theory - A Tribe Called Quest"
- "Disintegration - The Cure"

VERMIJD:
- Te voor de hand liggende keuzes zoals "Hotel California"
- Herhaalde artiesten uit dezelfde periode
- Alleen maar Nederlandse muziek
- Alleen maar mega-hits

Geef alleen de query terug, geen extra tekst.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎲 Generating random music query...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: RANDOM_QUERY_PROMPT },
          { 
            role: 'user', 
            content: 'Genereer een interessante, diverse muziekquery voor een verrassend verhaal. Zorg dat het niet te voor de hand ligt maar wel boeiend is.' 
          }
        ],
        max_completion_tokens: 50,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const randomQuery = data.choices[0].message.content.trim();

    console.log('✨ Generated random query:', randomQuery);

    return new Response(
      JSON.stringify({ 
        query: randomQuery
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in random-music-query function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});