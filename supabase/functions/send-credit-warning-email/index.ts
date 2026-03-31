import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "rogiervisser76@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, balance, total_earned, percentage } = await req.json();

    // Deduplicate: check if we already sent a warning for this user recently (last 24h)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentAlerts } = await supabase
      .from("admin_alerts")
      .select("id")
      .eq("alert_type", "credit_low_email")
      .gte("created_at", oneDayAgo)
      .limit(1);

    if (recentAlerts && recentAlerts.length > 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "Already sent within 24h" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
    const userEmail = user?.email || "onbekend";

    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: "MusicScan <noreply@musicscan.app>",
      to: [ADMIN_EMAIL],
      subject: `⚠️ Credits bijna op - ${balance} credits resterend (${Math.round(percentage)}%)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">⚠️ Credit Waarschuwing</h2>
          <p>Een gebruiker heeft nog maar <strong>${Math.round(percentage)}%</strong> van het tegoed over.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Gebruiker</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${userEmail}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">User ID</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${user_id}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Resterend</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${balance} credits</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Totaal verdiend</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${total_earned} credits</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Percentage over</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${Math.round(percentage)}%</td></tr>
          </table>
          <p style="color: #6b7280; font-size: 12px;">Deze melding wordt maximaal 1x per 24 uur verstuurd.</p>
        </div>
      `,
    });

    // Log that we sent the email
    await supabase.from("admin_alerts").insert({
      alert_type: "credit_low_email",
      source_function: "send-credit-warning-email",
      message: `📧 Credit waarschuwing email verstuurd: ${balance} credits over (${Math.round(percentage)}%) voor ${userEmail}`,
      metadata: { user_id, balance, total_earned, percentage },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-credit-warning-email] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
