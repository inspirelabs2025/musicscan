import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserStats {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
}

export const useUserStats = () => {
  return useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: async () => {
      // Get total users count (only public profiles)
      const { count: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true);

      if (totalError) throw totalError;

      // Get new users in last 7 days (only public profiles)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: newUsersLast7Days, error: last7Error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (last7Error) throw last7Error;

      // Get new users in last 30 days (only public profiles)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: newUsersLast30Days, error: last30Error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (last30Error) throw last30Error;

      return {
        totalUsers: totalUsers || 0,
        newUsersLast7Days: newUsersLast7Days || 0,
        newUsersLast30Days: newUsersLast30Days || 0,
      };
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};