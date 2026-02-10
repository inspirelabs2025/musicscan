import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Attempt to fetch a Discogs page via their API when scraping is blocked (403).
 * Falls back to a Google Cache or returns a helpful error.
 */
async function fetchDiscogsViaApi(url: string): Promise<string | null> {
  const discogsToken = Deno.env.get("DISCOGS_TOKEN");
  if (!discogsToken) return null;

  // Try to extract a label or artist search term from the URL
  // e.g. /label/pressing-plants → search for "pressing plants"
  const urlParts = url.replace(/\/$/, "").split("/");
  const slug = urlParts[urlParts.length - 1];
  const resourceType = urlParts[urlParts.length - 2]; // label, artist, etc.

  if (!slug) return null;

  const searchTerm = slug.replace(/-/g, " ");
  console.log(`[scrape] Discogs API fallback: type=${resourceType}, term=${searchTerm}`);

  const headers: Record<string, string> = {
    "Authorization": `Discogs token=${discogsToken}`,
    "User-Agent": "MusicScan/1.0 +https://musicscan.app",
    "Accept": "application/json",
  };

  // Search Discogs API
  const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(searchTerm)}&type=${encodeURIComponent(resourceType || "label")}&per_page=10`;
  const resp = await fetch(searchUrl, { headers });

  if (!resp.ok) {
    console.error(`[scrape] Discogs API search failed: ${resp.status}`);
    return null;
  }

  const data = await resp.json();
  if (!data.results || data.results.length === 0) return null;

  // Build a text summary from the search results
  const lines: string[] = [`Discogs ${resourceType || "search"} results for: ${searchTerm}\n`];

  for (const item of data.results) {
    lines.push(`- ${item.title || item.name || "Unknown"}`);
    if (item.country) lines.push(`  Land: ${item.country}`);
    if (item.year) lines.push(`  Jaar: ${item.year}`);
    if (item.catno) lines.push(`  Catalogus: ${item.catno}`);
    if (item.uri) lines.push(`  URL: https://www.discogs.com${item.uri}`);
    lines.push("");
  }

  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[scrape-knowledge-url] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
        "Cache-Control": "no-cache",
      },
    });

    let text: string;

    if (!response.ok) {
      console.warn(`[scrape] HTTP ${response.status} for ${url}`);

      // If it's a Discogs URL, try the API fallback
      if (url.includes("discogs.com")) {
        const apiContent = await fetchDiscogsViaApi(url);
        if (apiContent) {
          console.log(`[scrape] Discogs API fallback succeeded: ${apiContent.length} chars`);
          return new Response(JSON.stringify({ content: apiContent, length: apiContent.length }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Strip HTML tags, scripts, styles to extract text content
    text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Limit to ~50k chars
    if (text.length > 50000) {
      text = text.substring(0, 50000) + "\n\n[Content afgekapt na 50.000 karakters]";
    }

    console.log(`[scrape-knowledge-url] Extracted ${text.length} chars from ${url}`);

    return new Response(JSON.stringify({ content: text, length: text.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[scrape-knowledge-url] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Scraping mislukt" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
