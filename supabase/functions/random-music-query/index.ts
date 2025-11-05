import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const generateRandomQueryPrompt = (genre?: string, period?: string) => {
  let prompt = `Je bent een muziekexpert die interessante en diverse muziekquery's genereert voor verhalen. Je doel is om fascinerende, minder bekende verhalen uit de muziekgeschiedenis te ontdekken.

INSTRUCTIES:
- Genereer 1 specifieke muziekquery`;

  if (genre && genre !== 'alle') {
    prompt += `
- FOCUS OP ${genre.toUpperCase()} GENRE`;
  } else {
    prompt += `
- Kies uit verschillende genres (rock, pop, jazz, electronic, hip-hop, folk, classical, world music, etc.)`;
  }

  if (period && period !== 'alle') {
    prompt += `
- FOCUS OP DE ${period.toUpperCase()}`;
  } else {
    prompt += `
- Kies uit verschillende tijdperken (1950s-2020s)`;
  }

  prompt += `
- Mix bekende en minder bekende artiesten/nummers
- Varieer tussen solo artiesten, bands, albums en singles
- Focus op verhalen die interessant en verrassend kunnen zijn
- Vermijd de meest voor de hand liggende keuzes

FORMATEN (kies 1):
- "[Nummer] - [Artiest]" 
- "[Album] - [Artiest]"
- "[Artiest]"

VOORBEELDEN van goede keuzes${genre ? ` in ${genre}` : ''}${period ? ` uit de ${period}` : ''}:`;

  if (genre === 'rock' || !genre) {
    prompt += `
- "Heroes - David Bowie"
- "Gimme Shelter - The Rolling Stones"`;
  }
  if (genre === 'electronic' || !genre) {
    prompt += `
- "Autobahn - Kraftwerk"
- "Blue Monday - New Order"`;
  }
  if (genre === 'jazz' || !genre) {
    prompt += `
- "Caravan - Duke Ellington"`;
  }
  if (genre === 'hip-hop' || !genre) {
    prompt += `
- "Rappers Delight - Sugarhill Gang"
- "The Low End Theory - A Tribe Called Quest"`;
  }
  if (genre === 'pop' || !genre) {
    prompt += `
- "Avalon - Roxy Music"`;
  }
  if (genre === 'alternative' || !genre) {
    prompt += `
- "Disintegration - The Cure"`;
  }

  prompt += `

VERMIJD:
- Te voor de hand liggende keuzes zoals "Hotel California"
- Herhaalde artiesten uit dezelfde periode
- Alleen maar Nederlandse muziek
- Alleen maar mega-hits

Geef alleen de query terug, geen extra tekst.`;

  return prompt;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { genre, period } = await req.json().catch(() => ({ genre: null, period: null }));
    
    console.log('🎲 Generating random music query with Lovable AI...', { genre, period });

    const prompt = generateRandomQueryPrompt(genre, period);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: prompt },
          { 
            role: 'user', 
            content: `Genereer een interessante muziekquery${genre && genre !== 'alle' ? ` in het ${genre} genre` : ''}${period && period !== 'alle' ? ` uit de ${period}` : ''}. Zorg dat het verrassend maar boeiend is.` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        throw new Error('Te veel verzoeken naar de AI. Even geduld en probeer het over 30 seconden opnieuw.');
      } else if (response.status === 402) {
        throw new Error('AI credits zijn op. Voeg credits toe in Settings → Workspace → Usage.');
      }
      throw new Error(`Lovable AI error: ${response.status} - ${errorText.substring(0, 200)}`);
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