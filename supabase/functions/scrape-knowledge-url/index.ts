import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Fallback: use Discogs API when scraping discogs.com fails */
async function fetchDiscogsViaApi(url: string): Promise<string | null> {
  const discogsToken = Deno.env.get("DISCOGS_TOKEN");
  if (!discogsToken) return null;

  const urlParts = url.replace(/\/$/, "").split("/");
  const slug = urlParts[urlParts.length - 1];
  const resourceType = urlParts[urlParts.length - 2];
  if (!slug) return null;

  const searchTerm = slug.replace(/-/g, " ");
  console.log(`[scrape] Discogs API fallback: type=${resourceType}, term=${searchTerm}`);

  const headers: Record<string, string> = {
    "Authorization": `Discogs token=${discogsToken}`,
    "User-Agent": "MusicScan/1.0 +https://musicscan.app",
    "Accept": "application/json",
  };

  const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(searchTerm)}&type=${encodeURIComponent(resourceType || "label")}&per_page=10`;
  const resp = await fetch(searchUrl, { headers });
  if (!resp.ok) return null;

  const data = await resp.json();
  if (!data.results || data.results.length === 0) return null;

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

/** Fallback: use Firecrawl for JS-rendered sites */
async function scrapeWithFirecrawl(url: string): Promise<string | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.log("[scrape] No FIRECRAWL_API_KEY, skipping Firecrawl fallback");
    return null;
  }

  console.log(`[scrape] Firecrawl fallback for: ${url}`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s max

    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[scrape] Firecrawl error: ${resp.status} - ${errText}`);
      return null;
    }

    const data = await resp.json();
    const markdown = data?.data?.markdown || data?.markdown;
    if (markdown && markdown.trim().length > 50) {
      console.log(`[scrape] Firecrawl success: ${markdown.length} chars`);
      return markdown;
    }
    console.log(`[scrape] Firecrawl returned empty/thin content`);
    return null;
  } catch (e) {
    console.error("[scrape] Firecrawl exception:", e);
    return null;
  }
}

/** Strip HTML to plain text */
function htmlToText(html: string): string {
  return html
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

    console.log(`[scrape] Fetching: ${url}`);

    // Step 1: Try direct fetch
    let text: string | null = null;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
        },
      });

      if (response.ok) {
        const html = await response.text();
        const extracted = htmlToText(html);
        // Only accept if we got meaningful content (not just a JS shell)
        if (extracted.length > 200) {
          text = extracted;
          console.log(`[scrape] Direct fetch OK: ${text.length} chars`);
        } else {
          console.log(`[scrape] Direct fetch returned thin content (${extracted.length} chars), trying fallbacks`);
        }
      } else {
        console.warn(`[scrape] Direct fetch failed: HTTP ${response.status}`);
      }
    } catch (fetchErr) {
      console.warn(`[scrape] Direct fetch error:`, fetchErr);
    }

    // Step 2: Discogs API fallback
    if (!text && url.includes("discogs.com")) {
      text = await fetchDiscogsViaApi(url);
      if (text) console.log(`[scrape] Discogs API fallback: ${text.length} chars`);
    }

    // Step 3: Firecrawl fallback (JS-rendered sites)
    if (!text) {
      text = await scrapeWithFirecrawl(url);
    }

    if (!text || text.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Kon geen bruikbare content ophalen van deze URL. Voer handmatig content in." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit to ~50k chars
    if (text.length > 50000) {
      text = text.substring(0, 50000) + "\n\n[Content afgekapt na 50.000 karakters]";
    }

    console.log(`[scrape] Final result: ${text.length} chars`);
    return new Response(JSON.stringify({ content: text, length: text.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[scrape] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Scraping mislukt" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
