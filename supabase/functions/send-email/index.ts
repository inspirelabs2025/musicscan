import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log('📧 Received email webhook request');
    
    // Verify webhook if secret is configured
    let emailData: any;
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      emailData = wh.verify(payload, headers);
    } else {
      emailData = JSON.parse(payload);
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url }
    } = emailData;

    console.log('🔐 Processing email for:', { 
      email: user.email, 
      action: email_action_type,
      redirectTo: redirect_to 
    });

    // Create confirmation URL
    const confirmationUrl = `${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
    
    // Create the HTML email using your template
    const emailHtml = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Welkom bij MusicScan!</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f4f4f4;">
  <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" bgcolor="#ffffff" cellpadding="20" cellspacing="0" style="margin:20px 0; border-radius:8px;">
          <!-- Header -->
          <tr>
            <td align="center">
              <h1 style="color:#333333;">🎶 Welkom bij MusicScan!</h1>
              <p style="color:#777777; font-size:14px;">Je inschrijving is succesvol afgerond.</p>
            </td>
          </tr>

          <!-- Intro & waarde -->
          <tr>
            <td style="color:#555555; font-size:16px; line-height:1.5;">
              <p>Hi <strong>${user.email}</strong>,</p>
              <p>Wat fantastisch dat je je hebt aangemeld bij <strong>MusicScan</strong>! We zijn ontzettend blij je hier te verwelkomen.</p>
              <p>Met MusicScan ontdek je:</p>
              <ul style="color:#555555; font-size:16px; line-height:1.5;">
                <li>🎧 Persoonlijke muzikale profielen</li>
                <li>📈 Slimme aanbevelingen die meeschalen met je luisterstijl</li>
                <li>💡 Updates en tips over nieuwe features en content</li>
              </ul>
            </td>
          </tr>

          <!-- CTA knop -->
          <tr>
            <td align="center">
              <a href="${confirmationUrl}" target="_blank"
                 style="background-color:#1DB954; color:#ffffff; text-decoration:none; padding:15px 30px; border-radius:30px; font-size:16px; display:inline-block;">
                Bevestig je account en start je muzikale reis
              </a>
            </td>
          </tr>

          <!-- Backup link -->
          <tr>
            <td style="color:#555555; font-size:14px; line-height:1.5;">
              <p>Als de knop niet werkt, kopieer en plak deze link in je browser:</p>
              <p style="word-break: break-all; color:#1DB954;">${confirmationUrl}</p>
            </td>
          </tr>

          <!-- Vragen & support -->
          <tr>
            <td style="color:#555555; font-size:16px; line-height:1.5;">
              <p>Vragen of feedback? Antwoord op deze mail – ons team staat voor je klaar.</p>
              <p>Veel luisterplezier,<br>
              Het MusicScan‑team</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size:12px; color:#aaaaaa;">
              PS: Volg ons op <a href="#" style="color:#1DB954; text-decoration:none;">Instagram</a> &amp;
              <a href="#" style="color:#1DB954; text-decoration:none;">Twitter</a> voor exclusieve previews, tips en acties.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: 'MusicScan <noreply@musicscan.app>',
      to: [user.email],
      subject: 'Welkom bij MusicScan - Bevestig je account',
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }

    console.log('✅ Email sent successfully to:', user.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });

  } catch (error: any) {
    console.error('❌ Error in send-email function:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        },
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);