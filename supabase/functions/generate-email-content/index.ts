import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, templateType, currentConfig } = await req.json();
    
    console.log('Generating email content with prompt:', prompt);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = templateType === 'daily_digest'
      ? `Je bent een email marketing expert die engaging dagelijkse digest emails schrijft voor MusicScan, een muziek community platform.
      
Genereer email content met deze structuur:
- introText: Korte, pakkende intro (max 100 woorden)
- outroText: Warme afsluiting (max 50 woorden)
- ctaButtonText: Krachtige CTA button tekst (max 4 woorden, geen "en" of extra tekst)

BELANGRIJK voor ctaButtonText:
- Maximum 4 woorden
- Geen voegwoorden zoals "en"
- Voorbeelden: "Bekijk Nieuwe Releases", "Ontdek Nu", "Start Je Reis"

Stijl: Enthousiast, vriendelijk, muziek-gepassioneerd. Spreek de lezer direct aan.
Focus: Community, ontdekking, delen van muziekervaringen.`
      : `Je bent een email marketing expert die engaging wekelijkse discussie emails schrijft voor MusicScan's muziek forum.

Genereer email content met deze structuur:
- headerText: Pakkende kop over het discussie onderwerp (max 60 tekens)
- ctaButtonText: Krachtige CTA button tekst (max 4 woorden)

BELANGRIJK voor ctaButtonText:
- Maximum 4 woorden
- Geen voegwoorden
- Voorbeelden: "Doe Nu Mee", "Deel Je Mening", "Join Discussie"

Stijl: Uitnodigend, nieuwsgierig makend, community-gericht.
Focus: Discussie stimuleren, engagement, muziek-kennis delen.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Genereer email content gebaseerd op deze prompt: "${prompt}"
            
Huidige configuratie voor context:
${JSON.stringify(currentConfig, null, 2)}

Geef ALLEEN de JSON terug met de nieuwe content velden, zonder extra tekst.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_email_content",
              description: "Generate email content based on user prompt",
              parameters: {
                type: "object",
                properties: templateType === 'daily_digest' ? {
                  introText: { type: "string", description: "Engaging intro text (max 100 words)" },
                  outroText: { type: "string", description: "Warm closing text (max 50 words)" },
                  ctaButtonText: { type: "string", description: "Powerful CTA button text (max 5 words)" }
                } : {
                  headerText: { type: "string", description: "Catchy header about discussion topic (max 60 chars)" },
                  ctaButtonText: { type: "string", description: "Powerful CTA button text (max 5 words)" }
                },
                required: templateType === 'daily_digest' 
                  ? ["introText", "outroText", "ctaButtonText"]
                  : ["headerText", "ctaButtonText"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_email_content" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit bereikt. Probeer het later opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Onvoldoende credits. Voeg credits toe aan je Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));
    
    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const generatedContent = JSON.parse(toolCall.function.arguments);
    console.log('Generated content:', generatedContent);

    return new Response(
      JSON.stringify({ content: generatedContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-email-content:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
