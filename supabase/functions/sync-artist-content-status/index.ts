import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Starting content status sync for curated_artists...");

    // Get all curated artists
    const { data: artists, error: artistsError } = await supabase
      .from("curated_artists")
      .select("id, artist_name")
      .eq("is_active", true);

    if (artistsError) throw artistsError;

    console.log(`📋 Found ${artists?.length || 0} active artists to sync`);

    let updated = 0;
    let errors = 0;

    for (const artist of artists || []) {
      try {
        const artistNameLower = artist.artist_name.toLowerCase();

        // Check for artist story
        const { data: artistStory } = await supabase
          .from("artist_stories")
          .select("id")
          .ilike("artist_name", artistNameLower)
          .eq("is_published", true)
          .maybeSingle();

        // Count album stories (blog_posts)
        const { count: albumsCount } = await supabase
          .from("blog_posts")
          .select("id", { count: "exact", head: true })
          .ilike("yaml_frontmatter->artist", `%${artist.artist_name}%`)
          .eq("is_published", true);

        // Count singles (music_stories with single_name)
        const { count: singlesCount } = await supabase
          .from("music_stories")
          .select("id", { count: "exact", head: true })
          .ilike("artist_name", artistNameLower)
          .not("single_name", "is", null)
          .eq("is_published", true);

        // Count products
        const { count: productsCount } = await supabase
          .from("platform_products")
          .select("id", { count: "exact", head: true })
          .ilike("artist_name", artistNameLower)
          .eq("status", "active");

        // Update the curated_artists record
        const { error: updateError } = await supabase
          .from("curated_artists")
          .update({
            has_artist_story: !!artistStory,
            artist_story_id: artistStory?.id || null,
            albums_processed: albumsCount || 0,
            singles_processed: singlesCount || 0,
            products_created: productsCount || 0,
            last_content_sync: new Date().toISOString(),
          })
          .eq("id", artist.id);

        if (updateError) {
          console.error(`❌ Error updating ${artist.artist_name}:`, updateError);
          errors++;
        } else {
          updated++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${artist.artist_name}:`, err);
        errors++;
      }
    }

    console.log(`✅ Sync complete: ${updated} updated, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        errors,
        total: artists?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Sync failed:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
