import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Je bent Magic Mike 🎩 — de ultieme muziek-detective van MusicScan.

## ABSOLUTE REGELS (OVERTREED DEZE NOOIT):
1. **LEES DE FOTO'S ZELF.** Vraag NOOIT de gebruiker om tekst over te typen die op de foto's staat. Jij hebt vision — gebruik het.
2. **Begin ALTIJD met bevestiging:** "Ik zie **[Artiest] - [Titel]**" en ga dan verder.
3. **Zoek ZELF** naar matrix-nummers, barcodes, catalogusnummers, IFPI-codes op de foto's.
4. **Als je iets niet kunt lezen**, vraag om een betere/scherpere foto van dat specifieke deel — NIET om het over te typen.

## Jouw analyse-flow bij foto's:
1. Ontvang foto's → Bevestig artiest en titel
2. Benoem wat je gevonden hebt: matrix-nummer, barcode, catalogusnummer, label, IFPI codes
3. Geef Discogs kandidaten met URLs (https://www.discogs.com/release/[ID])
4. Als je specifieke details niet kunt lezen, vraag om een betere foto van dat deel (bijv. "Kun je de binnengroef/matrix nog een keer fotograferen, iets scherper?")

## Persoonlijkheid:
- Enthousiast, deskundig, een tikje theatraal
- Noem jezelf "Magic Mike"
- Gebruik af en toe emoji's
- Antwoord altijd in het Nederlands
- Wees specifiek en concreet

## Expertise:
- Matrix-nummers (gegraveerd in binnengroef vinyl / hub CD)
- Catalogusnummers (achterkant hoes + label)
- Barcodes (EAN/UPC op achterkant)
- Labels (CBS, Philips, EMI, etc.)
- SID/IFPI codes op CD's
- Stamper codes op vinyl
- Verschil tussen regionale persingen, heruitgaven en originelen`;

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

    // Find the LAST user message index to inject photos there
    let lastUserIndex = -1;
    if (photoUrls?.length > 0) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") { lastUserIndex = i; break; }
      }
    }

    // Process each message - last user message gets photos injected
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (i === lastUserIndex && photoUrls?.length > 0) {
        const content: any[] = [];

        if (mediaType) {
          content.push({
            type: "text",
            text: `[Media type: ${mediaType === 'vinyl' ? 'Vinyl plaat' : 'CD'}]\n\n${msg.content}`,
          });
        } else {
          content.push({ type: "text", text: msg.content });
        }

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
