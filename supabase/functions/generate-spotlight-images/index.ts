import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 2;
const RETRY_DELAY = 2000;
const REQUEST_DELAY = 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spotlightId } = await req.json();

    if (!spotlightId) {
      return new Response(
        JSON.stringify({ error: 'Spotlight ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    // Fetch spotlight
    const spotlightResponse = await fetch(`${supabaseUrl}/rest/v1/artist_stories?id=eq.${spotlightId}&select=*`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!spotlightResponse.ok) {
      throw new Error('Failed to fetch spotlight');
    }

    const spotlights = await spotlightResponse.json();
    if (!spotlights || spotlights.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Spotlight not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const spotlight = spotlights[0];
    const artistName = spotlight.artist_name;
    const existingContent = spotlight.story_content;

    // Analyze content for image opportunities
    console.log("Analyzing content for image opportunities...");
    const analysisPrompt = `Analyze this artist spotlight and identify 3-5 key moments for contextual images.

Artist: ${artistName}

Content:
${existingContent}

Return ONLY valid JSON with this structure:
{
  "image_suggestions": [
    {
      "index": 1,
      "title": "Short descriptive title",
      "prompt": "Detailed visual prompt for image generation",
      "context": "Brief context about why this image fits here",
      "insertion_point": "First few words where this image should be inserted..."
    }
  ]
}

Guidelines:
- Choose 3-5 most impactful visual moments
- Prompts should be specific, artistic, and culturally relevant
- insertion_point should be the first 5-10 words of the paragraph where the image should appear`;

    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: analysisPrompt }],
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error('Analysis failed');
    }

    const analysisData = await analysisResponse.json();
    const aiResponse = analysisData.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const { image_suggestions } = JSON.parse(jsonMatch[0]);

    // Generate images
    console.log(`Generating ${image_suggestions.length} images...`);
    const generatedImages = [];

    for (let idx = 0; idx < image_suggestions.length; idx++) {
      const suggestion = image_suggestions[idx];
      
      if (idx > 0) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
      }

      let retryCount = 0;
      let base64Image = null;

      while (retryCount <= MAX_RETRIES && !base64Image) {
        try {
          if (retryCount > 0) {
            console.log(`Retry ${retryCount}/${MAX_RETRIES} for image ${suggestion.index}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          } else {
            console.log(`Generating image ${suggestion.index}: ${suggestion.title}`);
          }
          
          const imagePrompt = `${suggestion.prompt}

Style: Artistic, evocative, high quality photograph or illustration that captures the essence of this music story moment.`;

          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [{ role: 'user', content: imagePrompt }],
              modalities: ['image', 'text'],
            }),
          });

          if (!imageResponse.ok) {
            if (imageResponse.status === 429) {
              console.log('Rate limit detected, waiting 5 seconds...');
              await new Promise(resolve => setTimeout(resolve, 5000));
              retryCount++;
              continue;
            }
            retryCount++;
            continue;
          }

          const imageData = await imageResponse.json();
          base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!base64Image) {
            retryCount++;
          }
        } catch (error) {
          console.error(`Error generating image ${suggestion.index}:`, error);
          retryCount++;
        }
      }

      if (base64Image) {
        // Upload to storage
        try {
          const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          const timestamp = Date.now();
          const sanitizedTitle = suggestion.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const filename = `${artistName.toLowerCase().replace(/\s+/g, '-')}-${sanitizedTitle}-${timestamp}.png`;
          
          const uploadResponse = await fetch(
            `${supabaseUrl}/storage/v1/object/artist-images/${filename}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'image/png',
              },
              body: binaryData,
            }
          );

          if (uploadResponse.ok) {
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/artist-images/${filename}`;
            
            generatedImages.push({
              index: suggestion.index,
              title: suggestion.title,
              url: publicUrl,
              context: suggestion.context,
              insertion_point: suggestion.insertion_point,
            });
            
            console.log(`✓ Image ${suggestion.index} uploaded`);
          }
        } catch (error) {
          console.error(`Upload failed for image ${suggestion.index}:`, error);
        }
      }
    }

    if (generatedImages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate any images' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully generated ${generatedImages.length}/${image_suggestions.length} images`);

    return new Response(
      JSON.stringify({ 
        success: true,
        images: generatedImages,
        total_suggested: image_suggestions.length,
        total_generated: generatedImages.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
