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

    // Generate spotlight content with AI
    const systemPrompt = `Je bent een gepassioneerde muziekjournalist die uitgebreide spotlight verhalen schrijft over artiesten. 
    
KRITIEKE INSTRUCTIE - TOON:
- Schrijf in een persoonlijke, verhaalvertellende stijl
- Gebruik anekdotes en quotes waar mogelijk
- Focus op het verhaal achter de muziek
- Maak het toegankelijk en boeiend voor muziekliefhebbers
- Gebruik markdown voor structuur (## voor hoofdstukken, **bold** voor nadruk)
- Minimum 2000 woorden, verdeeld over meerdere secties

STRUCTUUR (gebruik deze secties als ## headers):
## Beginjaren en Doorbraak
- Hoe begon de artiest
- Eerste releases en erkenning
- Belangrijke momenten

## Muzikale Evolutie
- Ontwikkeling door de jaren
- Experimenteren met stijlen
- Belangrijkste albums en hun impact

## Culturele Impact
- Invloed op andere artiesten
- Maatschappelijke betekenis
- Legacy en doorwerking

## Persoonlijk Verhaal
- Anekdotes en verhalen
- Interessante feiten
- Quotes (als beschikbaar)

## Discografie Hoogtepunten
- Must-have albums
- Hidden gems
- Collectible releases

Schrijf in het Nederlands en maak het rijk aan details en verhaal.`;

    const userPrompt = initialText 
      ? `Schrijf een uitgebreid spotlight verhaal over ${artistName}. Gebruik deze initiële tekst als startpunt:\n\n${initialText}\n\nBouw dit verder uit met diepgaande informatie over hun carrière, muzikale evolutie en impact.`
      : `Schrijf een uitgebreid spotlight verhaal over ${artistName}. Focus op hun volledige carrière, muzikale evolutie, culturele impact en belangrijkste albums.`;

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
        tools: [{
          type: 'function',
          function: {
            name: 'create_spotlight_story',
            description: 'Create a structured spotlight story for an artist',
            parameters: {
              type: 'object',
              properties: {
                story_content: {
                  type: 'string',
                  description: 'Full markdown story content with sections'
                },
                spotlight_description: {
                  type: 'string',
                  description: 'Short 2-3 sentence teaser for the spotlight'
                },
                notable_albums: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of notable album names'
                },
                music_style: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of music genres/styles'
                }
              },
              required: ['story_content', 'spotlight_description', 'notable_albums', 'music_style']
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
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const storyData = JSON.parse(toolCall.function.arguments);
    console.log('Generated story structure:', Object.keys(storyData));

    // Fetch multiple album artworks from Discogs and generate AI artist portrait
    let artworkUrl = null;
    const spotlightImages = [];
    
    // 1. Generate AI artist portrait
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
            content: `Professional high-quality portrait photo of ${artistName}, music photographer style, realistic, studio lighting, artist portrait`
          }],
          modalities: ['image', 'text']
        })
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const artistImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (artistImageUrl) {
          spotlightImages.push({
            url: artistImageUrl,
            type: 'artist',
            caption: artistName,
            alt_text: `${artistName} portrait`
          });
          console.log(`Generated AI artist portrait`);
        }
      }
    } catch (error) {
      console.error('Error generating AI portrait:', error);
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

    // Generate slug
    const slug = artistName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Calculate reading time and word count
    const wordCount = storyData.story_content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Insert into database
    const { data: insertedStory, error: insertError } = await supabase
      .from('artist_stories')
      .insert({
        artist_name: artistName,
        slug: slug,
        story_content: storyData.story_content,
        spotlight_description: storyData.spotlight_description,
        notable_albums: storyData.notable_albums,
        music_style: storyData.music_style,
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
