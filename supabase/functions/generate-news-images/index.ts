import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateNewsImage(
  title: string, 
  content: string,
  lovableApiKey: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<string | null> {
  try {
    // 1. Generate image prompt
    const promptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Genereer een korte image prompt (max 100 woorden) voor een nieuwsartikel:
        
Titel: ${title}
Inhoud: ${content.slice(0, 500)}

De prompt moet resulteren in een professionele, journalistieke foto die past bij dit muzieknieuws.
Denk aan: concertfoto, artiest portret, muziekinstrumenten, platenzaak, studio setting, etc.
Vermijd: tekst, logo's, specifieke gezichten van echte mensen.

Return ALLEEN de image prompt, geen uitleg.`
        }],
      }),
    });

    if (!promptResponse.ok) {
      console.error('Failed to generate image prompt:', promptResponse.status);
      return null;
    }

    const promptData = await promptResponse.json();
    const imagePrompt = promptData.choices[0].message.content;

    // 2. Generate the image
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ 
          role: 'user', 
          content: `${imagePrompt}

Style: Professional journalism photography, high quality, 16:9 aspect ratio, editorial style for music news website.`
        }],
        modalities: ['image', 'text'],
      }),
    });

    if (!imageResponse.ok) {
      console.error('Failed to generate image:', imageResponse.status);
      return null;
    }

    const imageData = await imageResponse.json();
    const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Image) return null;

    // 3. Upload to Supabase storage
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const filename = `news/${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.png`;
    
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/news-images/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'image/png',
        },
        body: binaryData,
      }
    );

    if (!uploadResponse.ok) {
      console.error('Failed to upload image:', uploadResponse.status);
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/news-images/${filename}`;
  } catch (error) {
    console.error('Error generating news image:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting news image generation for existing articles...');

    // Get all news articles without images
    const { data: articles, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, slug, markdown_content, yaml_frontmatter, album_cover_url')
      .eq('album_type', 'news')
      .is('album_cover_url', null)
      .limit(50);

    if (fetchError) throw fetchError;

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'Geen artikelen zonder afbeeldingen gevonden',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${articles.length} articles without images`);

    let successCount = 0;
    let failCount = 0;

    for (const article of articles) {
      try {
        const title = article.yaml_frontmatter?.title || '';
        const content = article.markdown_content || '';

        console.log(`Generating image for: ${title}`);

        const imageUrl = await generateNewsImage(
          title,
          content,
          lovableApiKey,
          supabaseUrl,
          supabaseKey
        );

        if (imageUrl) {
          // Update article with image
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({ album_cover_url: imageUrl })
            .eq('id', article.id);

          if (updateError) {
            console.error(`Failed to update article ${article.id}:`, updateError);
            failCount++;
          } else {
            console.log(`✅ Updated article: ${title}`);
            successCount++;
          }
        } else {
          console.log(`❌ Failed to generate image for: ${title}`);
          failCount++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error);
        failCount++;
      }
    }

    console.log(`Image generation completed: ${successCount} success, ${failCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `${successCount} afbeeldingen gegenereerd`,
      processed: articles.length,
      successCount,
      failCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-news-images:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
