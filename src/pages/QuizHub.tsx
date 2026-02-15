import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { QuizHubHero } from '@/components/quiz/QuizHubHero';
import { QuizCategoryGrid } from '@/components/quiz/QuizCategoryGrid';
import { QuizLeaderboard } from '@/components/quiz/QuizLeaderboard';
import { DailyChallengeBanner } from '@/components/quiz/DailyChallengeBanner';
import { RecentQuizScores } from '@/components/quiz/RecentQuizScores';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function QuizHub() {
  const { user } = useAuth();
  const { tr } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{tr.quiz.metaTitle}</title>
        <meta name="description" content={tr.quiz.metaDescription} />
        <meta property="og:title" content={tr.quiz.ogTitle} />
        <meta property="og:description" content={tr.quiz.ogDescription} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <QuizHubHero />
        
        <div className="container mx-auto px-4 py-8 space-y-12">
          {user && (
            <div className="flex justify-end">
              <Link to="/mijn-quizzen">
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {tr.quiz.myQuizzesScores}
                </Button>
              </Link>
            </div>
          )}

          <DailyChallengeBanner />

          {user && (
            <section>
              <RecentQuizScores userId={user.id} limit={5} />
            </section>
          )}
          
          <section>
            <h2 className="text-2xl font-bold mb-6">{tr.quiz.chooseYourQuiz}</h2>
            <QuizCategoryGrid />
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-6">{tr.quiz.topPlayers}</h2>
            <QuizLeaderboard limit={10} />
          </section>
        </div>
      </div>
    </>
  );
}
