import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const STYLE_RULES = `STIJL (geldt altijd):
- Nederlands, menselijk, droge humor, kennis van zaken (Volkskrant/OOR/Lust for Life).
- ABSOLUUT GEEN em-dashes of en-dashes (— of –). Gebruik komma's, punten of haakjes.
- Geen AI-clichés: "niet alleen ... maar ook", "in een wereld waar", "duik mee", "iconisch/legendarisch" zonder bewijs, drie-bijvoeglijke opsommingen ("rauw, eerlijk en tijdloos"), generieke samenvatting-conclusies.
- Concrete details: jaartallen, namen van producers, studio's, sessiemuzikanten, chart-posities. Verzin nooit feiten. Onzeker? Zeg dat of laat het weg.`;

const CHAT_SYSTEM = `Je bent een ervaren Nederlandse muziekjournalist die met de redacteur brainstormt over een nieuw blog voor MusicScan.

${STYLE_RULES}

JOUW ROL IN DE CHAT:
- Stel scherpe vragen om de invalshoek aan te scherpen (welke periode, welk album, welke hoek: technisch/persoonlijk/zakelijk/cultureel).
- Deel weetjes en suggesties. Graaf naar dingen die niet op pagina 1 van Google staan.
- Wees kort en concreet (max 4-6 zinnen per beurt). Geen bullshit-inleidingen.
- Als de redacteur zegt "schrijf het" / "genereer" / "maak het blog" / iets vergelijkbaars, hoeft jij nog niets te doen. De redacteur drukt dan op een knop.

Antwoord met platte tekst (geen JSON, geen markdown-codeblokken).`;

const GENERATE_SYSTEM = `Je bent een ervaren Nederlandse muziekjournalist. Op basis van de chat hieronder schrijf je nu het definitieve blog voor MusicScan.

${STYLE_RULES}

EXTRA:
- 600-1000 woorden.
- Begin met een concreet detail of anekdote, niet met een algemene observatie.
- Gebruik ## voor tussenkopjes (geen H1, titel staat apart).
- Geen samenvattende conclusieparagraaf die herhaalt wat je net schreef.

OUTPUT: ALLEEN geldig JSON (geen markdown codeblokken):
{
  "title": "max 70 chars, geen clickbait",
  "summary": "1-2 zinnen, max 200 chars",
  "category": "Album | Artiest | Single | Geschiedenis | Studio | Verhaal",
  "slug": "kebab-case-zonder-leestekens",
  "content": "markdown blog"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ontbreekt");
    const body = await req.json();
    const mode: "chat" | "generate" = body.mode === "generate" ? "generate" : "chat";
    const messages: Array<{ role: "user" | "assistant"; content: string }> =
      Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = mode === "generate" ? GENERATE_SYSTEM : CHAT_SYSTEM;
    const payloadMessages = [{ role: "system", content: system }, ...messages];

    if (mode === "generate") {
      payloadMessages.push({
        role: "user",
        content:
          "Schrijf nu het definitieve blog op basis van bovenstaande chat. Alleen JSON volgens schema.",
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: payloadMessages,
        ...(mode === "generate" ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Probeer zo opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits op. Voeg credits toe in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway ${aiRes.status}: ${errText}`);
    }

    const aiJson = await aiRes.json();
    let raw: string = aiJson.choices?.[0]?.message?.content ?? "";

    if (mode === "chat") {
      const reply = raw.replace(/[—–]/g, "-");
      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // generate
    raw = raw.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
    let blog;
    try {
      blog = JSON.parse(raw);
    } catch {
      throw new Error("AI gaf geen geldig JSON terug");
    }
    if (blog.content) blog.content = blog.content.replace(/—/g, ",").replace(/–/g, "-");
    if (blog.title) blog.title = blog.title.replace(/[—–]/g, "-");

    return new Response(JSON.stringify({ blog }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("admin-blog-writer error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
