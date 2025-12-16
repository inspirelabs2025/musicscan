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

const COMPOSER_STORY_PROMPT = `Je bent een expert in filmmuziek en filmcomponisten. Genereer een uitgebreid Nederlands verhaal over de gegeven filmcomponist.

VERPLICHTE STRUCTUUR (gebruik markdown ##):

## Biografie
- Geboorte, opleiding, vroege carrière
- Persoonlijke achtergrond

## Muzikale Stijl
- Kenmerkende compositietechnieken
- Instrumentatie en orkestratie
- Unieke sound en herkenbare elementen

## Doorbraak & Belangrijkste Werken
- Doorbraakfilm(s) met specifieke titels en jaren
- Top 5-10 meest iconische scores met filmnamen

## Samenwerkingen
- Regisseurs waarmee vaak samengewerkt
- Orkesten en muzikanten

## Awards & Erkenning
- Oscars (specifieke jaren en films)
- Grammy's, Golden Globes, BAFTA's
- Andere belangrijke prijzen

## Culturele Impact
- Invloed op filmmuziek genre
- Invloed op andere componisten
- Iconische thema's die iedereen kent

## Legacy
- Blijvende bijdrage aan cinema
- Huidige status en recente werk

REGELS:
- Schrijf in het Nederlands
- Gebruik specifieke filmtitels, jaren, en namen
- Minimum 800 woorden
- Geen vage termen - altijd concrete voorbeelden
- Focus op feiten en muzikale analyse`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { composerName, saveToDatabase = true } = await req.json();

    if (!composerName) {
      throw new Error("composerName is required");
    }

    console.log(`Generating story for composer: ${composerName}`);

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
          { role: 'system', content: COMPOSER_STORY_PROMPT },
          { role: 'user', content: `Schrijf een uitgebreid verhaal over filmcomponist: ${composerName}` }
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

    console.log(`Generated story for ${composerName}, length: ${storyContent.length} chars`);

    // Save to database if requested
    if (saveToDatabase) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const slug = composerName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Check if story already exists
      const { data: existing } = await supabase
        .from('artist_stories')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('artist_stories')
          .update({
            story_content: storyContent,
            updated_at: new Date().toISOString(),
            music_style: ['Film Score', 'Soundtrack', 'Orchestral'],
            is_published: true,
            published_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating story:', updateError);
        } else {
          console.log(`Updated existing story for ${composerName}`);
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('artist_stories')
          .insert({
            artist_name: composerName,
            slug,
            story_content: storyContent,
            music_style: ['Film Score', 'Soundtrack', 'Orchestral'],
            is_published: true,
            published_at: new Date().toISOString(),
            meta_title: `${composerName} - Filmcomponist Biografie | MusicScan`,
            meta_description: `Ontdek het verhaal van filmcomponist ${composerName}. Lees over zijn iconische scores, awards en muzikale stijl.`
          });

        if (insertError) {
          console.error('Error inserting story:', insertError);
          throw insertError;
        }
        console.log(`Created new story for ${composerName}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        composerName,
        storyLength: storyContent.length,
        story: storyContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-composer-story:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
