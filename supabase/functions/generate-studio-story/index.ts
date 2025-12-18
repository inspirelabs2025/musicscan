import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const STUDIO_STORY_PROMPT = `Je bent een muziekjournalist en expert in opnamestudio's. Schrijf een uitgebreid, boeiend verhaal over de opgegeven studio.

STRUCTUUR (gebruik deze markdown headers):
## De Oorsprong
Beschrijf hoe en wanneer de studio is opgericht, de oprichters, en de visie.

## De Ruimte
Beschrijf de architectuur, akoestiek, unieke eigenschappen van de ruimte.

## Legendarische Opnames
Bespreek de meest iconische albums en nummers die hier zijn opgenomen.

## De Artiesten
Welke beroemde artiesten werkten hier? Anekdotes en bijzondere momenten.

## De Technologie
Beschrijf de kenmerkende apparatuur, mixing consoles, en wat de studio uniek maakt qua geluid.

## Culturele Impact
Wat betekent deze studio voor de muziekgeschiedenis? Welke genres zijn hier gevormd?

## Vandaag
Hoe staat de studio er nu voor? Nog steeds actief of een monument?

REGELS:
- Schrijf in het Nederlands
- Minimum 1200 woorden
- Gebruik boeiende, journalistieke taal
- Voeg concrete details toe: namen, jaren, albumnamen
- Geen AI-termen gebruiken
- Maak het persoonlijk en levendig`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studioName, location, foundedYear, notes, queueItemId } = await req.json();

    if (!studioName) {
      throw new Error('Studio naam is verplicht');
    }

    console.log(`🎙️ Generating story for studio: ${studioName}`);

    // Build prompt with context
    let contextPrompt = `Schrijf een uitgebreid verhaal over de opnamestudio: ${studioName}`;
    if (location) contextPrompt += `\nLocatie: ${location}`;
    if (foundedYear) contextPrompt += `\nOpgericht: ${foundedYear}`;
    if (notes) contextPrompt += `\nExtra context: ${notes}`;

    // Call AI API
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: STUDIO_STORY_PROMPT },
          { role: 'user', content: contextPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit - probeer later opnieuw');
      }
      if (response.status === 402) {
        throw new Error('Onvoldoende credits');
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const storyContent = data.choices?.[0]?.message?.content;

    if (!storyContent) {
      throw new Error('Geen content ontvangen van AI');
    }

    console.log(`✅ Generated ${storyContent.length} characters for ${studioName}`);

    // Calculate reading time and word count
    const wordCount = storyContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Create slug
    const slug = studioName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Save to database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: storyData, error: insertError } = await supabase
      .from('studio_stories')
      .insert({
        studio_name: studioName,
        slug,
        location,
        founded_year: foundedYear,
        story_content: storyContent,
        word_count: wordCount,
        reading_time: readingTime,
        meta_title: `${studioName} - Legendische Opnamestudio | MusicScan`,
        meta_description: `Ontdek het verhaal van ${studioName}${location ? ` in ${location}` : ''}. De geschiedenis, iconische opnames en artiesten.`,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    // Update queue item if provided
    if (queueItemId) {
      await supabase
        .from('studio_import_queue')
        .update({
          status: 'completed',
          story_id: storyData.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', queueItemId);
    }

    console.log(`📝 Saved studio story: ${studioData.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        story: storyData,
        wordCount,
        readingTime 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error generating studio story:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
