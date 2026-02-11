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
    const { audio } = await req.json();

    if (!audio) {
      return new Response(
        JSON.stringify({ error: "Geen audio ontvangen" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const AUDD_API_TOKEN = Deno.env.get("AUDD_API_TOKEN");
    if (!AUDD_API_TOKEN) {
      console.error("[recognize-music] AUDD_API_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Muziekherkenning is niet geconfigureerd" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[recognize-music] Sending audio (${audio.length} chars base64) to AudD`);

    // Send to AudD API
    const formData = new FormData();
    formData.append("api_token", AUDD_API_TOKEN);
    formData.append("audio", audio);
    formData.append("return", "spotify");

    const response = await fetch("https://api.audd.io/", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[recognize-music] AudD API error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Muziekherkenning service fout" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("[recognize-music] AudD response status:", data.status);

    if (data.status === "error") {
      console.error("[recognize-music] AudD error:", data.error);
      return new Response(
        JSON.stringify({ error: data.error?.error_message || "Herkenning mislukt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No match
    if (!data.result) {
      return new Response(
        JSON.stringify({ recognized: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = data.result;
    const spotify = result.spotify || null;

    return new Response(
      JSON.stringify({
        recognized: true,
        artist: result.artist || null,
        title: result.title || null,
        album: result.album || null,
        release_date: result.release_date || null,
        spotify_url: spotify?.external_urls?.spotify || null,
        album_art: spotify?.album?.images?.[0]?.url || null,
        preview_url: spotify?.preview_url || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[recognize-music] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Onbekende fout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
