import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url?: string;
  total_quizzes: number;
  total_correct: number;
  total_questions: number;
  average_score: number;
  best_score: number;
  total_points: number;
  weekly_points: number;
  daily_streak: number;
}

export function useQuizLeaderboard(limit: number = 10) {
  const { data: leaderboard = [], isLoading, error } = useQuery({
    queryKey: ['quiz-leaderboard', limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data, error } = await supabase
        .from('quiz_leaderboard')
        .select(`
          user_id,
          display_name,
          total_quizzes,
          total_correct,
          total_questions,
          average_score,
          best_score,
          total_points,
          weekly_points,
          daily_streak
        `)
        .order('total_points', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
      }

      // Fetch avatar URLs from profiles
      const userIds = data?.map(d => d.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, avatar_url')
        .in('user_id', userIds);

      const avatarMap = new Map(profiles?.map(p => [p.user_id, p.avatar_url]) || []);
      
      return (data || []).map(entry => ({
        ...entry,
        avatar_url: avatarMap.get(entry.user_id) || undefined,
      }));
    },
  });

  return { leaderboard, isLoading, error };
}
