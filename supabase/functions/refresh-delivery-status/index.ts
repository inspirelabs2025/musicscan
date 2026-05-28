import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function mapStatus(lastEvent: string | null | undefined): string | null {
  if (!lastEvent) return null;
  const e = lastEvent.toLowerCase();
  if (e.includes("delivered")) return "delivered";
  if (e.includes("bounce")) return "bounced";
  if (e.includes("complain")) return "complained";
  if (e.includes("queue") || e === "sent" || e === "sending" || e.includes("delay")) return "queued";
  if (e.includes("fail")) return "failed";
  return e;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { campaignId } = await req.json();
    if (!campaignId) {
      return new Response(JSON.stringify({ error: "campaignId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: sends, error } = await supabase
      .from("discogs_bulk_email_sends")
      .select("id, resend_email_id")
      .eq("campaign_id", campaignId)
      .not("resend_email_id", "is", null);

    if (error) throw error;

    let updated = 0;
    const results: any[] = [];

    for (const s of sends || []) {
      try {
        const res = await fetch(`https://api.resend.com/emails/${s.resend_email_id}`, {
          headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
        });
        const body = await res.json();
        const lastEvent = body?.last_event ?? body?.status ?? null;
        const newStatus = mapStatus(lastEvent);
        results.push({ id: s.id, resend_email_id: s.resend_email_id, last_event: lastEvent, mapped: newStatus });

        if (newStatus) {
          const update: any = { status: newStatus };
          if (newStatus === "delivered" && !body?.delivered_at) {
            update.delivered_at = new Date().toISOString();
          }
          await supabase.from("discogs_bulk_email_sends").update(update).eq("id", s.id);
          updated++;
        }
      } catch (e) {
        console.error("refresh err", s.id, e);
      }
    }

    return new Response(JSON.stringify({ checked: sends?.length || 0, updated, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
