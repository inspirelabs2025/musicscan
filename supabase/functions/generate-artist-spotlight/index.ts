import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to call AI with specific prompt
async function callAI(apiKey: string, prompt: string, maxTokens = 8000): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Generate a single section of the story
async function generateSection(
  apiKey: string, 
  artistName: string, 
  sectionName: string, 
  sectionInstructions: string,
  previousContent: string = ''
): Promise<string> {
  const prompt = `Je bent een gepassioneerde muziekjournalist. Schrijf de sectie "${sectionName}" voor een spotlight over ${artistName}.

INSTRUCTIES VOOR DEZE SECTIE:
${sectionInstructions}

KRITIEKE REGELS:
- Schrijf 400-600 woorden voor deze sectie
- Gebruik markdown: begin met ## ${sectionName}
- Schrijf in het Nederlands
- ROND DE SECTIE VOLLEDIG AF - eindig NOOIT midden in een zin
- Zorg dat de laatste zin een volledige, afgeronde gedachte is
- Gebruik een narratieve, verhaalvertellende stijl

${previousContent ? `CONTEXT (voorgaande secties, voor continuïteit):
${previousContent.slice(-1500)}

Bouw hierop voort met nieuwe informatie.` : ''}

Schrijf nu ALLEEN de sectie "${sectionName}" (zonder andere secties):`;

  const content = await callAI(apiKey, prompt, 4000);
  console.log(`Section "${sectionName}" generated: ${content.split(/\s+/).length} words`);
  return content;
}

// Continue/complete an incomplete story
async function continueStory(apiKey: string, artistName: string, currentContent: string): Promise<string> {
  const prompt = `Je bent een muziekjournalist. Het volgende verhaal over ${artistName} is NIET AFGEROND. 

HUIDIGE TEKST (laatste 2000 karakters):
${currentContent.slice(-2000)}

OPDRACHT:
1. Maak de huidige paragraaf/zin VOLLEDIG af als die incompleet is
2. Voeg een afsluitende "## Conclusie en Nalatenschap" sectie toe (200-300 woorden)
3. Eindig met een krachtige, afgeronde laatste zin

KRITIEK:
- Begin DIRECT waar de tekst stopte (geen herhaling)
- Eindig met een punt, uitroepteken of vraagteken
- De laatste zin moet een complete gedachte zijn

Schrijf nu de voortzetting:`;

  const continuation = await callAI(apiKey, prompt, 3000);
  console.log(`Continuation generated: ${continuation.split(/\s+/).length} words`);
  return continuation;
}

// Check if story is complete
function isStoryComplete(content: string): { complete: boolean; reason: string } {
  const wordCount = content.split(/\s+/).length;
  const lastChars = content.slice(-100).trim();
  const endsWithPunctuation = /[.!?]\s*$/.test(lastChars);
  const hasConclusion = content.toLowerCase().includes('conclusie') || 
                        content.toLowerCase().includes('nalatenschap') ||
                        content.toLowerCase().includes('legacy');
  
  if (wordCount < 2000) {
    return { complete: false, reason: `Te kort: ${wordCount} woorden (minimum 2000)` };
  }
  if (!endsWithPunctuation) {
    return { complete: false, reason: `Eindigt niet met leesteken: "${lastChars.slice(-50)}"` };
  }
  if (!hasConclusion && wordCount < 3000) {
    return { complete: false, reason: 'Geen conclusie sectie gevonden' };
  }
  
  return { complete: true, reason: 'OK' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName, slug: inputSlug, spotlightId, force } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // STEP 1: Determine if we're updating existing or creating new
    let existingSpotlight: any = null;
    let resolvedArtistName = artistName;
    let targetSlug = inputSlug;

    if (spotlightId) {
      const { data } = await supabase
        .from('artist_stories')
        .select('*')
        .eq('id', spotlightId)
        .eq('is_spotlight', true)
        .single();
      existingSpotlight = data;
      if (data) {
        resolvedArtistName = data.artist_name;
        targetSlug = data.slug;
      }
    } else if (inputSlug) {
      const { data } = await supabase
        .from('artist_stories')
        .select('*')
        .eq('slug', inputSlug)
        .eq('is_spotlight', true)
        .single();
      existingSpotlight = data;
      if (data) {
        resolvedArtistName = data.artist_name;
        targetSlug = data.slug;
      }
    } else if (artistName && force) {
      // Force mode with artistName: find existing by name
      const { data } = await supabase
        .from('artist_stories')
        .select('*')
        .eq('artist_name', artistName)
        .eq('is_spotlight', true)
        .maybeSingle();
      existingSpotlight = data;
      if (data) {
        targetSlug = data.slug;
      }
    }

    if (!resolvedArtistName) {
      throw new Error('Artist name is required (via artistName, slug, or spotlightId)');
    }

    const isUpdate = !!existingSpotlight;
    console.log(`=== SPOTLIGHT GENERATION ===`);
    console.log(`Artist: ${resolvedArtistName}`);
    console.log(`Mode: ${isUpdate ? 'UPDATE existing' : 'CREATE new'}`);
    console.log(`Target slug: ${targetSlug || 'will generate'}`);
    console.log(`Force: ${force}`);

    // If not update mode and not force, check for duplicates
    if (!isUpdate && !force) {
      const { data: duplicate } = await supabase
        .from('artist_stories')
        .select('id')
        .eq('artist_name', resolvedArtistName)
        .eq('is_spotlight', true)
        .maybeSingle();

      if (duplicate) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Er bestaat al een spotlight voor ${resolvedArtistName}.`,
            code: 'DUPLICATE',
            existing_id: duplicate.id
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // STEP 2: Generate outline + metadata (small JSON call)
    console.log(`\n--- Step 1: Generating outline and metadata ---`);
    const outlinePrompt = `Je bent een muziekexpert. Geef informatie over ${resolvedArtistName} in dit JSON formaat:

{
  "spotlight_description": "Korte teaser van 2-3 zinnen over de artiest",
  "notable_albums": ["Album1", "Album2", "Album3", "Album4", "Album5"],
  "music_style": ["Stijl1", "Stijl2", "Stijl3"],
  "key_facts": {
    "birth_year": "jaar of onbekend",
    "origin": "land/stad",
    "genres": "genres",
    "active_years": "periode"
  }
}

Retourneer ALLEEN valide JSON, geen andere tekst.`;

    const outlineRaw = await callAI(LOVABLE_API_KEY, outlinePrompt, 1000);
    
    let metadata: any = {};
    try {
      // Extract JSON from response
      let jsonStr = outlineRaw;
      const jsonMatch = outlineRaw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      } else {
        const firstBrace = outlineRaw.indexOf('{');
        const lastBrace = outlineRaw.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = outlineRaw.substring(firstBrace, lastBrace + 1);
        }
      }
      metadata = JSON.parse(jsonStr);
      console.log('Metadata parsed:', Object.keys(metadata));
    } catch (e) {
      console.error('Failed to parse metadata, using defaults');
      metadata = {
        spotlight_description: `Een uitgebreide spotlight over ${resolvedArtistName}.`,
        notable_albums: [],
        music_style: ['Rock', 'Pop'],
        key_facts: {}
      };
    }

    // STEP 3: Generate story in sections
    console.log(`\n--- Step 2: Generating story sections ---`);
    
    const sections = [
      {
        name: 'Beginjaren en Doorbraak',
        instructions: `Beschrijf:
- Vroege jeugd en muzikale opvoeding van ${resolvedArtistName}
- Eerste stappen in de muziek, bandformaties
- Het doorbraakmoment en eerste succes
- Belangrijke vroege samenwerkingen en invloeden
Gebruik concrete details, jaartallen en anekdotes.`
      },
      {
        name: 'Muzikale Evolutie',
        instructions: `Beschrijf:
- Hoe het geluid van ${resolvedArtistName} evolueerde door de jaren
- Verschillende periodes en stijlveranderingen
- Belangrijkste albums en hun context/betekenis
- Productietechnieken, producers, muzikanten
- Experimenten en vernieuwingen`
      },
      {
        name: 'Culturele Impact en Legacy',
        instructions: `Beschrijf:
- De invloed van ${resolvedArtistName} op andere artiesten en genres
- Maatschappelijke betekenis en culturele impact
- Awards, erkenning, records
- Hoe het werk doorwerkt tot vandaag`
      },
      {
        name: 'Persoonlijke Verhalen en Anekdotes',
        instructions: `Deel:
- Interessante verhalen achter de schermen
- Persoonlijke uitdagingen en triomfen
- Memorabele quotes van de artiest
- Bijzondere momenten in de carrière
- Relaties met andere muzikanten`
      },
      {
        name: 'Discografie Hoogtepunten',
        instructions: `Beschrijf in detail:
- Must-have albums met uitleg waarom
- Hidden gems en ondergewaardeerde werken
- Collectible releases en zeldzame opnames
- Live albums en speciale uitgaves
- Aanbevelingen voor nieuwe luisteraars`
      },
      {
        name: 'Conclusie en Nalatenschap',
        instructions: `Schrijf een krachtige afsluiting:
- Samenvatting van de artistieke betekenis
- De blijvende invloed op de muziekwereld
- Wat maakt deze artiest uniek en tijdloos
- Eindig met een memorabele, afgeronde gedachte`
      }
    ];

    let fullStoryContent = '';
    
    for (const section of sections) {
      console.log(`Generating section: ${section.name}...`);
      const sectionContent = await generateSection(
        LOVABLE_API_KEY,
        resolvedArtistName,
        section.name,
        section.instructions,
        fullStoryContent
      );
      fullStoryContent += '\n\n' + sectionContent;
      
      const currentWords = fullStoryContent.split(/\s+/).length;
      console.log(`Total words so far: ${currentWords}`);
    }

    // STEP 4: Validate and continue if needed
    console.log(`\n--- Step 3: Validating completeness ---`);
    let completionCheck = isStoryComplete(fullStoryContent);
    let continueAttempts = 0;
    const maxContinueAttempts = 3;

    while (!completionCheck.complete && continueAttempts < maxContinueAttempts) {
      continueAttempts++;
      console.log(`Continue attempt ${continueAttempts}/${maxContinueAttempts}: ${completionCheck.reason}`);
      
      const continuation = await continueStory(LOVABLE_API_KEY, resolvedArtistName, fullStoryContent);
      fullStoryContent += '\n\n' + continuation;
      
      completionCheck = isStoryComplete(fullStoryContent);
    }

    const finalWordCount = fullStoryContent.split(/\s+/).length;
    console.log(`\n=== FINAL STATUS ===`);
    console.log(`Word count: ${finalWordCount}`);
    console.log(`Complete: ${completionCheck.complete} (${completionCheck.reason})`);
    console.log(`Last 100 chars: "${fullStoryContent.slice(-100)}"`);

    // STEP 5: Fetch album artworks
    console.log(`\n--- Step 4: Fetching album artworks ---`);
    let artworkUrl = existingSpotlight?.artwork_url || null;
    const spotlightImages = existingSpotlight?.spotlight_images || [];

    if (DISCOGS_TOKEN && metadata.notable_albums?.length > 0) {
      for (const album of metadata.notable_albums.slice(0, 5)) {
        try {
          const searchQuery = `${resolvedArtistName} ${album}`;
          const discogsResponse = await fetch(
            `https://api.discogs.com/database/search?q=${encodeURIComponent(searchQuery)}&type=release&per_page=1`,
            {
              headers: {
                'Authorization': `Discogs token=${DISCOGS_TOKEN}`,
                'User-Agent': 'MusicScan/1.0'
              }
            }
          );

          if (discogsResponse.ok) {
            const discogsData = await discogsResponse.json();
            if (discogsData.results?.[0]?.cover_image) {
              const coverUrl = discogsData.results[0].cover_image;
              if (coverUrl && !coverUrl.includes('spacer.gif')) {
                // Only add if not already in array
                const exists = spotlightImages.some((img: any) => img.caption === album);
                if (!exists) {
                  spotlightImages.push({
                    url: coverUrl,
                    type: 'album',
                    caption: album,
                    alt_text: `${resolvedArtistName} - ${album} album cover`
                  });
                }
                if (!artworkUrl) artworkUrl = coverUrl;
                console.log(`Found artwork for: ${album}`);
              }
            }
          }
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error fetching artwork for ${album}:`, error);
        }
      }
    }

    // Find matching products
    const { data: products } = await supabase
      .from('platform_products')
      .select('id')
      .ilike('artist', `%${resolvedArtistName}%`)
      .eq('status', 'active')
      .not('published_at', 'is', null)
      .limit(6);

    const featuredProducts = products?.map(p => p.id) || [];

    // Generate slug if needed
    if (!targetSlug) {
      targetSlug = resolvedArtistName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-spotlight';
    }

    const readingTime = Math.ceil(finalWordCount / 200);

    const musicStyleArray = Array.isArray(metadata.music_style) 
      ? metadata.music_style 
      : [metadata.music_style || 'Pop'];

    // STEP 6: Save to database (UPDATE or INSERT)
    console.log(`\n--- Step 5: Saving to database ---`);
    
    const storyPayload = {
      artist_name: resolvedArtistName,
      slug: targetSlug,
      story_content: fullStoryContent.trim(),
      spotlight_description: metadata.spotlight_description || `Spotlight over ${resolvedArtistName}`,
      notable_albums: metadata.notable_albums || [],
      music_style: musicStyleArray,
      spotlight_images: spotlightImages,
      featured_products: featuredProducts,
      artwork_url: artworkUrl,
      is_spotlight: true,
      is_published: existingSpotlight?.is_published ?? false,
      word_count: finalWordCount,
      reading_time: readingTime,
      meta_title: `${resolvedArtistName} - In de Spotlight | MusicScan`,
      meta_description: (metadata.spotlight_description || '').substring(0, 160),
      updated_at: new Date().toISOString()
    };

    let savedStory: any;

    if (isUpdate && existingSpotlight) {
      // UPDATE existing spotlight (keep same ID and slug)
      console.log(`Updating existing spotlight ID: ${existingSpotlight.id}`);
      const { data, error } = await supabase
        .from('artist_stories')
        .update(storyPayload)
        .eq('id', existingSpotlight.id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw new Error(`Failed to update spotlight: ${error.message}`);
      }
      savedStory = data;
      console.log(`SUCCESS: Updated spotlight for ${resolvedArtistName}`);
    } else {
      // INSERT new spotlight
      console.log(`Creating new spotlight`);
      const { data, error } = await supabase
        .from('artist_stories')
        .insert(storyPayload)
        .select()
        .single();

      if (error) {
        if ((error as any)?.code === '23505') {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Er bestaat al een spotlight voor ${resolvedArtistName}.`,
              code: 'DUPLICATE'
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.error('Insert error:', error);
        throw new Error(`Failed to create spotlight: ${error.message}`);
      }
      savedStory = data;
      console.log(`SUCCESS: Created new spotlight for ${resolvedArtistName}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: isUpdate ? 'updated' : 'created',
        spotlight: savedStory,
        stats: {
          word_count: finalWordCount,
          sections_generated: sections.length,
          continue_attempts: continueAttempts,
          complete: completionCheck.complete,
          images_found: spotlightImages.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-artist-spotlight:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
