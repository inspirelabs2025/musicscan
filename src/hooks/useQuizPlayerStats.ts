import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuizPlayerStats {
  user_id: string;
  display_name: string | null;
  total_quizzes: number;
  total_correct: number;
  total_questions: number;
  average_score: number;
  best_score: number;
  total_points: number;
  weekly_points: number;
  daily_streak: number;
  last_daily_at: string | null;
  badges_earned: string[];
}

export function useQuizPlayerStats(userId: string | undefined) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['quiz-player-stats', userId],
    queryFn: async (): Promise<QuizPlayerStats | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('quiz_leaderboard')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching quiz stats:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!userId,
  });

  return { stats, isLoading, error };
}
