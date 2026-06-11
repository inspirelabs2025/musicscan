import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `Je bent een ervaren Nederlandse muziekjournalist die voor MusicScan schrijft. Stijl: Volkskrant/OOR/Lust for Life - kennis van zaken, droge humor, zonder pretenties.

ABSOLUUT VERBODEN (dit verraadt AI-schrijfstijl):
- Em-dashes of en-dashes (— of –). Gebruik gewoon komma's, punten of haakjes.
- Zinnen als "Niet alleen ... maar ook", "In een wereld waar...", "Het is meer dan..."
- Opsommingen met drie bijvoeglijke naamwoorden ("rauw, eerlijk en tijdloos")
- Frases als "een ware revolutie", "iconisch", "legendarisch" zonder onderbouwing
- "Laten we duiken in", "ontdek", "in dit artikel"
- Generieke openingen over "muziek raakt ons allemaal"
- Overdreven enthousiasme of marketing-taal
- Bullshit conclusieparagrafen die samenvatten wat je net schreef

WEL DOEN:
- Begin met een concreet detail, anekdote of feit. Niet met een algemene observatie.
- Gebruik exacte cijfers, jaartallen, namen van producers/studios/sessiemuzikanten
- Schrijf zoals een vriend die toevallig veel weet: informeel, met grapjes, met meningen
- Korte en lange zinnen door elkaar. Soms een fragment. Voor ritme.
- Citeer als het kan (artiest in interview, recensent, etc) maar verzin NIETS
- Als je iets niet zeker weet: zeg dat, of laat het weg

ONDERZOEK:
- Graaf naar weetjes die niet op de eerste pagina van Google staan
- Sessiemuzikanten, B-kant verhalen, opname-incidenten, label-ruzies, hoesfotograaf, mixing engineer
- Chart-posities, verkoopcijfers, samples die later gebruikt zijn, covers door anderen
- Persoonlijke context van de artiest in die periode

OUTPUT: Geef ALLEEN geldig JSON terug (geen markdown codeblokken), schema:
{
  "title": "Pakkende titel max 70 chars, geen clickbait",
  "summary": "1-2 zinnen, max 200 chars, geeft de hook weg",
  "category": "een van: Album, Artiest, Single, Geschiedenis, Studio, Verhaal",
  "slug": "kebab-case-slug-zonder-leestekens",
  "content": "Markdown blog 600-1000 woorden. Gebruik ## voor tussenkopjes. Geen H1 (titel staat al apart)."
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ontbreekt");
    const { topic, extraContext } = await req.json();
    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "topic verplicht" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Schrijf een blog over: ${topic}${
      extraContext ? `\n\nExtra context van de redacteur: ${extraContext}` : ""
    }\n\nDoe je onderzoek en kom met inhoud die niet voor de hand ligt. Schrijf menselijk.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
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
    let raw = aiJson.choices?.[0]?.message?.content ?? "";
    // strip eventuele code fences als het model ze toch toevoegt
    raw = raw.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();

    let blog;
    try {
      blog = JSON.parse(raw);
    } catch {
      throw new Error("AI gaf geen geldig JSON terug");
    }

    // Post-clean: vervang AI em/en-dashes
    if (blog.content) {
      blog.content = blog.content.replace(/—/g, ",").replace(/–/g, "-");
    }
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
