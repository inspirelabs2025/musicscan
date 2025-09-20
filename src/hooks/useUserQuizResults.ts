import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserQuizResult {
  id: string;
  quiz_type: string;
  questions_total: number;
  questions_correct: number;
  score_percentage: number;
  time_taken_seconds: number;
  created_at: string;
  quiz_data: any;
}

export const useUserQuizResults = (userId: string) => {
  return useQuery({
    queryKey: ["user-quiz-results", userId],
    queryFn: async (): Promise<UserQuizResult[]> => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select(`
          id,
          quiz_type,
          questions_total,
          questions_correct,
          score_percentage,
          time_taken_seconds,
          created_at,
          quiz_data
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};