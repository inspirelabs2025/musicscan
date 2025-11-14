import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName, initialText } = await req.json();
    
    if (!artistName) {
      throw new Error('Artist name is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const DISCOGS_TOKEN = Deno.env.get('DISCOGS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Generating spotlight for artist: ${artistName}`);

    // Early duplicate check to avoid heavy AI calls and return a friendly 409
    try {
      const { data: existingByName } = await supabase
        .from('artist_stories')
        .select('id')
        .eq('artist_name', artistName)
        .maybeSingle();

      if (existingByName) {
        console.warn(`Spotlight already exists for ${artistName}, aborting.`);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Er bestaat al een spotlight voor ${artistName}.`,
            code: 'DUPLICATE',
            existing_id: existingByName.id
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      // If the check fails for any reason, continue (insert will still be guarded below)
      console.warn('Duplicate pre-check failed, will rely on insert handling.');
    }

    // Generate spotlight content with AI
    const systemPrompt = `Je bent een gepassioneerde muziekjournalist die uitgebreide spotlight verhalen schrijft over artiesten. 
    
KRITIEKE INSTRUCTIE - LENGTE EN DIEPGANG:
- Schrijf een UITGEBREID artikel van 3000-4000 woorden
- Verdeel over minimaal 15-20 paragrafen
- Elke sectie moet rijk zijn aan details en verhaal
- Gebruik markdown voor structuur (## voor hoofdstukken, **bold** voor nadruk)

SCHRIJFSTIJL:
- Persoonlijke, verhaalvertellende toon
- Gebruik anekdotes en quotes waar mogelijk
- Focus op het verhaal achter de muziek
- Maak het toegankelijk en boeiend voor muziekliefhebbers

STRUCTUUR (gebruik deze secties als ## headers met uitgebreide inhoud):
## Beginjaren en Doorbraak
- Vroege jeugd en muzikale opvoeding
- Eerste stappen in de muziek
- Doorbraak moment en eerste releases
- Belangrijke samenwerkingen en invloeden

## Muzikale Evolutie
- Ontwikkeling door verschillende periodes
- Experimenteren met stijlen en genres
- Belangrijkste albums en hun context
- Productietechnieken en vernieuwingen

## Culturele Impact en Legacy
- Invloed op andere artiesten en genres
- Maatschappelijke betekenis en impact
- Awards en erkenning
- Doorwerking tot vandaag

## Persoonlijk Verhaal en Anekdotes
- Interessante verhalen achter de schermen
- Persoonlijke uitdagingen en triomfen
- Quotes van de artiest
- Bijzondere momenten in hun carrière

## Discografie Hoogtepunten
- Must-have albums met gedetailleerde beschrijvingen
- Hidden gems en ondergewaardeerde werken
- Collectible releases en zeldzame opnames
- Live albums en speciale uitgaves

Schrijf in het Nederlands. Gebruik een narratieve stijl met veel details, context en achtergrondverhalen. Maak elk hoofdstuk substantieel en informatief.`;

    const userPrompt = initialText 
      ? `Schrijf een UITGEBREID en GEDETAILLEERD spotlight verhaal van 3000-4000 woorden over ${artistName}. 

Gebruik deze initiële tekst als startpunt:
${initialText}

Bouw dit verder uit met diepgaande informatie over:
- Hun volledige carrière van begin tot heden
- Muzikale evolutie en verschillende periodes
- Culturele impact en invloed
- Persoonlijke verhalen en anekdotes
- Uitgebreide discografie analyse

Zorg ervoor dat elk hoofdstuk rijk is aan details en verhaal.`
      : `Schrijf een UITGEBREID en GEDETAILLEERD spotlight verhaal van 3000-4000 woorden over ${artistName}.

Focus op:
- Volledige carrièreoverzicht van begin tot heden
- Muzikale evolutie door verschillende periodes
- Belangrijkste albums met gedetailleerde context
- Culturele impact en legacy
- Persoonlijke verhalen en anekdotes
- Discografie hoogtepunten

Maak elk hoofdstuk rijk aan informatie en verhaal.`;

    // Use tool calling for structured output
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 16000,
        tools: [{
          type: 'function',
          function: {
            name: 'create_spotlight_story',
            description: 'Create a comprehensive structured spotlight story for an artist',
            parameters: {
              type: 'object',
              properties: {
                story_content: {
                  type: 'string',
                  description: 'Full markdown story content with detailed sections (3000-4000 words)'
                },
                spotlight_description: {
                  type: 'string',
                  description: 'Short 2-3 sentence teaser for the spotlight'
                },
                notable_albums: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of 5-8 notable album names'
                },
                music_style: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of music styles/genres (e.g., ["Jazz", "Bebop", "Cool Jazz"])'
                }
              },
              required: ['story_content', 'spotlight_description', 'notable_albums', 'music_style'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_spotlight_story' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call found. AI response:', JSON.stringify(aiData));
      throw new Error('AI did not return structured data. Please try again.');
    }

    const storyData = JSON.parse(toolCall.function.arguments);
    console.log('Generated story structure:', Object.keys(storyData));

    // Fetch multiple album artworks from Discogs and generate AI artist portrait
    let artworkUrl = null;
    const spotlightImages = [];
    
    // Generate slug early for filename
    const slug = artistName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // 1. Generate AI artist portrait and upload to storage
    console.log(`Generating AI portrait for: ${artistName}`);
    try {
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{
            role: 'user',
            content: `Professional high-quality portrait photo of ${artistName}, music photographer style, realistic, studio lighting, artist portrait, 512x512`
          }],
          modalities: ['image', 'text']
        })
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const artistImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (artistImageUrl && artistImageUrl.startsWith('data:image')) {
          // Upload base64 image to Supabase Storage
          console.log('Uploading AI portrait to storage...');
          const base64Data = artistImageUrl.replace(/^data:image\/\w+;base64,/, '');
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const fileName = `${slug}-portrait-${Date.now()}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('artist-spotlights')
            .upload(fileName, bytes, {
              contentType: 'image/jpeg',
              upsert: false
            });

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
          } else if (uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from('artist-spotlights')
              .getPublicUrl(fileName);
            
            spotlightImages.push({
              url: publicUrlData.publicUrl,
              type: 'artist',
              caption: artistName,
              alt_text: `${artistName} portrait`
            });
            console.log(`AI portrait uploaded to storage: ${fileName}`);
          }
        }
      }
    } catch (error) {
      console.error('Error generating/uploading AI portrait:', error);
    }

    // 2. Fetch album covers from Discogs (first 5 notable albums)
    if (DISCOGS_TOKEN && storyData.notable_albums?.length > 0) {
      const albumsToFetch = storyData.notable_albums.slice(0, 5);
      
      for (const album of albumsToFetch) {
        console.log(`Fetching album artwork for: ${album}`);
        
        try {
          const searchQuery = `${artistName} ${album}`;
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
              // Skip placeholder images
              if (coverUrl && !coverUrl.includes('spacer.gif')) {
                spotlightImages.push({
                  url: coverUrl,
                  type: 'album',
                  caption: album,
                  alt_text: `${artistName} - ${album} album cover`
                });
                console.log(`Found album artwork for: ${album}`);
                
                // Set first album cover as main artwork
                if (!artworkUrl) {
                  artworkUrl = coverUrl;
                }
              }
            }
          }
          
          // Respect Discogs rate limits
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error fetching album artwork for ${album}:`, error);
        }
      }
    }

    // Find matching products
    const { data: products } = await supabase
      .from('platform_products')
      .select('id')
      .ilike('artist', `%${artistName}%`)
      .eq('status', 'active')
      .not('published_at', 'is', null)
      .limit(6);

    const featuredProducts = products?.map(p => p.id) || [];

    // Slug already generated earlier for filename

    // Calculate reading time and word count
    const wordCount = storyData.story_content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Ensure music_style is an array
    const musicStyleArray = Array.isArray(storyData.music_style) 
      ? storyData.music_style 
      : [storyData.music_style];

    // Late duplicate guard (race condition safe)
    const { data: existingSpotlight } = await supabase
      .from('artist_stories')
      .select('id, artist_name')
      .eq('artist_name', artistName)
      .maybeSingle();

    if (existingSpotlight) {
      console.warn(`Duplicate detected post-generation for ${artistName}, aborting insert.`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Er bestaat al een spotlight voor ${artistName}.`,
          code: 'DUPLICATE',
          existing_id: existingSpotlight.id
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert into database
    const { data: insertedStory, error: insertError } = await supabase
      .from('artist_stories')
      .insert({
        artist_name: artistName,
        slug: slug,
        story_content: storyData.story_content,
        spotlight_description: storyData.spotlight_description,
        notable_albums: storyData.notable_albums,
        music_style: musicStyleArray,
        spotlight_images: spotlightImages,
        featured_products: featuredProducts,
        artwork_url: artworkUrl,
        is_spotlight: true,
        is_published: false,
        word_count: wordCount,
        reading_time: readingTime,
        meta_title: `${artistName} - In de Spotlight | MusicScan`,
        meta_description: storyData.spotlight_description.substring(0, 160)
      })
      .select()
      .single();

    if (insertError) {
      // Handle duplicate gracefully (unique constraint on artist_name)
      const code = (insertError as any)?.code;
      if (code === '23505') {
        console.warn(`Duplicate spotlight for ${artistName} prevented by unique constraint.`);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Er bestaat al een spotlight voor ${artistName}.`,
            code: 'DUPLICATE'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Spotlight created successfully:', insertedStory.id);

    return new Response(
      JSON.stringify({
        success: true,
        story: insertedStory
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-artist-spotlight:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
