import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuizLeaderboard } from '@/hooks/useQuizLeaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuizLeaderboardProps {
  limit?: number;
  showTitle?: boolean;
}

export function QuizLeaderboard({ limit = 10, showTitle = false }: QuizLeaderboardProps) {
  const { leaderboard, isLoading } = useQuizLeaderboard(limit);
  const { tr } = useLanguage();
  const q = tr.quizGameUI;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="w-16 h-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 text-center text-sm text-muted-foreground">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-amber-600/20 to-orange-500/10 border-amber-600/30';
      default: return 'bg-card hover:bg-muted/50';
    }
  };

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {q.leaderboard}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showTitle ? 'pt-0' : 'p-6'}>
        {leaderboard.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{q.noScoresYet}</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((player, index) => (
              <div key={player.user_id} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${getRankStyle(index + 1)}`}>
                <div className="flex items-center justify-center w-8">{getRankIcon(index + 1)}</div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={player.avatar_url} />
                  <AvatarFallback>{player.display_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.display_name || q.anonymous}</p>
                  <p className="text-xs text-muted-foreground">{player.total_quizzes} {q.quizzesPlayed} • {player.average_score?.toFixed(0)}% {q.avg}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{(player.total_points || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{q.points}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
