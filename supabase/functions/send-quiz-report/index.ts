import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuestionResult {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
}

interface QuizReportRequest {
  email: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  quizType: string;
  badge: string;
  badgeEmoji: string;
  questions: QuestionResult[];
  pointsEarned: number;
  shareUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const data: QuizReportRequest = await req.json();

    const {
      email,
      score,
      totalQuestions,
      percentage,
      quizType,
      badge,
      badgeEmoji,
      questions,
      pointsEarned,
      shareUrl
    } = data;

    console.log(`Sending quiz report to ${email}`);

    // Build questions HTML
    const questionsHtml = questions.map((q, i) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="font-weight: 500; margin-bottom: 4px;">${i + 1}. ${q.question}</div>
          <div style="font-size: 13px; color: ${q.isCorrect ? '#22c55e' : '#ef4444'};">
            ${q.isCorrect 
              ? `✓ Correct: ${q.correctAnswer}` 
              : `✗ Jouw antwoord: ${q.userAnswer} • Correct: ${q.correctAnswer}`
            }
          </div>
        </td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 8px;">${badgeEmoji}</div>
            <h1 style="color: white; margin: 0 0 8px 0; font-size: 28px;">Quiz Rapport</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">MusicScan ${quizType} Quiz</p>
          </div>
          
          <!-- Score Card -->
          <div style="background: white; padding: 24px; border-bottom: 1px solid #eee;">
            <div style="display: flex; justify-content: space-around; text-align: center;">
              <div style="flex: 1;">
                <div style="font-size: 36px; font-weight: bold; color: #7c3aed;">${percentage}%</div>
                <div style="color: #666; font-size: 14px;">Score</div>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 36px; font-weight: bold; color: #7c3aed;">${score}/${totalQuestions}</div>
                <div style="color: #666; font-size: 14px;">Correct</div>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 36px; font-weight: bold; color: #22c55e;">+${pointsEarned}</div>
                <div style="color: #666; font-size: 14px;">Punten</div>
              </div>
            </div>
          </div>
          
          <!-- Badge -->
          <div style="background: white; padding: 20px; text-align: center; border-bottom: 1px solid #eee;">
            <div style="display: inline-block; background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 12px 24px; border-radius: 99px;">
              <span style="font-size: 24px; margin-right: 8px;">${badgeEmoji}</span>
              <span style="font-weight: 600; color: #92400e;">${badge}</span>
            </div>
          </div>
          
          <!-- Questions Review -->
          <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px;">
            <h2 style="margin: 0 0 16px 0; font-size: 18px;">Antwoorden Overzicht</h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${questionsHtml}
            </table>
          </div>
          
          ${shareUrl ? `
          <!-- Share Link -->
          <div style="text-align: center; margin-top: 24px;">
            <a href="${shareUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              Bekijk & Deel je Score
            </a>
          </div>
          ` : ''}
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px; color: #666; font-size: 13px;">
            <p>Dit rapport is verzonden door MusicScan</p>
            <p><a href="https://musicscan.nl/quizzen" style="color: #7c3aed;">Speel meer quizzen op musicscan.nl</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: "MusicScan <noreply@musicscan.nl>",
      to: [email],
      subject: `🎵 Je MusicScan Quiz Rapport - ${percentage}% Score!`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Quiz report sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-quiz-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
