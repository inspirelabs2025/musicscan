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

## Het Verhaal van de Studio
Een inleiding over wat deze studio zo bijzonder maakt in de muziekwereld.

## Het Ontstaan
Beschrijf hoe en wanneer de studio is opgericht, de oprichters, hun visie en de eerste jaren.

## Iconische Instrumenten & Apparatuur
Dit is een CRUCIALE sectie! Beschrijf uitgebreid:
- Beroemde piano's: merk, model, leeftijd, geschiedenis, op welke opnames te horen
- Unieke versterkers, synthesizers of drumkits met een verhaal
- Speciale microfoons of vintage mengpanelen (SSL, Neve, API etc.)
- Bijzondere akoestische instrumenten
- Het VERHAAL achter elk instrument: wie speelde erop, welke hits werden ermee opgenomen
- Voorbeeld: "De legendarische Bechstein vleugel uit 1905 waarop Elton John 'Your Song' componeerde"

## Artiesten & Albums
Welke iconische artiesten werkten hier? Noem specifieke albums die hier zijn opgenomen met jaren.

## De Producers
Welke legendarische producers zijn verbonden aan deze studio? Beschrijf hun werkwijze en bijdragen.

## Bijzondere Verhalen & Anekdotes
Vertel minstens 3-5 unieke verhalen, grappige momenten, of bijzondere gebeurtenissen die hier plaatsvonden.

## De Ruimte & Technologie
Beschrijf de architectuur, akoestiek, kenmerkende apparatuur en wat de studio uniek maakt qua geluid.

## Culturele Impact
Wat betekent deze studio voor de muziekgeschiedenis?

## Vandaag
Hoe staat de studio er nu voor?

REGELS:
- Schrijf in het Nederlands
- Minimum 1500 woorden
- Gebruik boeiende, journalistieke taal
- Voeg concrete details toe: namen, jaren, albumnamen
- Geen AI-termen gebruiken
- Maak het persoonlijk en levendig
- Focus op verhalen en anekdotes die de studio tot leven brengen
- BELANGRIJK: Instrumenten en apparatuur verdienen uitgebreide aandacht - dit maakt een studio uniek!`;

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

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    console.log('🏭 Studio batch processor starting...');

    // Get next pending item
    const { data: queueItem, error: fetchError } = await supabase
      .from('studio_import_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError || !queueItem) {
      console.log('📭 No pending studio items in queue');
      return new Response(
        JSON.stringify({ message: 'No pending items' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎙️ Processing: ${queueItem.studio_name}`);

    // Mark as processing
    await supabase
      .from('studio_import_queue')
      .update({ 
        status: 'processing', 
        attempts: queueItem.attempts + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', queueItem.id);

    // Build prompt
    let contextPrompt = `Schrijf een uitgebreid verhaal over de opnamestudio: ${queueItem.studio_name}`;
    if (queueItem.location) contextPrompt += `\nLocatie: ${queueItem.location}`;
    if (queueItem.founded_year) contextPrompt += `\nOpgericht: ${queueItem.founded_year}`;
    if (queueItem.notes) contextPrompt += `\nExtra context: ${queueItem.notes}`;
    if (queueItem.special_notes) {
      contextPrompt += `\n\n⚠️ BELANGRIJKE DETAILS DIE JE MOET OPNEMEN:\n${queueItem.special_notes}\nDeze informatie is CRUCIAAL en moet uitgebreid beschreven worden in het verhaal, met name in de sectie "Iconische Instrumenten & Apparatuur".`;
    }

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
      
      await supabase
        .from('studio_import_queue')
        .update({ 
          status: queueItem.attempts + 1 >= 3 ? 'failed' : 'pending',
          error_message: `AI API error: ${response.status}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const storyContent = data.choices?.[0]?.message?.content;

    if (!storyContent) {
      throw new Error('Geen content ontvangen van AI');
    }

    console.log(`✅ Generated ${storyContent.length} characters for ${queueItem.studio_name}`);

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
            { role: 'user', content: `Geef YouTube videos van songs opgenomen in: ${queueItem.studio_name}` }
          ],
        }),
      });

      if (ytResponse.ok) {
        const ytData = await ytResponse.json();
        const ytContent = ytData.choices?.[0]?.message?.content || '';
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
    const slug = queueItem.studio_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Save story
    const { data: storyData, error: insertError } = await supabase
      .from('studio_stories')
      .insert({
        studio_name: queueItem.studio_name,
        slug,
        location: queueItem.location,
        country_code: queueItem.country_code,
        founded_year: queueItem.founded_year,
        story_content: storyContent,
        youtube_videos: youtubeVideos,
        word_count: wordCount,
        reading_time: readingTime,
        meta_title: `${queueItem.studio_name} - Legendarische Opnamestudio | MusicScan`,
        meta_description: `Ontdek het verhaal van ${queueItem.studio_name}${queueItem.location ? ` in ${queueItem.location}` : ''}. De geschiedenis, iconische opnames en artiesten.`,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      
      await supabase
        .from('studio_import_queue')
        .update({ 
          status: 'failed',
          error_message: insertError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);

      throw new Error(`Database error: ${insertError.message}`);
    }

    // Update queue item as completed
    await supabase
      .from('studio_import_queue')
      .update({
        status: 'completed',
        story_id: storyData.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueItem.id);

    console.log(`📝 Saved studio story: ${storyData.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        studio: queueItem.studio_name,
        storyId: storyData.id,
        wordCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Studio batch processor error:', error);
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
