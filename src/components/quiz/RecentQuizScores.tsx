import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, ChevronRight, Star } from 'lucide-react';
import { useUserQuizResults } from '@/hooks/useUserQuizResults';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface RecentQuizScoresProps {
  userId: string;
  limit?: number;
}

function getBadgeForScore(percentage: number) {
  if (percentage === 100) return { emoji: '🏆', label: 'Perfect', color: 'bg-yellow-500/20 text-yellow-600' };
  if (percentage >= 80) return { emoji: '🌟', label: 'Excellent', color: 'bg-green-500/20 text-green-600' };
  if (percentage >= 60) return { emoji: '👍', label: 'Goed', color: 'bg-blue-500/20 text-blue-600' };
  if (percentage >= 40) return { emoji: '📚', label: 'Oefenen', color: 'bg-orange-500/20 text-orange-600' };
  return { emoji: '💪', label: 'Blijf proberen', color: 'bg-muted text-muted-foreground' };
}

export function RecentQuizScores({ userId, limit = 5 }: RecentQuizScoresProps) {
  const { data: quizResults, isLoading } = useUserQuizResults(userId);
  
  const recentResults = React.useMemo(() => {
    if (!quizResults) return [];
    return quizResults.slice(0, limit);
  }, [quizResults, limit]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Recente Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!recentResults || recentResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Recente Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-4">
            Je hebt nog geen quizzen gespeeld
          </p>
          <p className="text-sm text-muted-foreground">
            Kies hieronder een quiz om te beginnen!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Recente Scores
        </CardTitle>
        <Link to="/mijn-quizzen">
          <Button variant="ghost" size="sm" className="gap-1">
            Alle scores
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentResults.map((result) => {
          const badge = getBadgeForScore(result.score_percentage);
          
          return (
            <div 
              key={result.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{badge.emoji}</div>
                <div>
                  <p className="font-medium">{result.quiz_type}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(result.created_at), { 
                      addSuffix: true, 
                      locale: nl 
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold">{result.score_percentage}%</p>
                  <p className="text-xs text-muted-foreground">
                    {result.questions_correct}/{result.questions_total}
                  </p>
                </div>
                <Badge className={badge.color}>
                  {badge.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
