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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = "https://www.musicscan.app";
    const currentDate = new Date().toISOString().split("T")[0];

    const entries: string[] = [];

    // 1. Own Podcasts overview pages
    const { data: ownPodcasts, error: ownPodcastError } = await supabase
      .from("own_podcasts")
      .select("slug, name, description, artwork_url, updated_at")
      .eq("is_published", true);

    if (!ownPodcastError && ownPodcasts) {
      for (const podcast of ownPodcasts) {
        entries.push(`
  <url>
    <loc>${baseUrl}/podcast/${podcast.slug}</loc>
    <lastmod>${podcast.updated_at?.split("T")[0] || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);
      }
    }

    // 2. Own Podcast Episodes
    const { data: ownEpisodes, error: ownEpisodeError } = await supabase
      .from("own_podcast_episodes")
      .select(`
        id, slug, title, description, artwork_url, updated_at,
        podcast_id,
        own_podcasts!inner(slug, name)
      `)
      .eq("is_published", true);

    if (!ownEpisodeError && ownEpisodes) {
      for (const episode of ownEpisodes) {
        const podcastSlug = (episode.own_podcasts as any)?.slug;
        const episodeSlug = episode.slug || episode.id;
        
        entries.push(`
  <url>
    <loc>${baseUrl}/podcast/${podcastSlug}/${episodeSlug}</loc>
    <lastmod>${episode.updated_at?.split("T")[0] || currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
      }
    }

    // 3. Curated Spotify Podcasts (shows)
    const { data: curatedPodcasts, error: curatedError } = await supabase
      .from("spotify_curated_podcasts")
      .select("spotify_show_id, name, updated_at")
      .eq("is_active", true);

    if (!curatedError && curatedPodcasts) {
      for (const podcast of curatedPodcasts) {
        // Create a slug from the name
        const slug = podcast.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        
        entries.push(`
  <url>
    <loc>${baseUrl}/podcasts/show/${slug}</loc>
    <lastmod>${podcast.updated_at?.split("T")[0] || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }

    // 4. Individual Spotify Episodes (featured)
    const { data: individualEpisodes, error: individualError } = await supabase
      .from("spotify_individual_episodes")
      .select("id, name, show_name, spotify_episode_id, updated_at")
      .eq("is_featured", true);

    if (!individualError && individualEpisodes) {
      for (const episode of individualEpisodes) {
        // Create a slug from show name and episode name
        const slug = `${episode.show_name}-${episode.name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .substring(0, 100);
        
        entries.push(`
  <url>
    <loc>${baseUrl}/podcasts/episode/${slug}</loc>
    <lastmod>${episode.updated_at?.split("T")[0] || currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }
    }

    // 5. Main podcast pages
    const staticPages = [
      { path: "/podcasts", priority: "0.9", changefreq: "daily" },
      { path: "/onze-podcasts", priority: "0.8", changefreq: "weekly" },
    ];

    for (const page of staticPages) {
      entries.push(`
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <!-- MusicScan Podcast Sitemap - Generated ${new Date().toISOString()} -->
  <!-- Includes: Own Podcasts, Episodes, Curated Spotify Shows, Featured Episodes -->${entries.join("")}
</urlset>`;

    console.log(`Generated podcast sitemap with ${entries.length} URLs`);

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Robots-Tag": "index, follow",
      },
    });
  } catch (error) {
    console.error("Error generating podcast sitemap:", error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
