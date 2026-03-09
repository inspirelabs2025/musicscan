import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, Medal, ArrowRight, Zap, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizResult {
  id: string;
  score_percentage: number;
  questions_correct: number;
  questions_total: number;
  created_at: string;
}

const useQuizStats = () => {
  return useQuery({
    queryKey: ['quiz-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_results')
        .select('id, score_percentage, questions_correct, questions_total, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const results = data as QuizResult[];
      if (results.length === 0) {
        return { hasPlayed: false, totalQuizzes: 0, averageScore: 0, bestScore: 0, streak: 0, lastQuiz: null };
      }
      const totalQuizzes = results.length;
      const averageScore = Math.round(results.reduce((sum, q) => sum + q.score_percentage, 0) / totalQuizzes);
      const bestScore = Math.max(...results.map(q => q.score_percentage));
      const today = new Date(); today.setHours(0,0,0,0);
      let streak = 0; let currentDate = new Date(today);
      for (let i = 0; i < 30; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (results.some(q => { const d = new Date(q.created_at); d.setHours(0,0,0,0); return d.toISOString().split('T')[0] === dateStr; })) { streak++; } else { break; }
        currentDate.setDate(currentDate.getDate() - 1);
      }
      return { hasPlayed: true, totalQuizzes, averageScore, bestScore, streak, lastQuiz: results[0] };
    },
    staleTime: 60_000,
  });
};

export const QuizWidget = () => {
  const { data: stats, isLoading } = useQuizStats();
  const { tr } = useLanguage();
  const d = tr.dashboardUI;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" />{d.collectionQuiz}</CardTitle></CardHeader>
        <CardContent><div className="space-y-3"><Skeleton className="h-14 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-8 w-full" /></div></CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          {d.collectionQuizChallenge}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats?.hasPlayed ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">{stats.bestScore}%</div>
                <div className="text-[11px] text-muted-foreground">{d.bestScore}</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">{stats.averageScore}%</div>
                <div className="text-[11px] text-muted-foreground">{d.average}</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">{stats.streak}</div>
                <div className="text-[11px] text-muted-foreground">{d.dayStreak}</div>
              </div>
            </div>
            {stats.lastQuiz && (
              <p className="text-xs text-muted-foreground text-center">
                {d.lastQuiz}: {stats.lastQuiz.questions_correct}/{stats.lastQuiz.questions_total} ({Math.round(stats.lastQuiz.score_percentage)}%)
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-3">
            <Trophy className="w-8 h-8 text-muted-foreground/40 mx-auto mb-1.5" />
            <p className="text-sm text-muted-foreground">{d.testYourKnowledge}</p>
          </div>
        )}

        <div className="space-y-2">
          <Button asChild size="sm" className="w-full">
            <Link to="/quiz">
              <Trophy className="w-3.5 h-3.5 mr-1.5" />
              {stats?.hasPlayed ? d.newQuiz : d.startQuiz}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/quizzen">{d.allQuizzes}</Link>
          </Button>
          {stats?.hasPlayed && (
            <p className="text-[11px] text-muted-foreground text-center">
              🏆 {d.quizzesCompleted.replace('{count}', String(stats.totalQuizzes)).replace('{plural}', stats.totalQuizzes !== 1 ? 'zes' : '')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
