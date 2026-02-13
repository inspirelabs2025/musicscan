import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback system prompt (used if DB fetch fails)
const FALLBACK_SYSTEM_PROMPT = `Je bent Magic Mike 🎩 — de ultieme muziek-detective van MusicScan. Antwoord altijd in het Nederlands.`;

// Conversational engagement instructions - always appended to any system prompt
const CONVERSATIONAL_INSTRUCTIONS = `

## GESPREKSREGELS — ACTIEF DOORVRAGEN

Je bent niet alleen een scanner, je bent een muziek-detective die ACTIEF het gesprek voert. Volg deze regels:

1. **Stel altijd een vervolgvraag** aan het einde van je antwoord. Eindig NOOIT met alleen een feit — sluit af met een vraag die het gesprek verdiept.
2. **Toon oprechte nieuwsgierigheid** naar de collectie en smaak van de gebruiker. Voorbeelden:
   - "Heb je meer albums van deze artiest in je collectie?"
   - "Wat trok je aan in dit album — het geluid, de cover, of een herinnering?"
   - "Ken je het verhaal achter deze opname?"
   - "Welk decennium spreekt je het meest aan qua muziek?"
   - "Is dit een recente aanwinst of heb je deze al langer?"
3. **Maak connecties** tussen wat de gebruiker vraagt en bredere muziekkennis:
   - Als iemand vraagt over een artiest → koppel aan tijdgenoten, invloeden, of vergelijkbare artiesten
   - Als iemand vraagt over waarde → vraag naar conditie, of ze willen verkopen, of het een emotionele waarde heeft
   - Als iemand een genre noemt → vraag naar hun favorieten in dat genre
4. **Varieer je vragen** — stel niet steeds hetzelfde type vraag. Wissel af tussen:
   - Persoonlijke vragen ("Wat is je mooiste muziekherinnering?")
   - Kennisvragen ("Wist je dat dit album in Studio X is opgenomen?")
   - Adviesvragen ("Zal ik je meer vertellen over de producer?")
   - Collectievragen ("Welke andere platen uit dit jaar heb je?")
5. **Na een scan-resultaat**: vraag niet meteen of ze willen opslaan (dat staat al als knop). Deel liever een interessant feit en vraag of ze meer willen weten.
6. **Bij algemene vragen** (niet scan-gerelateerd): wees enthousiast en deel je kennis, maar stuur het gesprek altijd richting ontdekking en verdieping.
7. **Platform-content**: Als er een [PLATFORM_CONTENT: ...] tag in een gebruikersbericht staat, verwijs dan actief naar die content. Zeg bijvoorbeeld: "We hebben een uitgebreid verhaal over deze artiest op het platform — bekijk het eens!" of "Er zijn ook gave producten van deze artiest in onze shop." Maak het natuurlijk en enthousiast, niet geforceerd. Verwijs NOOIT naar platform-content als er geen [PLATFORM_CONTENT] tag aanwezig is.
8. **Collectie-context**: Als er een [COLLECTIE_CONTEXT] blok in een gebruikersbericht staat, gebruik deze data dan actief om vragen over hun collectie te beantwoorden. Je kent hun totaal aantal items, waarde, top artiesten, genres en recente aanwinsten. Gebruik dit om persoonlijk en relevant advies te geven. Noem specifieke artiesten en albums uit hun collectie wanneer relevant. Zeg NIET "ik kan je collectie niet zien" als de context aanwezig is.`;


async function loadAgentPrompt(): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load profile first to get agent_id
    const profileRes = await supabase
      .from("ai_agent_profiles")
      .select("id, system_prompt")
      .eq("agent_name", "magic_mike")
      .eq("is_active", true)
      .single();

    if (profileRes.error || !profileRes.data) {
      console.warn("[scan-chat] Could not load agent profile, using fallback:", profileRes.error?.message);
      return FALLBACK_SYSTEM_PROMPT;
    }

    let prompt = profileRes.data.system_prompt;

    // Load knowledge sources for this agent
    const knowledgeRes = await supabase
      .from("ai_agent_knowledge")
      .select("title, content")
      .eq("agent_id", profileRes.data.id)
      .eq("is_active", true);

    const agentKnowledge = knowledgeRes.data || [];

    if (agentKnowledge.length > 0) {
      prompt += "\n\n## EXTRA KENNISBRONNEN\nGebruik onderstaande informatie als aanvullende context bij je analyses:\n";
      for (const k of agentKnowledge) {
        prompt += `\n### ${k.title}\n${k.content}\n`;
      }
    }

    // Always append conversational engagement instructions
    prompt += CONVERSATIONAL_INSTRUCTIONS;

    console.log(`[scan-chat] Loaded agent prompt (${prompt.length} chars) with ${agentKnowledge.length} knowledge sources`);
    return prompt;
  } catch (e) {
    console.error("[scan-chat] Error loading agent prompt:", e);
    return FALLBACK_SYSTEM_PROMPT + CONVERSATIONAL_INSTRUCTIONS;
  }
}



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

    // Load system prompt from database (with knowledge sources)
    const systemPrompt = await loadAgentPrompt();

    // Build messages array for the AI
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
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
