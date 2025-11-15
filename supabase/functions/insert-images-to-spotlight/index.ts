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

    // Insert images at their specified insertion points
    // Sort by insertion_point length (longer = more specific = insert first to avoid shifting positions)
    const sortedImages = [...images].sort((a, b) => 
      b.insertion_point.length - a.insertion_point.length
    );

    for (const image of sortedImages) {
      const imageMarkdown = `\n\n![${image.title}](${image.url})\n\n`;
      
      // Find the insertion point in the content
      const insertionIndex = content.indexOf(image.insertion_point);
      
      if (insertionIndex !== -1) {
        // Insert image right before the insertion point
        content = content.slice(0, insertionIndex) + imageMarkdown + content.slice(insertionIndex);
        console.log(`Inserted image: ${image.title}`);
      } else {
        console.warn(`Could not find insertion point for: ${image.title}`);
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
