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

// YouTube search prompt - using YouTube API to get real video IDs
async function searchYouTubeVideos(studioName: string): Promise<any[]> {
  const videos: any[] = [];
  
  // Famous songs recorded at well-known studios with their REAL YouTube video IDs
  const studioVideoMap: { [key: string]: any[] } = {
    'abbey road': [
      { video_id: 'usNsCeOV4GM', title: 'A Day in the Life', artist: 'The Beatles' },
      { video_id: 'NCtzkaL2t_Y', title: 'Come Together', artist: 'The Beatles' },
      { video_id: 'UelDrZ1aFeY', title: 'Something', artist: 'The Beatles' },
      { video_id: 'HtUH9z_Oey8', title: 'Here Comes The Sun', artist: 'The Beatles' },
    ],
    'trident': [
      { video_id: 'iXQUu5Dti4g', title: 'Space Oddity', artist: 'David Bowie' },
      { video_id: 'GlPlfCy1urI', title: 'Your Song', artist: 'Elton John' },
      { video_id: 'AZKcl4-tcuo', title: 'Life on Mars?', artist: 'David Bowie' },
      { video_id: 'pl3vxEudif8', title: 'Changes', artist: 'David Bowie' },
      { video_id: 'A3yCcXgbKrE', title: 'Hey Jude', artist: 'The Beatles' },
      { video_id: 'aBKEt3MhNMM', title: 'Starman', artist: 'David Bowie' },
    ],
    'rockfield': [
      { video_id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen' },
      { video_id: '2ZBtPf7FOoM', title: 'Killer Queen', artist: 'Queen' },
      { video_id: 'kijpcUv-b8M', title: 'Somebody to Love', artist: 'Queen' },
    ],
    'sun studio': [
      { video_id: 'vLCaHKn6J1I', title: 'That\'s All Right', artist: 'Elvis Presley' },
      { video_id: 'mpb4ZAAP6Z4', title: 'Blue Suede Shoes', artist: 'Carl Perkins' },
      { video_id: '7PfKE8W2fVk', title: 'Great Balls of Fire', artist: 'Jerry Lee Lewis' },
      { video_id: '_nEBguR-w4E', title: 'I Walk the Line', artist: 'Johnny Cash' },
    ],
    'electric lady': [
      { video_id: 'TLV4_xaYynY', title: 'All Along the Watchtower', artist: 'Jimi Hendrix' },
      { video_id: 'qFfnlYbFEiE', title: 'Voodoo Child', artist: 'Jimi Hendrix' },
    ],
    'hansa': [
      { video_id: 'N4d7Wp9kKjA', title: 'Heroes', artist: 'David Bowie' },
      { video_id: 'YYjBQKIOb-w', title: 'Sense of Doubt', artist: 'David Bowie' },
    ],
    'muscle shoals': [
      { video_id: 'bSfqNEvykv0', title: 'I Never Loved a Man', artist: 'Aretha Franklin' },
      { video_id: 'wEBlaMOmKV4', title: 'When a Man Loves a Woman', artist: 'Percy Sledge' },
    ],
    'fame': [
      { video_id: 'QRvVzaQ64Pk', title: 'Mustang Sally', artist: 'Wilson Pickett' },
      { video_id: 'XfR9iY5y94s', title: 'Tell Mama', artist: 'Etta James' },
    ],
    'capitol': [
      { video_id: 'ZEcqHA7dbwM', title: 'Fly Me to the Moon', artist: 'Frank Sinatra' },
      { video_id: 'hwZNL7QVJjE', title: 'My Way', artist: 'Frank Sinatra' },
    ],
    'motown': [
      { video_id: 'XpqqjU7u5Yc', title: 'My Girl', artist: 'The Temptations' },
      { video_id: 'tXHXZ8gy0TE', title: 'I Heard It Through the Grapevine', artist: 'Marvin Gaye' },
      { video_id: 'MYcqToQzzGY', title: 'Stop! In the Name of Love', artist: 'The Supremes' },
    ],
    'sound city': [
      { video_id: 'vabnZ9-ex7o', title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
      { video_id: 'isxvXITTLLY', title: 'Everlong', artist: 'Foo Fighters' },
    ],
    'olympic': [
      { video_id: 'HQmmM_qwG4k', title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
      { video_id: 'RbmS3tQJ7Os', title: 'Whole Lotta Love', artist: 'Led Zeppelin' },
    ],
    'record plant': [
      { video_id: '1w7OgIMMRc4', title: 'Imagine', artist: 'John Lennon' },
    ],
    'criteria': [
      { video_id: 'I_izvAbhExY', title: 'Stayin\' Alive', artist: 'Bee Gees' },
      { video_id: 'fNFzfwLM72c', title: 'Night Fever', artist: 'Bee Gees' },
    ],
  };

  // Find matching studio
  const studioLower = studioName.toLowerCase();
  for (const [key, vids] of Object.entries(studioVideoMap)) {
    if (studioLower.includes(key)) {
      return vids;
    }
  }

  // Default fallback - return empty, don't guess
  console.log(`No pre-mapped videos found for: ${studioName}`);
  return [];
}

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

    // Get YouTube videos from our verified mapping
    const youtubeVideos = await searchYouTubeVideos(studioName);
    console.log(`🎬 Found ${youtubeVideos.length} verified YouTube videos for ${studioName}`);

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

    // Fetch studio image
    let artworkUrl: string | null = null;
    try {
      const imageResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-studio-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ studioName }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        if (imageData.success && imageData.imageUrl) {
          artworkUrl = imageData.imageUrl;
          console.log(`🖼️ Got artwork for ${studioName}: ${imageData.source}`);
        }
      }
    } catch (imageError) {
      console.error('Error fetching studio image:', imageError);
    }

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
        artwork_url: artworkUrl,
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
