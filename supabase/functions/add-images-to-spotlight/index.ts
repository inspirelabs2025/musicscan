import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Fetch existing spotlight
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

    // Check if content already has images
    const hasImages = existingContent.match(/!\[.*?\]\(.*?\)/g);
    if (hasImages && hasImages.length > 0) {
      console.log(`Content already has ${hasImages.length} images`);
    }

    // PHASE 1: Analyze content and identify image moments
    console.log("Phase 1: Analyzing content for image opportunities...");
    const phase1Prompt = `Analyze this artist spotlight text and identify 3-5 key moments that would benefit from contextual images.

Artist: ${artistName}

Content:
${existingContent}

Return ONLY valid JSON (no markdown) with this structure:
{
  "formatted_content": "The full text with {{IMAGE_1}}, {{IMAGE_2}}, etc. placeholders inserted at appropriate places",
  "image_suggestions": [
    {
      "index": 1,
      "title": "Short descriptive title",
      "prompt": "Detailed visual prompt for image generation (Dutch style, specific to this moment)",
      "context": "Brief context about why this image fits here"
    }
  ]
}

Guidelines:
- Insert placeholders like {{IMAGE_1}} at natural breaks in the narrative
- Choose 3-5 most impactful moments
- Prompts should be specific, visual, and culturally relevant
- Each prompt should capture the essence of that story moment`;

    const phase1Response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: phase1Prompt }],
        temperature: 0.7,
      }),
    });

    if (!phase1Response.ok) {
      const errorText = await phase1Response.text();
      console.error('Phase 1 AI error:', errorText);
      throw new Error(`AI formatting failed: ${phase1Response.status}`);
    }

    const phase1Data = await phase1Response.json();
    const aiResponse = phase1Data.choices[0].message.content;
    
    // Parse JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    
    const { formatted_content, image_suggestions } = JSON.parse(jsonMatch[0]);
    console.log(`Phase 1 complete: ${image_suggestions.length} image opportunities identified`);

    // PHASE 2: Generate and upload images
    console.log("Phase 2: Generating contextual images...");
    let finalContent = formatted_content;
    const uploadedImages = [];

    for (const suggestion of image_suggestions) {
      try {
        console.log(`Generating image ${suggestion.index}: ${suggestion.title}`);
        
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
          console.error(`Image generation failed for ${suggestion.index}`);
          continue;
        }

        const imageData = await imageResponse.json();
        const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!base64Image) {
          console.error(`No image data returned for ${suggestion.index}`);
          continue;
        }

        // Convert base64 to blob
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Generate filename
        const timestamp = Date.now();
        const sanitizedTitle = suggestion.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const filename = `${artistName.toLowerCase().replace(/\s+/g, '-')}-${sanitizedTitle}-${timestamp}.png`;
        
        // Upload to Supabase Storage
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

        if (!uploadResponse.ok) {
          console.error(`Upload failed for ${suggestion.index}`);
          continue;
        }

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/artist-images/${filename}`;
        
        // Replace placeholder with markdown image
        const imageMarkdown = `![${suggestion.title}](${publicUrl})`;
        finalContent = finalContent.replace(`{{IMAGE_${suggestion.index}}}`, imageMarkdown);
        
        uploadedImages.push({
          index: suggestion.index,
          title: suggestion.title,
          url: publicUrl,
        });
        
        console.log(`✓ Image ${suggestion.index} uploaded successfully`);
      } catch (error) {
        console.error(`Error processing image ${suggestion.index}:`, error);
        // Remove placeholder if image failed
        finalContent = finalContent.replace(`{{IMAGE_${suggestion.index}}}`, '');
      }
    }

    // Remove any remaining placeholders
    finalContent = finalContent.replace(/\{\{IMAGE_\d+\}\}/g, '');

    // Update spotlight in database
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/artist_stories?id=eq.${spotlightId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        story_content: finalContent,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update spotlight');
    }

    const updatedSpotlight = await updateResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        story: {
          id: spotlightId,
          story_content: finalContent,
          images_added: uploadedImages.length,
        },
        images: uploadedImages,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in add-images-to-spotlight:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
