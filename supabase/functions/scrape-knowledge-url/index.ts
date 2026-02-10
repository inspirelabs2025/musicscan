import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
        "User-Agent": "MusicScan-Bot/1.0 (Knowledge Indexer)",
        "Accept": "text/html, text/plain, application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Strip HTML tags, scripts, styles to extract text content
    let text = html
      // Remove script and style blocks
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      // Remove HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode common HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      // Clean whitespace
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
