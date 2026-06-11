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

const CHAT_SYSTEM = `Je bent Mike, een ervaren Nederlandse muziekjournalist en vaste blogger voor MusicScan. Je brainstormt met de redacteur over een nieuw blog.

PERSOONLIJKHEID:
- Noem jezelf Mike. Praat in de ik-vorm, informeel maar inhoudelijk.
- Droge humor, geen overdreven enthousiasme. Geen "Geweldig idee!" of "Wat een leuke vraag!".
- Je houdt van details die niemand kent: B-kantjes, sessiemuzikanten, ruzies in de studio, vergeten producers.

${STYLE_RULES}

JOUW ROL IN DE CHAT:
- Stel scherpe vragen om de invalshoek aan te scherpen (welke periode, welk album, welke hoek: technisch/persoonlijk/zakelijk/cultureel).
- Deel weetjes en suggesties. Graaf naar dingen die niet op pagina 1 van Google staan.
- Wees kort en concreet (max 4-6 zinnen per beurt). Geen bullshit-inleidingen.
- Als de redacteur zegt "schrijf het" / "genereer" / "maak het blog" / iets vergelijkbaars, hoef jij nog niets te doen. De redacteur drukt dan op een knop.

Antwoord met platte tekst (geen JSON, geen markdown-codeblokken).`;

const GENERATE_SYSTEM_NL = `Je bent een ervaren Nederlandse muziekjournalist. Op basis van de chat hieronder schrijf je nu het definitieve blog voor MusicScan.

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

const GENERATE_SYSTEM_EN = `You are an experienced music journalist writing for MusicScan. Based on the chat below, write the final blog post now.

STYLE:
- English, human voice, dry humor, deep knowledge (think Pitchfork / MOJO / Uncut).
- ABSOLUTELY NO em-dashes or en-dashes (— or –). Use commas, periods or parentheses.
- No AI cliches: "not only ... but also", "in a world where", "iconic/legendary" without proof, three-adjective lists ("raw, honest and timeless"), generic recap conclusions.
- Concrete details: years, producer names, studios, session musicians, chart positions. Never invent facts. If unsure, say so or leave it out.

EXTRA:
- 600-1000 words.
- Open with a concrete detail or anecdote, not a general observation.
- Use ## for subheadings (no H1, the title is separate).
- No summarizing conclusion paragraph repeating what you just wrote.

OUTPUT: ONLY valid JSON (no markdown code blocks):
{
  "title": "max 70 chars, no clickbait",
  "summary": "1-2 sentences, max 200 chars",
  "category": "Album | Artist | Single | History | Studio | Story",
  "slug": "kebab-case-no-punctuation",
  "content": "markdown blog"
}`;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function generateAndUploadImage(title: string, summary: string): Promise<string | null> {
  // 1. korte image-prompt via tekst-model
  const promptRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: `Korte image-prompt (max 80 woorden) voor een redactionele muziekfoto bij dit blog.
Titel: ${title}
Samenvatting: ${summary}
Stijl: professionele muziekjournalistiek, sfeervol, geen tekst, geen logo's, geen gezichten van bekende personen.
Return ALLEEN de prompt.`,
      }],
    }),
  });
  if (!promptRes.ok) throw new Error(`prompt gen ${promptRes.status}`);
  const promptJson = await promptRes.json();
  const imagePrompt = promptJson.choices?.[0]?.message?.content?.trim() || title;

  // 2. image genereren
  const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{
        role: "user",
        content: `${imagePrompt}\n\nStyle: editorial music journalism, 16:9, hoge kwaliteit, sfeervol licht.`,
      }],
      modalities: ["image", "text"],
    }),
  });
  if (!imgRes.ok) throw new Error(`image gen ${imgRes.status}: ${await imgRes.text()}`);
  const imgJson = await imgRes.json();
  const dataUrl: string | undefined = imgJson.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) throw new Error("geen image in response");

  // 3. upload naar storage
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const safeSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  const filename = `news/${Date.now()}-${safeSlug || "blog"}.png`;

  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/news-images/${filename}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: binary,
  });
  if (!uploadRes.ok) throw new Error(`upload ${uploadRes.status}: ${await uploadRes.text()}`);

  return `${SUPABASE_URL}/storage/v1/object/public/news-images/${filename}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ontbreekt");
    const body = await req.json();
    const mode: "chat" | "generate" | "image" =
      body.mode === "generate" ? "generate" : body.mode === "image" ? "image" : "chat";

    if (mode === "image") {
      const title: string = body.title || "";
      const summary: string = body.summary || "";
      if (!title) {
        return new Response(JSON.stringify({ error: "title verplicht" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const imageUrl = await generateAndUploadImage(title, summary);
      return new Response(JSON.stringify({ image_url: imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages: Array<{ role: "user" | "assistant"; content: string }> =
      Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const language: "nl" | "en" = body.language === "en" ? "en" : "nl";
    const GENERATE_SYSTEM = language === "en" ? GENERATE_SYSTEM_EN : GENERATE_SYSTEM_NL;
    const system = mode === "generate" ? GENERATE_SYSTEM : CHAT_SYSTEM;
    const payloadMessages = [{ role: "system", content: system }, ...messages];

    if (mode === "generate") {
      payloadMessages.push({
        role: "user",
        content: language === "en"
          ? "Write the final blog now based on the chat above. JSON only per schema. Write the entire blog in English."
          : "Schrijf nu het definitieve blog op basis van bovenstaande chat. Alleen JSON volgens schema.",
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
