import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Je bent een expert muziek-release identificatie assistent voor MusicScan. Je helpt gebruikers hun vinyl platen en CD's te identificeren aan de hand van foto's.

## Wat je doet:
- Je analyseert foto's van vinyl platen en CD's (hoezen, labels, matrix-nummers, barcodes)
- Je doet OCR op de foto's om tekst te herkennen: matrix-nummers, catalogusnummers, barcodes, label-tekst
- Je helpt de exacte Discogs release te vinden
- Je kent het verschil tussen regionale persingen, heruitgaven en originele releases

## Hoe je werkt:
1. Bekijk alle foto's zorgvuldig
2. Beschrijf wat je ziet: artiest, titel, label, catalogusnummer, matrix-nummer, barcode
3. Doe suggesties voor de exacte release op basis van wat je herkent
4. Stel gerichte vervolgvragen als je meer info nodig hebt

## Belangrijke identificatie-kenmerken:
- **Matrix-nummer**: Gegraveerd in de binnengroef (vinyl) of op de hub (CD). Uniek per persing.
- **Catalogusnummer**: Op de achterkant van de hoes en op het label. Identificeert de release.
- **Barcode (EAN/UPC)**: Op de achterkant. Helpt bij het vinden van de exacte versie.
- **Label**: Het platenlabel (bijv. CBS, Philips, EMI)
- **SID codes**: IFPI codes op CD's die de pressing plant identificeren
- **Stamper codes**: Extra codes op vinyl die de persing identificeren

## Antwoordstijl:
- Antwoord altijd in het Nederlands
- Wees specifiek en concreet
- Geef Discogs URLs als je een match vindt (https://www.discogs.com/release/[ID])
- Als je niet zeker bent, geef meerdere kandidaten met uitleg waarom`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, photoUrls, mediaType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build messages array for the AI
    const aiMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Process each message - first message gets photos injected
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (msg.role === "user" && i === 0 && photoUrls?.length > 0) {
        // First user message: inject photos as image_url content parts
        const content: any[] = [];

        // Add media type context
        if (mediaType) {
          content.push({
            type: "text",
            text: `[Media type: ${mediaType === 'vinyl' ? 'Vinyl plaat' : 'CD'}]\n\n${msg.content}`,
          });
        } else {
          content.push({ type: "text", text: msg.content });
        }

        // Add each photo as image URL
        for (const url of photoUrls) {
          content.push({
            type: "image_url",
            image_url: { url },
          });
        }

        aiMessages.push({ role: "user", content });
      } else {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    console.log(`[scan-chat] Sending ${aiMessages.length} messages, ${photoUrls?.length || 0} photos`);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit bereikt, probeer het later opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Tegoed op, voeg credits toe aan je workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("[scan-chat] AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[scan-chat] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
