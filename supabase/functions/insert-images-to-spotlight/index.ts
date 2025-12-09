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
    const { spotlightId, images } = await req.json();

    if (!spotlightId || !images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Spotlight ID and images are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    let content = spotlights[0].story_content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Spotlight has no story content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Separate images into two groups
    const imagesWithPoints = images.filter(img => img.url && img.insertion_point);
    const imagesWithoutPoints = images.filter(img => img.url && !img.insertion_point);

    console.log(`Processing ${imagesWithPoints.length} images with insertion points`);
    console.log(`Processing ${imagesWithoutPoints.length} images without insertion points`);

    // Step 1: Insert images with specific insertion points
    // Sort by insertion_point length (longer = more specific = insert first to avoid shifting positions)
    const sortedImagesWithPoints = [...imagesWithPoints].sort((a, b) => 
      (b.insertion_point?.length || 0) - (a.insertion_point?.length || 0)
    );

    for (const image of sortedImagesWithPoints) {
      const imageMarkdown = `\n\n![${image.title || 'Image'}](${image.url})\n\n`;
      
      // Find the insertion point in the content
      const insertionIndex = content.indexOf(image.insertion_point);
      
      if (insertionIndex !== -1) {
        // Insert image right before the insertion point
        content = content.slice(0, insertionIndex) + imageMarkdown + content.slice(insertionIndex);
        console.log(`✓ Inserted image at insertion point: ${image.title}`);
      } else {
        console.warn(`Could not find insertion point for: ${image.title}`);
      }
    }

    // Step 2: Smart placement for images without insertion points
    if (imagesWithoutPoints.length > 0) {
      // Split content into paragraphs (separated by double newlines)
      const paragraphs = content.split(/\n\n+/);
      
      if (paragraphs.length > 1) {
        // Calculate interval for even distribution
        const interval = Math.floor(paragraphs.length / (imagesWithoutPoints.length + 1));
        
        console.log(`Distributing ${imagesWithoutPoints.length} images across ${paragraphs.length} paragraphs (interval: ${interval})`);
        
        // Insert images after specific paragraphs
        for (let i = 0; i < imagesWithoutPoints.length; i++) {
          const image = imagesWithoutPoints[i];
          const paragraphIndex = Math.min(
            (i + 1) * interval,
            paragraphs.length - 1
          );
          
          const imageMarkdown = `![${image.title || 'Album Cover'}](${image.url})`;
          paragraphs[paragraphIndex] += '\n\n' + imageMarkdown;
          
          console.log(`✓ Placed '${image.title}' after paragraph ${paragraphIndex + 1}`);
        }
        
        // Rejoin paragraphs
        content = paragraphs.join('\n\n');
      } else {
        // No paragraphs detected, add all images to the end
        console.log(`No paragraphs detected, adding ${imagesWithoutPoints.length} images to end`);
        for (const image of imagesWithoutPoints) {
          const imageMarkdown = `\n\n![${image.title || 'Album Cover'}](${image.url})`;
          content += imageMarkdown;
          console.log(`✓ Added '${image.title}' to end of content`);
        }
      }
    }

    // Update spotlight
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/artist_stories?id=eq.${spotlightId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        story_content: content,
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
        story_content: updatedSpotlight[0].story_content,
        images_added: images.length,
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
