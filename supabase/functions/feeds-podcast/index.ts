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
    <copyright>© ${new Date().getFullYear()} MusicScan</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>MusicScan Podcast Platform</generator>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    
    <itunes:author>${escapeXml(podcast.author || "MusicScan")}</itunes:author>
    <itunes:summary>${escapeXml(podcast.description || "")}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:owner>
      <itunes:name>${escapeXml(podcast.owner_name || "MusicScan")}</itunes:name>
      <itunes:email>${podcast.owner_email || "podcast@musicscan.app"}</itunes:email>
    </itunes:owner>
    <itunes:explicit>${podcast.explicit ? "yes" : "no"}</itunes:explicit>
    <itunes:category text="${escapeXml(podcast.category || "Music")}"/>
    ${podcast.artwork_url ? `<itunes:image href="${podcast.artwork_url}"/>` : ""}
    ${podcast.artwork_url ? `<image><url>${podcast.artwork_url}</url><title>${escapeXml(podcast.name)}</title><link>${siteUrl}/podcast/${podcastSlug}</link></image>` : ""}
    
    ${(episodes || []).map((episode: any) => `
    <item>
      <title>${escapeXml(episode.title)}</title>
      <description><![CDATA[${episode.description || ""}]]></description>
      <link>${siteUrl}/podcast/${podcastSlug}/${episode.slug || episode.id}</link>
      <guid isPermaLink="false">${episode.id}</guid>
      <pubDate>${new Date(episode.published_at || episode.created_at).toUTCString()}</pubDate>
      <enclosure url="${episode.audio_url}" length="${episode.audio_file_size || 0}" type="audio/mpeg"/>
      <itunes:title>${escapeXml(episode.title)}</itunes:title>
      <itunes:summary>${escapeXml(episode.description || "")}</itunes:summary>
      <itunes:duration>${formatDuration(episode.audio_duration_seconds)}</itunes:duration>
      <itunes:explicit>${podcast.explicit ? "yes" : "no"}</itunes:explicit>
      <itunes:episodeType>${episode.episode_type || "full"}</itunes:episodeType>
      ${episode.season_number ? `<itunes:season>${episode.season_number}</itunes:season>` : ""}
      ${episode.episode_number ? `<itunes:episode>${episode.episode_number}</itunes:episode>` : ""}
      ${episode.artwork_url ? `<itunes:image href="${episode.artwork_url}"/>` : podcast.artwork_url ? `<itunes:image href="${podcast.artwork_url}"/>` : ""}
    </item>`).join("\n")}
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
