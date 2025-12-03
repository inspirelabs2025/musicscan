import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, Medal, ArrowRight, Zap, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
        return {
          hasPlayed: false,
          totalQuizzes: 0,
          averageScore: 0,
          bestScore: 0,
          streak: 0,
          lastQuiz: null
        };
      }

      const totalQuizzes = results.length;
      const averageScore = Math.round(
        results.reduce((sum, quiz) => sum + quiz.score_percentage, 0) / totalQuizzes
      );
      const bestScore = Math.max(...results.map(q => q.score_percentage));
      
      // Calculate streak (consecutive days with quizzes)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let streak = 0;
      let currentDate = new Date(today);
      
      for (let i = 0; i < 30; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const hasQuizOnDay = results.some(quiz => {
          const quizDate = new Date(quiz.created_at);
          quizDate.setHours(0, 0, 0, 0);
          return quizDate.toISOString().split('T')[0] === dateStr;
        });
        
        if (hasQuizOnDay) {
          streak++;
        } else {
          break;
        }
        
        currentDate.setDate(currentDate.getDate() - 1);
      }

      return {
        hasPlayed: true,
        totalQuizzes,
        averageScore,
        bestScore,
        streak,
        lastQuiz: results[0]
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const QuizWidget = () => {
  const { data: stats, isLoading } = useQuizStats();

  if (isLoading) {
    return (
      <Card className="border-2 hover:border-vinyl-gold/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-vinyl-gold" />
            🎯 Collectie Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:border-vinyl-gold/50 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-vinyl-gold animate-pulse" />
          🎯 Collectie Quiz Challenge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats?.hasPlayed ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-vinyl-gold/10 rounded-lg">
                <div className="text-lg font-bold text-vinyl-gold">{stats.bestScore}%</div>
                <div className="text-xs text-muted-foreground">Best Score</div>
              </div>
              <div className="text-center p-2 bg-vinyl-purple/10 rounded-lg">
                <div className="text-lg font-bold text-vinyl-purple">{stats.averageScore}%</div>
                <div className="text-xs text-muted-foreground">Gemiddeld</div>
              </div>
              <div className="text-center p-2 bg-accent/10 rounded-lg">
                <div className="text-lg font-bold text-foreground">{stats.streak}</div>
                <div className="text-xs text-muted-foreground">Dag Streak</div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="flex justify-center gap-1">
              {stats.bestScore >= 90 && <Medal className="w-5 h-5 text-yellow-500" />}
              {stats.bestScore >= 75 && <Star className="w-5 h-5 text-blue-500" />}
              {stats.streak >= 3 && <Zap className="w-5 h-5 text-orange-500" />}
              {stats.totalQuizzes >= 10 && <Target className="w-5 h-5 text-green-500" />}
            </div>

            {/* Last Quiz Info */}
            {stats.lastQuiz && (
              <div className="text-center text-sm text-muted-foreground">
                Laatste quiz: {stats.lastQuiz.questions_correct}/{stats.lastQuiz.questions_total} 
                ({Math.round(stats.lastQuiz.score_percentage)}%)
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <Trophy className="w-12 h-12 text-vinyl-gold mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">
              Test je muziekkennis met een gepersonaliseerde quiz!
            </p>
            <p className="text-xs text-muted-foreground">
              Gebaseerd op jouw eigen collectie 🎵
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button asChild className="w-full bg-gradient-to-r from-vinyl-gold to-yellow-500">
            <Link to="/quiz">
              <Trophy className="w-4 h-4 mr-2" />
              {stats?.hasPlayed ? 'Nieuwe Quiz' : 'Start Quiz'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link to="/quizzen">
              🎮 Alle Quizzen
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          
          {stats?.hasPlayed && (
            <>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link to="/mijn-quizzen">
                  Bekijk Alle Scores
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  🏆 {stats.totalQuizzes} quiz{stats.totalQuizzes !== 1 ? 'zes' : ''} voltooid
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};