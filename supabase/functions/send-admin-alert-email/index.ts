import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = 'rogiervisser76@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { alert_type, message, source_function, metadata } = await req.json();

    const subjectMap: Record<string, string> = {
      credit_depleted: '🚨 AI Credits zijn OP!',
      rate_limited: '⚠️ Rate Limit bereikt',
      abuse_detected: '🛡️ Mogelijk misbruik gedetecteerd',
    };

    const subject = subjectMap[alert_type] || `⚠️ Admin Alert: ${alert_type}`;

    const metaHtml = metadata
      ? `<table style="margin-top:12px;border-collapse:collapse;font-size:13px;">
          ${Object.entries(metadata).map(([k, v]) => 
            `<tr><td style="padding:4px 12px 4px 0;color:#888;">${k}</td><td style="padding:4px 0;font-weight:600;">${v}</td></tr>`
          ).join('')}
        </table>`
      : '';

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
        <div style="background:#1a1a2e;border-radius:12px;padding:24px;color:#fff;">
          <h2 style="margin:0 0 8px;font-size:20px;">${subject}</h2>
          <p style="margin:0 0 16px;color:#ccc;font-size:14px;">${message}</p>
          ${source_function ? `<p style="margin:0;color:#888;font-size:12px;">Bron: ${source_function}</p>` : ''}
          ${metaHtml}
          <hr style="border:none;border-top:1px solid #333;margin:16px 0;" />
          <p style="margin:0;color:#666;font-size:11px;">MusicScan Admin Alert • ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</p>
        </div>
      </div>
    `;

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: 'MusicScan Alerts <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject,
      html,
    });

    console.log(`📧 Alert email sent: ${alert_type}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ Error sending alert email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
