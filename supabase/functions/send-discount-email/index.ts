import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Validate X-API-Key header
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("EMAIL_API_KEY");

    if (!expectedKey) {
      console.error("❌ EMAIL_API_KEY secret not configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!apiKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate request body
    const { discount_code, discount_percent, subject } = await req.json();

    if (!discount_code || !discount_percent || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: discount_code, discount_percent, subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🎫 Starting discount email campaign:", { discount_code, discount_percent, subject });

    // Init clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // 1. Get bot user IDs from profiles
    const { data: botProfiles } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("is_bot", true);

    const botUserIds = new Set((botProfiles || []).map((p: any) => p.user_id));
    console.log(`🤖 Found ${botUserIds.size} bot users to exclude`);

    // 2. Get all auth users (non-bot)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    const authEmails = (authData.users || [])
      .filter((u: any) => u.email && !botUserIds.has(u.id))
      .map((u: any) => u.email as string);

    console.log(`👤 Auth users (non-bot): ${authEmails.length}`);

    // 3. Get newsletter subscribers
    const { data: subscribers } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true);

    const subscriberEmails = (subscribers || []).map((s: any) => s.email as string);
    console.log(`📰 Newsletter subscribers: ${subscriberEmails.length}`);

    // 4. Deduplicate
    const allEmails = [...new Set([...authEmails, ...subscriberEmails])];
    console.log(`📧 Total unique recipients: ${allEmails.length}`);

    // 5. Build email HTML
    const buildEmailHtml = (email: string) => `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="600" bgcolor="#ffffff" cellpadding="30" cellspacing="0" style="margin:20px 0;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <tr>
          <td align="center" style="background:linear-gradient(135deg,#1DB954,#1ed760);border-radius:8px 8px 0 0;padding:30px;">
            <h1 style="color:#fff;margin:0;font-size:28px;">🎶 Exclusieve Korting!</h1>
            <p style="color:#fff;opacity:0.9;font-size:16px;margin:10px 0 0;">Speciaal voor jou van MusicScan</p>
          </td>
        </tr>
        <tr>
          <td style="padding:30px;">
            <p style="color:#333;font-size:18px;margin:0 0 20px;">Hallo muziekliefhebber!</p>
            <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 25px;">
              We hebben een exclusieve aanbieding voor je: <strong>${discount_percent}% korting</strong> op je volgende aankoop in de MusicScan Shop!
            </p>
            <div style="background:#f0faf4;border:2px dashed #1DB954;padding:20px;margin:25px 0;border-radius:8px;text-align:center;">
              <p style="color:#888;font-size:14px;margin:0 0 8px;">Jouw kortingscode:</p>
              <p style="color:#1DB954;font-size:28px;font-weight:bold;margin:0;letter-spacing:3px;">${discount_code}</p>
            </div>
            <div style="text-align:center;margin:35px 0;">
              <a href="https://www.musicscan.app/shop"
                 style="background:#1DB954;color:#fff;text-decoration:none;padding:15px 30px;border-radius:25px;font-size:16px;font-weight:bold;display:inline-block;box-shadow:0 4px 15px rgba(29,185,84,0.3);">
                🛍️ Shop nu met korting
              </a>
            </div>
            <p style="color:#888;font-size:13px;text-align:center;margin:25px 0 0;">
              Gebruik de code bij het afrekenen. Geldig zolang de voorraad strekt.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f9fa;padding:20px;border-radius:0 0 8px 8px;border-top:1px solid #eee;">
            <p style="color:#888;font-size:12px;text-align:center;margin:0;">
              <a href="https://www.musicscan.app/shop" style="color:#1DB954;text-decoration:none;">Shop</a> •
              <a href="https://www.musicscan.app" style="color:#1DB954;text-decoration:none;">MusicScan.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // 6. Send emails in batches
    const batchSize = 50;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < allEmails.length; i += batchSize) {
      const batch = allEmails.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map((email) =>
          resend.emails.send({
            from: "MusicScan <noreply@musicscan.app>",
            to: [email],
            subject,
            html: buildEmailHtml(email),
          })
        )
      );

      results.forEach((r, idx) => {
        if (r.status === "fulfilled" && !r.value.error) {
          sent++;
        } else {
          failed++;
          console.error(`❌ Failed: ${batch[idx]}`, r.status === "rejected" ? r.reason : r.value.error);
        }
      });

      // Rate limit pause between batches
      if (i + batchSize < allEmails.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    console.log(`📊 Discount email campaign done: ${sent} sent, ${failed} failed, ${allEmails.length} total`);

    return new Response(
      JSON.stringify({ sent, failed, total_users: allEmails.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error in send-discount-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
