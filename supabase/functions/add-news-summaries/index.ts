import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateSummary(content: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY niet geconfigureerd");
  }

  const prompt = `Schrijf een korte, pakkende samenvatting van 2-3 zinnen voor dit artikel:

${content.substring(0, 500)}

Schrijf alleen de samenvatting, niets anders.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all news articles without a description
    const { data: articles, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, slug, yaml_frontmatter, markdown_content')
      .eq('album_type', 'news')
      .is('yaml_frontmatter->description', null)
      .limit(20);

    if (fetchError) throw fetchError;

    console.log(`Found ${articles?.length || 0} articles without summaries`);

    let updated = 0;
    const results = [];

    for (const article of articles || []) {
      try {
        const summary = await generateSummary(article.markdown_content);
        
        const updatedFrontmatter = {
          ...article.yaml_frontmatter,
          description: summary
        };

        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ yaml_frontmatter: updatedFrontmatter })
          .eq('id', article.id);

        if (updateError) {
          console.error(`Error updating ${article.slug}:`, updateError);
          continue;
        }

        updated++;
        results.push({
          slug: article.slug,
          title: article.yaml_frontmatter?.title,
          summary: summary
        });

        console.log(`✓ Updated: ${article.yaml_frontmatter?.title}`);
      } catch (error) {
        console.error(`Error processing ${article.slug}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updated} articles with summaries`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
