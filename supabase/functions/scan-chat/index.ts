import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback system prompt (used if DB fetch fails)
const FALLBACK_SYSTEM_PROMPT = `Je bent Magic Mike 🎩 — de ultieme muziek-detective van MusicScan. Antwoord altijd in het Nederlands.`;

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

    console.log(`[scan-chat] Loaded agent prompt (${prompt.length} chars) with ${agentKnowledge.length} knowledge sources`);
    return prompt;
  } catch (e) {
    console.error("[scan-chat] Error loading agent prompt:", e);
    return FALLBACK_SYSTEM_PROMPT;
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
