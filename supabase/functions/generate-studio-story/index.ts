import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const STUDIO_STORY_PROMPT = `Je bent een wereldberoemde muziekjournalist en absolute expert in opnamestudio's. Je kent de diepste details en meest fascinerende verhalen van elke studio.

JOUW MISSIE: Ontdek en vertel de UNIEKE verhalen die deze studio speciaal maken.

Denk breed - wat maakt DEZE studio anders dan alle andere? Dit kan van alles zijn:
- Een 100 jaar oude piano met een bijzonder verhaal
- Een uniek mengpaneel dat nergens anders staat
- Bijzondere akoestiek door een speciale bouwconstructie
- Legendarische opnamesessies met onverwachte wendingen
- Iconische apparatuur met een eigen geschiedenis
- Bijzondere microfoons, versterkers, of outboard gear
- De architect die iets unieks creëerde
- Gekke gewoontes of tradities in de studio
- Beroemde conflicten of doorbraken die hier gebeurden
- Technische innovaties die hier werden uitgevonden

STRUCTUUR (gebruik deze markdown headers):

## Het Verhaal van de Studio
Wat maakt deze plek magisch? Pak de lezer direct.

## Het Ontstaan
De oprichters, hun visie, de eerste jaren, waarom juist deze locatie.

## Wat Deze Studio Uniek Maakt
🌟 DIT IS DE BELANGRIJKSTE SECTIE - HIER SCHITTER JE!

Beschrijf ALLES wat deze studio bijzonder maakt. Wees CONCREET en SPECIFIEK:
- Noem merken, modellen, bouwjaren
- Vertel WIE wat gebruikte en WELKE hit ermee werd gemaakt
- Beschrijf unieke eigenschappen die nergens anders te vinden zijn
- Vertel de verhalen achter de objecten en ruimtes

Voorbeelden van wat je kunt beschrijven:
- "De Bechstein vleugel uit 1898 waarop Elton John 'Your Song' speelde"
- "Het op maat gemaakte EMI TG12345 mengpaneel, speciaal gebouwd voor Abbey Road"
- "De echo chamber in de kelder die The Beatles 'that sound' gaf"
- "De houten vloer van een 17e-eeuwse kerk die de unieke akoestiek creëert"

## Legendarische Opnames
Welke albums en hits werden hier geboren? Vertel het verhaal erachter.

## De Producers & Engineers
De mensen achter het geluid - hun technieken en bijdragen.

## Onvergetelijke Momenten
Minstens 3-5 verhalen: grappig, dramatisch, of historisch belangrijk.

## De Ruimte
Architectuur, akoestiek, sfeer - wat voel je als je binnenloopt?

## Erfenis & Vandaag
Culturele impact en huidige status.

SCHRIJFREGELS:
- Nederlands, minimum 2000 woorden
- Journalistieke, meeslepende stijl
- CONCRETE details: namen, jaren, modelnummers, anekdotes
- Geen AI-termen
- Elk verhaal moet leven - wie, wat, wanneer, waarom
- Algemene beschrijvingen zijn VERBODEN - alleen specifieke feiten en verhalen`;

// YouTube search prompt for finding relevant videos
const YOUTUBE_SEARCH_PROMPT = `Geef een JSON array met 5-10 YouTube video IDs van iconische songs opgenomen in deze studio.

FORMAT (alleen JSON, geen andere tekst):
[
  {"video_id": "dQw4w9WgXcQ", "title": "Song Titel", "artist": "Artiest Naam"},
  ...
]

REGELS:
- Alleen echte, bestaande YouTube video IDs
- Focus op de meest iconische opnames van deze studio
- Varieer in artiesten en periodes
- Geef 5-10 videos`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studioName, location, foundedYear, notes, specialNotes, queueItemId } = await req.json();

    if (!studioName) {
      throw new Error('Studio naam is verplicht');
    }

    console.log(`🎙️ Generating story for studio: ${studioName}`);

    // Build prompt with context
    let contextPrompt = `Schrijf een uitgebreid verhaal over de opnamestudio: ${studioName}`;
    if (location) contextPrompt += `\nLocatie: ${location}`;
    if (foundedYear) contextPrompt += `\nOpgericht: ${foundedYear}`;
    if (notes) contextPrompt += `\nExtra context: ${notes}`;
    if (specialNotes) {
      contextPrompt += `\n\n⚠️ BELANGRIJKE DETAILS DIE JE MOET OPNEMEN:\n${specialNotes}\nDeze informatie is CRUCIAAL en moet uitgebreid beschreven worden in het verhaal, met name in de sectie "Iconische Instrumenten & Apparatuur".`;
    }

    // Call AI API for story
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

    // Fetch YouTube videos
    let youtubeVideos: any[] = [];
    try {
      const ytResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: YOUTUBE_SEARCH_PROMPT },
            { role: 'user', content: `Geef YouTube videos van songs opgenomen in: ${studioName}` }
          ],
        }),
      });

      if (ytResponse.ok) {
        const ytData = await ytResponse.json();
        const ytContent = ytData.choices?.[0]?.message?.content || '';
        // Extract JSON from response
        const jsonMatch = ytContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          youtubeVideos = JSON.parse(jsonMatch[0]);
          console.log(`🎬 Found ${youtubeVideos.length} YouTube videos`);
        }
      }
    } catch (ytError) {
      console.log('YouTube fetch failed, continuing without videos:', ytError);
    }

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
        youtube_videos: youtubeVideos,
        word_count: wordCount,
        reading_time: readingTime,
        meta_title: `${studioName} - Legendarische Opnamestudio | MusicScan`,
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

    console.log(`📝 Saved studio story: ${storyData.id}`);

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
