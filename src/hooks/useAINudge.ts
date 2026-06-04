import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabaseClient'; // Assuming supabase client is set up

interface UserAIAssage {
  ai_used_count: number;
}

const fetchUserAIAssage = async (): Promise<UserAIAssage | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Assuming a 'user_ai_usage' table with a 'user_id' and 'ai_used_count' column
  const { data, error } = await supabase
    .from('user_ai_usage')
    .select('ai_used_count')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is 'No rows found'
    console.error('Error fetching AI usage:', error);
    return null;
  }

  return data as UserAIAssage;
};

export const useAINudge = () => {
  const { data, isLoading } = useQuery<UserAIAssage | null>({
    queryKey: ['aiUsedCount'],
    queryFn: fetchUserAIAssage,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    aiUsedCount: data?.ai_used_count ?? 0,
    isLoading,
  };
};
