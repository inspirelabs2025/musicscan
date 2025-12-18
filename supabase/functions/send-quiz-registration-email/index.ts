import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuizRegistrationRequest {
  email: string;
  firstName?: string;
  quizScore: number;
  quizTotal: number;
  quizPercentage: number;
  quizType: string;
  badgeTitle: string;
  badgeEmoji: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-quiz-registration-email: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: QuizRegistrationRequest = await req.json();
    console.log("Processing quiz registration email for:", body.email);

    const {
      email,
      firstName,
      quizScore,
      quizTotal,
      quizPercentage,
      quizType,
      badgeTitle,
      badgeEmoji,
    } = body;

    const greeting = firstName ? `Hoi ${firstName}!` : "Hoi!";
    const siteUrl = "https://www.musicscan.app";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welkom bij MusicScan!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #d946ef 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Geweldig gespeeld!</h1>
    </div>
    
    <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #18181b; margin-bottom: 24px;">
        ${greeting}
      </p>
      
      <p style="color: #52525b; line-height: 1.6;">
        Je hebt zojuist de <strong>${quizType}</strong> quiz gespeeld op MusicScan en je account is aangemaakt!
      </p>
      
      <!-- Quiz Results -->
      <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <p style="font-size: 48px; margin: 0 0 8px 0;">${badgeEmoji}</p>
        <p style="font-size: 24px; font-weight: bold; color: #7c3aed; margin: 0 0 8px 0;">${quizPercentage}%</p>
        <p style="color: #6b7280; margin: 0;">${quizScore} van ${quizTotal} correct</p>
        <p style="background: #8b5cf6; color: white; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-top: 12px;">
          ${badgeTitle}
        </p>
      </div>
      
      <p style="color: #52525b; line-height: 1.6;">
        Je ontvangt binnenkort een aparte e-mail van Supabase om je wachtwoord in te stellen. Daarna kun je inloggen en al je quiz scores bekijken.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${siteUrl}/mijn-quizzen" 
           style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; display: inline-block;">
          Bekijk Mijn Quiz Scores
        </a>
      </div>
      
      <p style="color: #52525b; line-height: 1.6;">
        Wat kun je doen op MusicScan?
      </p>
      
      <ul style="color: #52525b; line-height: 1.8;">
        <li>🎵 Speel meer quizzen en verdien badges</li>
        <li>📀 Scan je vinyl & CD collectie</li>
        <li>📖 Lees muziekverhalen en nieuws</li>
        <li>🛒 Shop unieke muziek merchandise</li>
      </ul>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      
      <p style="color: #9ca3af; font-size: 14px; text-align: center;">
        Je account is aangemaakt met: <strong>${email}</strong>
      </p>
    </div>
    
    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
      © 2024 MusicScan - Hét Muziekplatform
    </p>
  </div>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "MusicScan <noreply@musicscan.nl>",
      to: [email],
      subject: `${badgeEmoji} Je scoorde ${quizPercentage}%! Welkom bij MusicScan`,
      html: emailHtml,
    });

    console.log("Quiz registration email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-quiz-registration-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
