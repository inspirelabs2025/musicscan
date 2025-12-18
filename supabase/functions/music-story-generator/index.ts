import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { detectArtistCountry } from "../_shared/country-detection.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const MUSIC_STORY_PROMPT = `Je bent een factual muziekjournalist die uitsluitend werkt met verificeerbare informatie. Je schrijft voor een Nederlands publiek in de stijl van NOS Cultuur of Volkskrant Muziek.

KRITISCHE INSTRUCTIES:
- ALLEEN VERIFICEERBARE FEITEN gebruiken
- GEEN SPECULATIE of verzonnen details
- Bij twijfel: vermeld "informatie niet beschikbaar" 
- Gebruik zinnen als "volgens bronnen", "naar verluidt", "officieel bevestigd"
- Voeg ALTIJD een disclaimer toe over bronverificatie

SCHRIJFSTIJL:
- Feitelijke, journalistieke professionaliteit
- Concrete datums, namen en officiële informatie
- Verificeerbare citaten van betrouwbare bronnen
- Duidelijke scheiding tussen feiten en interpretatie
- Transparantie over onzekerheden

VERPLICHTE STRUCTUUR (gebruik markdown headers):

# Het Verhaal Achter [Titel]

## Basisinformatie
Officiële details: uitgavedatum, label, catalogusnummer (indien beschikbaar), formaat. Vermeld ALLEEN bevestigde informatie.

## Ontstaan & Achtergrond  
Gedocumenteerde informatie over het ontstaan. Gebruik uitsluitend bronnen zoals interviews, officiële persberichten of bevestigde biografieën. Bij ontbrekende informatie: vermeld dit expliciet.

## Opnames & Productie
Geverifieerde studioinformatie: welke studio, producer, opnameperiode. Gebruik alleen officieel bevestigde details van credits of liner notes.

## Commerciële Prestaties
Feitelijke hitlijstposities, verkoopcijfers, certificeringen. Vermeld alleen officiele chart-data en bevestigde awards.

## Kritische Ontvangst
Gedocumenteerde recensies van gerenommeerde publicaties. Citeer specifieke bronnen met namen van recensenten en publicaties.

## Culturele Context
Historische context binnen de muziekgeschiedenis. Gebruik alleen bevestigde invloeden en documenteerde impact op andere artiesten.

## Technische Aspecten
Geverifieerde informatie over instrumentatie, geluidstechnieken of bijzondere opname-elementen uit officiële bronnen.

## Bronverificatie & Disclaimer
**Belangrijke notitie:** Dit verhaal is gebaseerd op publiek beschikbare informatie. Voor volledige accuraatheid wordt aangeraden aanvullende bronnen te raadplegen. Niet alle details kunnen onafhankelijk geverifieerd worden.

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
- Minimaal 800 woorden van puur feitelijke inhoud
- UITSLUITEND verificeerbare informatie
- Duidelijke bronvermelding waar mogelijk
- Bij twijfel: expliciete vermelding van onzekerheid
- Professionele, neutrale journalistieke taal
- Nederlandse spelling volgens Groene Boekje

VERBODEN:
- Speculatie of gissingen presenteren als feiten
- Persoonlijke interpretaties zonder bronvermelding  
- Romantisering of dramatisering van gebeurtenissen
- Aannames over gevoelens of motivaties van artiesten

TOON: Strikt feitelijk zoals NOS Journaal of Volkskrant nieuwsberichten. Neutraal, informatief, transparant over beperkingen van beschikbare informatie.`;

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

    console.log('🎵 Generating music story with Lovable AI for query:', query);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: MUSIC_STORY_PROMPT },
          { 
            role: 'user', 
            content: `Schrijf een feitelijk, goed onderbouwd artikel over: "${query}". Gebruik ALLEEN verificeerbare informatie. Bij elke bewering: zorg dat deze onderbouwd kan worden met officiële bronnen. Gebruik de structuur met 8 secties voor een professioneel artikel van 800-1000 woorden. Voeg de verplichte disclaimer toe over bronverificatie.` 
          }
        ],
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Te veel verzoeken naar de AI. Probeer het over 30 seconden opnieuw.');
      } else if (response.status === 402) {
        throw new Error('AI credits zijn op. Voeg credits toe in Settings → Workspace → Usage.');
      }
      throw new Error(`Lovable AI error: ${response.status} - ${errorText.substring(0, 200)}`);
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

    // Detect country code for the artist
    console.log('🌍 Detecting country code for artist...');
    const countryCode = extractedData.artist ? await detectArtistCountry(extractedData.artist, lovableApiKey!) : null;
    console.log(`🌍 Country code detected: ${countryCode || 'unknown'}`);

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
        tags: extractedData.tags,
        country_code: countryCode, // AI-detected country
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