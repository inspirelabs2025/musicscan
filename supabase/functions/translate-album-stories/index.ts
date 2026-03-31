import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get existing EN slugs to exclude
    const { data: existingEn } = await supabase
      .from("music_stories")
      .select("slug")
      .eq("content_language", "en");

    const enSlugs = new Set((existingEn || []).map(s => s.slug));

    // Fetch NL album/music stories
    const { data: nlStories, error: fetchError } = await supabase
      .from("music_stories")
      .select("*")
      .eq("is_published", true)
      .eq("content_language", "nl")
      .not("story_content", "is", null)
      .limit(30);

    if (fetchError) throw fetchError;
    if (!nlStories || nlStories.length === 0) {
      return new Response(JSON.stringify({ error: "No NL stories found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out already translated, shuffle and pick 10
    const untranslated = nlStories.filter(s => {
      const enSlug = s.slug.endsWith("-en") ? s.slug : `${s.slug}-en`;
      return !enSlugs.has(enSlug);
    });

    if (untranslated.length === 0) {
      return new Response(JSON.stringify({ error: "All fetched stories already have EN versions" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shuffled = untranslated.sort(() => Math.random() - 0.5).slice(0, 10);
    const results: any[] = [];

    for (const story of shuffled) {
      try {
        const enSlug = story.slug.endsWith("-en") ? story.slug : `${story.slug}-en`;

        const prompt = `Translate the following Dutch music story to English. Keep the same tone, style and markdown formatting. Do NOT add any commentary, just provide the translation.

Title: ${story.title}
Story content:
${story.story_content?.substring(0, 6000)}`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are a professional music journalist translator. Translate Dutch music stories to English while preserving markdown formatting, musical terminology, and artist/album names. Return ONLY the translated content in this exact JSON format: {\"title\": \"...\", \"story_content\": \"...\", \"meta_title\": \"...\", \"meta_description\": \"...\", \"social_post\": \"...\"}",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          results.push({ slug: story.slug, status: "error", reason: `AI error: ${errText.substring(0, 200)}` });
          continue;
        }

        const aiData = await aiResponse.json();
        let translatedText = aiData.choices?.[0]?.message?.content || "";

        const jsonMatch = translatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          results.push({ slug: story.slug, status: "error", reason: "Could not parse AI response" });
          continue;
        }

        const translated = JSON.parse(jsonMatch[0]);

        const { error: insertError } = await supabase.rpc('admin_insert_translated_story' as any, {
          p_query: story.query,
          p_title: translated.title || story.title,
          p_story_content: translated.story_content || story.story_content,
          p_slug: enSlug,
          p_content_language: 'en',
          p_artist: story.artist,
          p_single_name: story.single_name,
          p_year: story.year,
          p_label: story.label,
          p_catalog: story.catalog,
          p_album: story.album,
          p_genre: story.genre,
          p_artwork_url: story.artwork_url,
          p_meta_title: translated.meta_title || translated.title || story.meta_title,
          p_meta_description: translated.meta_description || story.meta_description,
          p_user_id: story.user_id,
        });

        if (insertError) {
          results.push({ slug: story.slug, status: "error", reason: insertError.message });
        } else {
          results.push({ slug: story.slug, enSlug, status: "translated" });
        }
      } catch (storyError: any) {
        results.push({ slug: story.slug, status: "error", reason: storyError.message });
      }
    }

    return new Response(JSON.stringify({ results, translated: results.filter(r => r.status === "translated").length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
