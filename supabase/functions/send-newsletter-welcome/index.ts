import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  source?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, source }: WelcomeEmailRequest = await req.json();

    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    console.log('📧 Sending welcome email to:', email);

    const emailHtml = `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Welkom bij de MusicScan Nieuwsbrief!</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f4f4f4;">
  <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" bgcolor="#ffffff" cellpadding="20" cellspacing="0" style="margin:20px 0; border-radius:8px;">
          <!-- Header -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1DB954, #191414); border-radius: 8px 8px 0 0; padding: 30px;">
              <h1 style="color:#ffffff; margin:0;">🎵 Welkom bij MusicScan!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="color:#555555; font-size:16px; line-height:1.6; padding: 30px;">
              <p style="margin-top:0;">Hallo muziekliefhebber!</p>
              
              <p>Geweldig dat je je hebt ingeschreven voor onze nieuwsbrief. Je bent nu onderdeel van onze groeiende community van muziekfans en verzamelaars.</p>
              
              <h3 style="color:#1DB954; margin-bottom:10px;">Wat kun je verwachten?</h3>
              <ul style="color:#555555; padding-left:20px;">
                <li>📰 <strong>Wekelijkse muziekverhalen</strong> - Ontdek de verhalen achter iconische albums</li>
                <li>🎸 <strong>Artiest spotlights</strong> - Diepgaande artikelen over je favoriete artiesten</li>
                <li>💿 <strong>Vinyl & CD tips</strong> - Verzameltips en marktinzichten</li>
                <li>🏆 <strong>Quiz uitdagingen</strong> - Test je muziekkennis</li>
                <li>🛍️ <strong>Shop updates</strong> - Nieuwe producten en exclusieve aanbiedingen</li>
              </ul>
              
              <p>We sturen je alleen relevante content - geen spam, beloofd!</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 0 30px 30px;">
              <a href="https://www.musicscan.app/quizzen" 
                 style="background-color:#1DB954; color:#ffffff; text-decoration:none; padding:15px 30px; border-radius:30px; font-size:16px; display:inline-block;">
                Start een Quiz 🎮
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#f9f9f9; padding:20px; border-radius: 0 0 8px 8px;">
              <p style="font-size:12px; color:#aaaaaa; margin:0;">
                Je ontvangt deze email omdat je je hebt ingeschreven via ${source || 'onze website'}.<br>
                <a href="https://www.musicscan.app/uitschrijven" style="color:#1DB954;">Uitschrijven</a> | 
                <a href="https://www.musicscan.app" style="color:#1DB954;">MusicScan.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: 'MusicScan <noreply@musicscan.app>',
      to: [email],
      subject: '🎵 Welkom bij de MusicScan Nieuwsbrief!',
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Failed to send welcome email:', error);
      throw error;
    }

    console.log('✅ Welcome email sent successfully to:', email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Error in send-newsletter-welcome:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
