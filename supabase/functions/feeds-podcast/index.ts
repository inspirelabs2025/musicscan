import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This edge function serves as a proxy for podcast RSS feeds
// It allows us to use clean URLs like /feeds/podcast/slug.xml
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Extract slug from path or query param
    // Supports: ?slug=podcast-name or path like /podcast-name.xml
    let podcastSlug = url.searchParams.get("slug");
    
    if (!podcastSlug) {
      // Try to extract from path
      const pathParts = url.pathname.split("/");
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.endsWith(".xml")) {
        podcastSlug = lastPart.replace(".xml", "");
      }
    }

    if (!podcastSlug) {
      return new Response("Missing podcast slug", { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch podcast
    const { data: podcast, error: podcastError } = await supabase
      .from("own_podcasts")
      .select("*")
      .eq("slug", podcastSlug)
      .eq("is_published", true)
      .single();

    if (podcastError || !podcast) {
      console.error("Podcast not found:", podcastSlug, podcastError);
      return new Response("Podcast not found", { 
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }

    const { data: priv } = await supabase
      .from("own_podcasts_private")
      .select("owner_email")
      .eq("podcast_id", podcast.id)
      .maybeSingle();
    (podcast as any).owner_email = priv?.owner_email || "rogiervisser76@gmail.com";

    // Fetch episodes
    const { data: episodes, error: episodesError } = await supabase
      .from("own_podcast_episodes")
      .select("*")
      .eq("podcast_id", podcast.id)
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (episodesError) {
      throw episodesError;
    }

    // Generate RSS XML with MusicScan branding
    const siteUrl = "https://www.musicscan.app";
    const feedUrl = `${siteUrl}/feeds/podcast/${podcastSlug}.xml`;

    // Ensure artwork URL uses JPG/PNG format (convert .webp references)
    const channelArtwork = ensureCompatibleArtwork(podcast.artwork_url);

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${escapeXml(podcast.name)}</title>
    <link>${siteUrl}/podcast/${podcastSlug}</link>
    <description>${escapeXml(podcast.description || "")}</description>
    <language>${podcast.language || "nl"}</language>
    <copyright>&#xA9; ${new Date().getFullYear()} MusicScan</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>MusicScan Podcast Platform</generator>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <itunes:new-feed-url>${feedUrl}</itunes:new-feed-url>
    
    <itunes:author>${escapeXml(podcast.author || "MusicScan")}</itunes:author>
    <itunes:summary>${escapeXml(podcast.description || "")}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:owner>
      <itunes:name>${escapeXml(podcast.owner_name || "MusicScan")}</itunes:name>
      <itunes:email>${podcast.owner_email || "rogiervisser76@gmail.com"}</itunes:email>
    </itunes:owner>
    <itunes:explicit>${podcast.explicit ? "yes" : "no"}</itunes:explicit>
    <itunes:category text="${escapeXml(podcast.category || "Music")}"/>
    ${channelArtwork ? `<itunes:image href="${escapeXml(channelArtwork)}"/>` : `<itunes:image href="${siteUrl}/podcast-cover-default.jpg"/>`}
    ${channelArtwork ? `<image><url>${escapeXml(channelArtwork)}</url><title>${escapeXml(podcast.name)}</title><link>${siteUrl}/podcast/${podcastSlug}</link></image>` : ""}
    
    ${(episodes || []).map((episode: any) => {
      const episodeArtwork = ensureCompatibleArtwork(episode.artwork_url) || channelArtwork;
      return `
    <item>
      <title>${escapeXml(episode.title)}</title>
      <description><![CDATA[${episode.description || ""}]]></description>
      <link>${siteUrl}/podcast/${podcastSlug}/${episode.slug || episode.id}</link>
      <guid isPermaLink="false">${episode.id}</guid>
      <pubDate>${new Date(episode.published_at || episode.created_at).toUTCString()}</pubDate>
      <enclosure url="${escapeXml(episode.audio_url)}" length="${episode.audio_file_size || 0}" type="audio/mpeg"/>
      <itunes:title>${escapeXml(episode.title)}</itunes:title>
      <itunes:summary>${escapeXml(episode.description || "")}</itunes:summary>
      <itunes:duration>${formatDuration(episode.audio_duration_seconds)}</itunes:duration>
      <itunes:explicit>${episode.explicit !== undefined ? (episode.explicit ? "yes" : "no") : (podcast.explicit ? "yes" : "no")}</itunes:explicit>
      <itunes:episodeType>${episode.episode_type || "full"}</itunes:episodeType>
      ${episode.season_number ? `<itunes:season>${episode.season_number}</itunes:season>` : ""}
      ${episode.episode_number ? `<itunes:episode>${episode.episode_number}</itunes:episode>` : ""}
      ${episodeArtwork ? `<itunes:image href="${escapeXml(episodeArtwork)}"/>` : ""}
    </item>`;
    }).join("\n")}
  </channel>
</rss>`;

    return new Response(rssXml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Robots-Tag": "index, follow",
      },
    });
  } catch (error) {
    console.error("Error generating RSS:", error);
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: corsHeaders,
    });
  }
});

function escapeXml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Ensures artwork URLs use Spotify/Apple-compatible formats (JPG/PNG).
 * Converts .webp URLs to JPEG by using Supabase image transformation.
 * Supabase render/image endpoint auto-converts WebP to JPEG.
 */
function ensureCompatibleArtwork(url: string | null): string | null {
  if (!url) return null;
  
  // If already JPG/PNG, return as-is
  if (url.match(/\.(jpg|jpeg|png)(\?.*)?$/i)) {
    return url;
  }
  
  // For Supabase storage WebP images, use the render/image transformer.
  // Replace /object/public/ with /render/image/public/ — Supabase
  // automatically serves WebP as JPEG through this endpoint.
  if (url.includes("supabase.co/storage/v1/object/public/") && url.match(/\.webp(\?.*)?$/i)) {
    const baseUrl = url.split("?")[0];
    return baseUrl.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    ) + "?width=3000&height=3000";
  }
  
  // For other WebP URLs, return as-is (may need manual conversion)
  return url;
}
