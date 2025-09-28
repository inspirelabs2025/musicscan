import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserAlbumCount {
  user_id: string;
  album_count: number;
}

export const useUserAlbumCounts = (userIds: string[]) => {
  return useQuery<UserAlbumCount[]>({
    queryKey: ['user-album-counts', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];

      // Get counts from all scan tables for each user
      const albumCounts = await Promise.all(
        userIds.map(async (userId) => {
          const [cdScans, vinylScans, aiScans] = await Promise.all([
            supabase
              .from('cd_scan')
              .select('id')
              .eq('user_id', userId),
            supabase
              .from('vinyl2_scan')
              .select('id')
              .eq('user_id', userId),
            supabase
              .from('ai_scan_results')
              .select('id')
              .eq('user_id', userId)
              .eq('status', 'completed')
          ]);

          const totalCount = 
            (cdScans.data?.length || 0) + 
            (vinylScans.data?.length || 0) + 
            (aiScans.data?.length || 0);

          return {
            user_id: userId,
            album_count: totalCount
          };
        })
      );

      return albumCounts;
    },
    enabled: userIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};