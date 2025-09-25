import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserStats {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
}

export const useUserStats = () => {
  return useQuery<UserStats>({
    queryKey: ['user-stats', 'public'],
    queryFn: async () => {
      // Use RPC function to get all public user statistics
      const { data, error } = await supabase.rpc('get_public_user_stats');

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;

      return {
        totalUsers: row?.total_users ?? 0,
        newUsersLast7Days: row?.new_users_last_7_days ?? 0,
        newUsersLast30Days: row?.new_users_last_30_days ?? 0,
      };
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};