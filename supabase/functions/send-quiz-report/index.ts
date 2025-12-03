import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { QuizReportEmail } from './_templates/quiz-report.tsx';

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

    // Render React Email template to HTML
    const emailHtml = await renderAsync(
      React.createElement(QuizReportEmail, {
        score,
        totalQuestions,
        percentage,
        quizType,
        badge,
        badgeEmoji,
        questions,
        pointsEarned,
        shareUrl
      })
    );

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
