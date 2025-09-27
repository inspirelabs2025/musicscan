import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const MUSIC_STORY_PROMPT = `Je bent een ervaren muziekjournalist en cultureel historicus die diepgaande verhalen vertelt over muziek, artiesten en nummers in het Nederlands. Jouw verhalen zijn van hetzelfde niveau als professionele muziekmagazines.

DOEL: Maak een uitgebreid, professioneel verhaal dat lezers meeneemt in de wereld achter een muziekstuk.

SCHRIJFSTIJL:
- Journalistieke professionaliteit met toegankelijke toon
- Concrete details, datums, namen, en verificeerbare feiten
- Persoonlijke anekdotes en verhalen van betrokkenen
- Culturele en historische context
- Technische details over productie wanneer relevant

VERPLICHTE STRUCTUUR (gebruik markdown headers):

# Het Verhaal Achter [Titel]

## De Single/Het Nummer
Waarom dit nummer tijdloos relevant is. Wat maakt dit nummer bijzonder in de catalogus van de artiest? Eerste indruk, impact, en waarom het vandaag nog steeds resoneren heeft.

## Het Verhaal
De achtergrond en context van het ontstaan. Wat was de inspiratie? Welke gebeurtenissen leidden tot dit nummer? Persoonlijke omstandigheden van de artiest(en) tijdens het schrijfproces.

## De Opnames & Productie
Studio details, producer informatie, opnameproces. Welke studio werd gebruikt? Wie was de producer? Interessante technische aspecten, gebruikte instrumenten, bijzondere opnametechnieken.

## Artwork & Presentatie
Single hoes ontwerp, video concept (indien van toepassing). Wie ontwierp de artwork? Welke visuele concepten werden gebruikt? Video productie verhalen.

## Kritieken & Ontvangst
Pers reacties en professionele reviews toen het uitkwam. Hoe reageerde de muziektpers? Wat vonden critici? Eerste publieke reacties.

## Commercieel Succes & Impact
Hitlijsten, awards, culturele impact. Hoe presteerde het commercieel? Welke hitlijsten werden behaald? Awards gewonnen? Culturele bewegingen beïnvloed?

## Verzamelwaarde
Zeldzaamheid, collector's items, verschillende uitgaves. Zijn er zeldzame persingen? Wat zijn bijzondere uitgaves waard? Vinyl cultuur aspecten.

## Persoonlijke Touch
Anekdotes van de artiest, bandleden, producer. Wat vertelden betrokkenen later over dit nummer? Persoonlijke herinneringen en verhalen.

## Luister met Aandacht
Specifieke luistertips - waar moet je op letten? Verborgen details in de mix, bijzondere instrumentatie, vocale technieken, productietrucs die opvallen bij aandachtig luisteren.

## Voor Wie Is Dit?
Doelgroep beschrijving - welke muziekliefhebbers waarderen dit? Fans van welke andere artiesten zouden dit kunnen waarderen? Plaats in de muziekgeschiedenis.

METADATA REQUIREMENTS:
Zorg dat je informatie verzamelt voor:
- Artiest naam
- Nummer titel  
- Uitgavejaar
- Label
- Catalogusnummer (indien bekend)
- Album (indien onderdeel van album)
- Genre en stijlen
- Producer naam
- Studio naam

KWALITEITSEISEN:
- Minimaal 1200 woorden
- Concrete namen, datums en feiten
- Verificeerbare informatie waar mogelijk
- Diepgaand onderzoek naar achtergronden
- Professionele journalistieke kwaliteit
- Nederlandse taal met correcte spelling en grammatica

TOON: Professioneel maar toegankelijk, zoals Muziekencyclopedie, OOR Magazine, of de Volkskrant Muziek. Gebruik concrete details en vermijd vage beweringen. Wees informatief én boeiend.`;

function generateSlug(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
}

function generateTitle(query: string): string {
  return `Het Verhaal Achter ${query.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')}`;
}

function extractMetadata(query: string, story: string) {
  // Parse query to extract artist and single name
  const queryParts = query.split(/[,-]/).map(s => s.trim());
  const artist = queryParts.length > 1 ? queryParts[1] : queryParts[0].split(' ')[0];
  const single = queryParts[0];
  
  // Try to extract year from story content
  const yearMatch = story.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  // Extract label from story content
  const labelMatch = story.match(/label[:\s]+([\w\s&]+)/i);
  const label = labelMatch ? labelMatch[1].trim() : null;
  
  // Extract genre suggestions based on common music genres
  const genres = ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'country', 'folk', 'blues', 'r&b'];
  const foundGenre = genres.find(g => story.toLowerCase().includes(g));
  const genre = foundGenre || null;
  
  // Generate tags based on content
  const tags = [
    artist?.toLowerCase().replace(/\s+/g, ''),
    genre,
    'muziek',
    'verhaal',
    'geschiedenis'
  ].filter(Boolean);
  
  return {
    artist: artist || null,
    single: single || null,
    year,
    label,
    catalog: null, // Would need more sophisticated parsing
    album: null, // Would need more sophisticated parsing  
    genre,
    styles: genre ? [genre] : [],
    tags
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      throw new Error("Query is required");
    }

    // Get user ID from JWT header
    let userId = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.error('Failed to parse JWT:', e);
      }
    }
    
    if (!userId) {
      throw new Error("Authentication required");
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
            content: `Vertel het fascinerende verhaal achter: "${query}". Zorg voor concrete details, interessante anekdotes en historische context. Gebruik de volledige structuur met alle 10 secties voor een professioneel verhaal van minimaal 1200 woorden.` 
          }
        ],
        max_tokens: 2500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const story = data.choices[0].message.content;

    // Extract metadata from query and story
    const extractedData = extractMetadata(query, story);
    
    // Calculate reading time and word count
    const wordCount = story.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    // Generate title and slug
    const title = generateTitle(query);
    const slug = generateSlug(query);

    // Generate YAML frontmatter
    const yamlFrontmatter = {
      title: title,
      artist: extractedData.artist,
      single: extractedData.single,
      year: extractedData.year,
      label: extractedData.label,
      catalog: extractedData.catalog,
      album: extractedData.album,
      genre: extractedData.genre,
      styles: extractedData.styles,
      slug: slug,
      tags: extractedData.tags,
      meta_title: `${title} - MusicScan`,
      meta_description: `Ontdek het fascinerende verhaal achter ${query}. Lees over de achtergrond, productie en impact van dit tijdloze muziekstuk.`,
      reading_time: readingTime,
      word_count: wordCount
    };

    // Generate social post
    const socialPost = `🎵 Ontdek het verhaal achter "${query}" 

${story.substring(0, 150)}... 

Lees meer op MusicScan! #muziek #verhaal #${extractedData.artist?.toLowerCase().replace(/\s+/g, '')} #musicscan`;

    // Save to database using direct HTTP request
    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/music_stories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey!,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        query: query.trim(),
        story_content: story,
        slug,
        title,
        is_published: true,
        yaml_frontmatter: yamlFrontmatter,
        social_post: socialPost.substring(0, 280), // Twitter limit
        reading_time: readingTime,
        word_count: wordCount,
        meta_title: yamlFrontmatter.meta_title,
        meta_description: yamlFrontmatter.meta_description,
        artist: extractedData.artist,
        single_name: extractedData.single,
        year: extractedData.year,
        label: extractedData.label,
        catalog: extractedData.catalog,
        album: extractedData.album,
        genre: extractedData.genre,
        styles: extractedData.styles,
        tags: extractedData.tags
      })
    });

    if (!saveResponse.ok) {
      const errorData = await saveResponse.text();
      console.error('Database save error:', errorData);
      throw new Error(`Failed to save story: ${saveResponse.statusText}`);
    }

    const [musicStory] = await saveResponse.json();

    console.log('Successfully generated and saved music story');

    // Fetch album artwork after creating the story
    let artworkUrl = null;
    if (extractedData.artist && (extractedData.single || extractedData.album)) {
      try {
        console.log('🎨 Starting artwork fetch for music story...');
        const artworkResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-album-artwork`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artist: extractedData.artist,
            title: extractedData.single || extractedData.album || query,
            media_type: 'single',
            item_id: musicStory.id,
            item_type: 'music_stories'
          })
        });

        if (artworkResponse.ok) {
          const artworkData = await artworkResponse.json();
          if (artworkData.success && artworkData.artwork_url) {
            artworkUrl = artworkData.artwork_url;
            console.log('✅ Artwork fetched successfully:', artworkUrl);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching artwork:', error);
        // Don't fail the whole request for artwork errors
      }
    }

    const blogUrl = `/muziek-verhaal/${slug}`;

    return new Response(
      JSON.stringify({ 
        story, 
        query, 
        blogUrl,
        slug,
        title,
        id: musicStory.id,
        artwork_url: artworkUrl
      }),
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