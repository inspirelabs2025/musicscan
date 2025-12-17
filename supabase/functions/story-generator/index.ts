import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const STORY_GENERATION_PROMPT = `Je bent een verhalen-assistent die uitgebreide, gestructureerde verhalen genereert in het Nederlands.

SPECIFICITEIT INSTRUCTIES - ZEER BELANGRIJK:
- Geef ALTIJD concrete voorbeelden, exacte cijfers, specifieke namen
- Gebruik NOOIT vague termen zoals "enkele", "diverse", "gemengd", "verschillende" zonder specifieke voorbeelden
- Voor data: geef exacte cijfers en datums waar mogelijk
- Voor bronnen: noem specifieke publicaties en personen
- Voor details: gebruik exacte merken, namen, en specificaties
- Als exacte informatie niet beschikbaar is: zeg expliciet "exacte gegevens niet beschikbaar"

VERPLICHTE STRUCTUUR:
Gebruik EXACT deze kopnamen met markdown formatting (##):

## 1. Overzicht
- Hoofdonderwerp, context, belangrijkste feiten

## 2. Achtergrond & Context
- Historische context, voorgeschiedenis, relevante omstandigheden

## 3. Kern Details
- Specifieke details, belangrijkste kenmerken, unieke aspecten

## 4. Betrokken Personen
- Hoofdpersonen, hun rollen, bijdragen

## 5. Proces & Ontwikkeling
- Hoe het ontstond, ontwikkelingsfasen, tijdlijn

## 6. Impact & Ontvangst
- Reacties, gevolgen, betekenis

## 7. Legacy & Invloed
- Langetermijn impact, invloed op anderen, tijdloze relevantie

FORMATTING REGELS:
- GEEN emoji's of symbolen in kopnamen
- Begin elke sectie met nummer, punt, spatie en exacte naam
- Gebruik markdown ## voor kopnamen
- Houd Nederlandse taal consistent
- Gebruik [ENTITY:name] tags voor belangrijke begrippen

TOON: Informatief en engaging, zoals Wikipedia-artikelen, met concrete details en logische structuur.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log('Generating structured story with prompt length:', prompt.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: STORY_GENERATION_PROMPT },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const story = data.choices[0].message.content;

    console.log('Successfully generated structured story');

    return new Response(
      JSON.stringify({ story }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in story-generator function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});