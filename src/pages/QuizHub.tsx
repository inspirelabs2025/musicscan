import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { QuizHubHero } from '@/components/quiz/QuizHubHero';
import { QuizCategoryGrid } from '@/components/quiz/QuizCategoryGrid';
import { QuizLeaderboard } from '@/components/quiz/QuizLeaderboard';
import { DailyChallengeBanner } from '@/components/quiz/DailyChallengeBanner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export default function QuizHub() {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Muziek Quizzen | Test Je Kennis | MusicScan</title>
        <meta name="description" content="Test je muziekkennis met onze interactieve quizzen. Speel tegen vrienden, verdien badges en beklim het leaderboard." />
        <meta property="og:title" content="Muziek Quizzen | MusicScan" />
        <meta property="og:description" content="Test je muziekkennis met AI-gegenereerde quizzen over artiesten, albums, en muziekgeschiedenis." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <QuizHubHero />
        
        <div className="container mx-auto px-4 py-8 space-y-12">
          {/* User Stats Link */}
          {user && (
            <div className="flex justify-end">
              <Link to="/mijn-quizzen">
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Mijn Quizzen & Scores
                </Button>
              </Link>
            </div>
          )}

          {/* Daily Challenge Banner */}
          <DailyChallengeBanner />
          
          {/* Quiz Categories Grid */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Kies Je Quiz</h2>
            <QuizCategoryGrid />
          </section>
          
          {/* Leaderboard */}
          <section>
            <h2 className="text-2xl font-bold mb-6">🏆 Top Spelers</h2>
            <QuizLeaderboard limit={10} />
          </section>
        </div>
      </div>
    </>
  );
}
