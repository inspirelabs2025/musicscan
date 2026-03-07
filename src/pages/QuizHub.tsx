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
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Quiz",
          "name": "MusicScan Dagelijkse Muziekquiz",
          "description": "Test je muziekkennis met de dagelijkse muziekquiz.",
          "educationalLevel": "beginner",
          "provider": { "@type": "Organization", "name": "MusicScan" }
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.musicscan.app" },
            { "@type": "ListItem", "position": 2, "name": "Muziekquiz", "item": "https://www.musicscan.app/quizzen" }
          ]
        })}</script>
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

          {/* SEO Content Block */}
          <section className="text-muted-foreground text-sm opacity-70 max-w-3xl mx-auto text-center py-8">
            <p>De MusicScan Muziekquiz test je kennis over artiesten, albums en muziekgeschiedenis. Speel de dagelijkse challenge, verdien punten en beklim het leaderboard. Van pop en rock tot jazz en klassiek — elke dag nieuwe vragen.</p>
          </section>
        </div>
      </div>
    </>
  );
}
