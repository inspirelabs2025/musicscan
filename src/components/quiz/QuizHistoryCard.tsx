import React from 'react';
import { Trophy, Clock, Share2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { UserQuizResult } from '@/hooks/useUserQuizResults';
import { Link } from 'react-router-dom';

interface QuizHistoryCardProps {
  result: UserQuizResult;
}

const getBadgeInfo = (percentage: number) => {
  if (percentage >= 90) return { emoji: '🏆', title: 'Quiz Master', color: 'bg-yellow-500/20 text-yellow-600' };
  if (percentage >= 75) return { emoji: '🥇', title: 'Expert', color: 'bg-blue-500/20 text-blue-600' };
  if (percentage >= 60) return { emoji: '🥈', title: 'Gevorderd', color: 'bg-green-500/20 text-green-600' };
  if (percentage >= 40) return { emoji: '🥉', title: 'Beginner', color: 'bg-orange-500/20 text-orange-600' };
  return { emoji: '💪', title: 'Nieuweling', color: 'bg-gray-500/20 text-gray-600' };
};

const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return 'text-yellow-500';
  if (percentage >= 75) return 'text-blue-500';
  if (percentage >= 60) return 'text-green-500';
  if (percentage >= 40) return 'text-orange-500';
  return 'text-gray-500';
};

export function QuizHistoryCard({ result }: QuizHistoryCardProps) {
  const badge = getBadgeInfo(result.score_percentage);
  const scoreColor = getScoreColor(result.score_percentage);
  const shareToken = result.quiz_data?.share_token;
  
  const formattedDate = format(new Date(result.created_at), 'd MMMM yyyy, HH:mm', { locale: nl });
  const formattedTime = result.time_taken_seconds 
    ? `${Math.floor(result.time_taken_seconds / 60)}:${String(result.time_taken_seconds % 60).padStart(2, '0')}`
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Badge */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${badge.color}`}>
            <span className="text-2xl">{badge.emoji}</span>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{result.quiz_type}</h3>
              <Badge variant="secondary" className="text-xs">
                {badge.title}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formattedDate}</span>
              {formattedTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formattedTime}
                </span>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="text-right">
            <p className={`text-2xl font-bold ${scoreColor}`}>
              {result.score_percentage}%
            </p>
            <p className="text-sm text-muted-foreground">
              {result.questions_correct}/{result.questions_total}
            </p>
          </div>

          {/* Actions */}
          {shareToken && (
            <Link to={`/quiz/result/${shareToken}`}>
              <Button variant="ghost" size="icon">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
