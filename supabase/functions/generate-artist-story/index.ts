import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const ARTIST_STORY_PROMPT = `Je bent een professionele muziekjournalist die biografische verhalen schrijft over artiesten in het Nederlands. Je schrijft in de stijl van NOS Cultuur of Volkskrant Muziek.

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

# Het Verhaal van [Artiest Naam]

## Biografie & Beginjaren
Geboorte, afkomst, eerste muzikale invloeden, formatie van de band/start solocarrière. Vermeld ALLEEN bevestigde informatie.

## Muziekstijl & Invloeden
Genrebepaling, kenmerkende sound, belangrijkste muzikale invloeden. Gebruik uitsluitend bronnen zoals interviews, officiële persberichten of bevestigde biografieën.

## Doorbraak & Commercieel Succes
Eerste hits, doorbraakalbums, grote tournees. Gebruik alleen officieel bevestigde details van charts of verkoopcijfers.

## Belangrijkste Albums & Singles
Chronologisch overzicht van meest iconische releases. Vermeld alleen officiële release data en bevestigde informatie.

## Culturele Impact & Erfenis
Invloed op muziekscene, awards, erkenning door andere artiesten. Gebruik alleen gedocumenteerde invloeden en bevestigde impact.

## Legacy & Huidige Status
Blijvende relevantie, recente activiteiten, invloed op moderne muziek. Bij ontbrekende informatie: vermeld dit expliciet.

## Bronverificatie & Disclaimer
**Belangrijke notitie:** Dit verhaal is gebaseerd op publiek beschikbare informatie. Voor volledige accuraatheid wordt aangeraden aanvullende bronnen te raadplegen. Niet alle details kunnen onafhankelijk geverifieerd worden.

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

function generateSlug(artistName: string): string {
  return artistName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
}

function generateTitle(artistName: string): string {
  return `Het Verhaal van ${artistName}`;
}

function extractMetadata(artistName: string, story: string) {
  // Extract year from story content
  const yearMatch = story.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  // Extract genres based on common music genres
  const genres = ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'country', 'folk', 'blues', 'r&b', 'metal', 'punk', 'indie', 'alternative'];
  const foundGenres = genres.filter(g => story.toLowerCase().includes(g));
  
  // Extract notable albums from story
  const albumMatches = story.match(/album[:\s]+["']([^"']+)["']/gi) || [];
  const notableAlbums = albumMatches.map(m => m.replace(/album[:\s]+["']([^"']+)["']/i, '$1')).slice(0, 5);
  
  // Generate tags based on content
  const tags = [
    artistName.toLowerCase().replace(/\s+/g, ''),
    ...foundGenres,
    'muziek',
    'artiest',
    'biografie'
  ].filter(Boolean);
  
  return {
    music_style: foundGenres.length > 0 ? foundGenres : null,
    notable_albums: notableAlbums.length > 0 ? notableAlbums : null,
    tags
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName, userId: providedUserId } = await req.json();
    
    if (!artistName) {
      throw new Error("Artist name is required");
    }

    // Get user ID from JWT header OR from request body (for batch processing)
    let userId = providedUserId;
    
    if (!userId) {
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
    }
    
    if (!userId) {
      console.log('⚙️ Geen userId beschikbaar; verhaal wordt opgeslagen zonder gekoppelde user');
    }

    console.log('🎸 Generating artist story with Lovable AI for:', artistName);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: ARTIST_STORY_PROMPT },
          { 
            role: 'user', 
            content: `Schrijf een feitelijk, goed onderbouwd biografisch artikel over de artiest: "${artistName}". Gebruik ALLEEN verificeerbare informatie. Bij elke bewering: zorg dat deze onderbouwd kan worden met officiële bronnen. Gebruik de structuur met 7 secties voor een professioneel artikel van 800-1000 woorden. Voeg de verplichte disclaimer toe over bronverificatie.` 
          }
        ],
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

    // Extract metadata from story
    const extractedData = extractMetadata(artistName, story);
    
    // Calculate reading time and word count
    const wordCount = story.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    // Generate title and slug
    const title = generateTitle(artistName);
    const slug = generateSlug(artistName);

    // Extract biography (first paragraph)
    const firstParagraphMatch = story.match(/##\s+Biografie[^\n]*\n\n([^\n]+)/);
    const biography = firstParagraphMatch ? firstParagraphMatch[1] : story.substring(0, 200) + '...';

    // Try to fetch artist artwork from Discogs
    let artworkUrl = null;
    try {
      console.log('🎨 Attempting to fetch artist artwork from Discogs...');
      const discogsToken = Deno.env.get('DISCOGS_TOKEN');
      if (discogsToken) {
        const searchResponse = await fetch(
          `https://api.discogs.com/database/search?q=${encodeURIComponent(artistName)}&type=artist&per_page=1`,
          {
            headers: {
              'Authorization': `Discogs token=${discogsToken}`,
              'User-Agent': 'MusicScan/1.0'
            }
          }
        );
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.results && searchData.results.length > 0) {
            artworkUrl = searchData.results[0].cover_image || searchData.results[0].thumb;
            console.log('✅ Artist artwork found:', artworkUrl);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching artist artwork:', error);
      // Don't fail the whole request for artwork errors
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Prepare insert payload (omit user_id if not available)
    const insertPayload: Record<string, unknown> = {
      artist_name: artistName,
      slug,
      story_content: story,
      biography,
      music_style: extractedData.music_style,
      notable_albums: extractedData.notable_albums,
      artwork_url: artworkUrl,
      is_published: true,
      published_at: new Date().toISOString(),
      reading_time: readingTime,
      word_count: wordCount,
      meta_title: `${title} | MusicScan`,
      meta_description: biography.substring(0, 160),
    };
    if (userId) {
      (insertPayload as any).user_id = userId;
    }

    const { data: artistStory, error: saveError } = await supabase
      .from('artist_stories')
      .insert(insertPayload)
      .select()
      .single();

    if (saveError) {
      console.error('Database save error:', saveError);
      throw new Error(`Failed to save artist story: ${saveError.message}`);
    }

    console.log('✅ Successfully generated and saved artist story');

    return new Response(
      JSON.stringify({ 
        story, 
        artistName,
        slug,
        title,
        id: artistStory.id,
        artwork_url: artworkUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-artist-story function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
