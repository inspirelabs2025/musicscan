import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const SOUNDTRACK_STORY_PROMPT = `Je bent een expert in filmmuziek. Genereer een uitgebreid Nederlands verhaal over de soundtrack/score van de gegeven film.

VERPLICHTE STRUCTUUR (gebruik markdown ##):

## De Film
- Korte beschrijving van de film
- Regisseur en hoofdrolspelers
- Release jaar en genre

## De Componist
- Wie componeerde de muziek
- Waarom werd deze componist gekozen
- Eerdere samenwerkingen met de regisseur

## Het Compositieproces
- Hoe de score tot stand kwam
- Opname locatie en orkest
- Bijzondere instrumenten of technieken

## Muzikale Thema's
- Hoofdthema en leitmotieven
- Emotionele functie van de muziek
- Hoe de muziek het verhaal ondersteunt

## Iconische Momenten
- Specifieke scènes waar de muziek opvalt
- Beroemde tracks van de soundtrack
- Hoe muziek en beeld samenkomen

## Ontvangst & Awards
- Kritieken over de score
- Nominaties en gewonnen prijzen
- Commercieel succes van de soundtrack

## Legacy & Invloed
- Impact op filmmuziek
- Gebruik in populaire cultuur
- Blijvende populariteit

REGELS:
- Schrijf in het Nederlands
- Gebruik specifieke details, namen, en feiten
- Minimum 600 woorden
- Focus op de muziek, niet alleen de film`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filmTitle, composer, year, saveToDatabase = true } = await req.json();

    if (!filmTitle) {
      throw new Error("filmTitle is required");
    }

    console.log(`Generating soundtrack story for: ${filmTitle} (${year || 'unknown year'})`);

    const prompt = composer && year 
      ? `Schrijf een uitgebreid verhaal over de soundtrack van de film "${filmTitle}" (${year}), gecomponeerd door ${composer}.`
      : `Schrijf een uitgebreid verhaal over de soundtrack van de film "${filmTitle}".`;

    // Generate story using AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SOUNDTRACK_STORY_PROMPT },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const storyContent = data.choices?.[0]?.message?.content;

    if (!storyContent) {
      throw new Error('No story content generated');
    }

    console.log(`Generated soundtrack story for ${filmTitle}, length: ${storyContent.length} chars`);

    // Save to database if requested
    if (saveToDatabase) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const slug = `${filmTitle}-soundtrack`
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      const artistName = composer || 'Various Artists';
      const albumTitle = `${filmTitle} (Original Motion Picture Soundtrack)`;

      // Check if story already exists
      const { data: existing } = await supabase
        .from('music_stories')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('music_stories')
          .update({
            story_content: storyContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating story:', updateError);
        } else {
          console.log(`Updated existing soundtrack story for ${filmTitle}`);
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('music_stories')
          .insert({
            artist_name: artistName,
            album_title: albumTitle,
            slug,
            story_content: storyContent,
            genre: 'Soundtrack',
            release_year: year ? parseInt(year) : null,
            is_published: true,
            published_at: new Date().toISOString(),
            meta_title: `${filmTitle} Soundtrack - Filmmuziek Verhaal | MusicScan`,
            meta_description: `Ontdek het verhaal achter de soundtrack van ${filmTitle}. Lees over de muziek, componist en iconische thema's.`
          });

        if (insertError) {
          console.error('Error inserting story:', insertError);
          throw insertError;
        }
        console.log(`Created new soundtrack story for ${filmTitle}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        filmTitle,
        composer,
        year,
        storyLength: storyContent.length,
        story: storyContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-soundtrack-story:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
