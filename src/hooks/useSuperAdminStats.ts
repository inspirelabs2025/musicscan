import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SuperAdminStats {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  avgDailyUsers: number;
  totalScans: number;
  aiScans: number;
  aiScansWithPricing: number;
  aiScansPending: number;
  aiScansFailed: number;
  cdScans: number;
  cdScansWithPricing: number;
  vinylScans: number;
  vinylScansWithPricing: number;
  batchUploads: number;
  scansToday: number;
  topArtists: Array<{
    artist: string;
    count: number;
  }>;
  topUsers: Array<{
    user_id: string;
    email: string;
    first_name: string;
    scan_count: number;
  }>;
  recentActivity: Array<{
    type: string;
    artist: string | null;
    title: string | null;
    created_at: string;
    user_id: string;
  }>;
  discogsMatches: number;
  avgConfidence: number;
  totalErrors: number;
  uniqueArtists: number;
}

export const useSuperAdminStats = () => {
  console.log('🔍 useSuperAdminStats: Hook starting...');
  
  return useQuery<SuperAdminStats>({
    queryKey: ['superadmin-stats'],
    queryFn: async () => {
      console.log('🔍 useSuperAdminStats: Calling superadmin edge function...');

      // Call the superadmin-stats edge function
      const { data, error } = await supabase.functions.invoke('superadmin-stats', {
        body: {}
      });

      if (error) {
        console.error('❌ useSuperAdminStats: Edge function error:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ useSuperAdminStats: No data returned from edge function');
        throw new Error('No data returned from superadmin stats function');
      }

      console.log('✅ useSuperAdminStats: Successfully received data:', {
        totalUsers: data.totalUsers,
        totalScans: data.totalScans,
        topArtistsCount: data.topArtists?.length || 0
      });

      return data as SuperAdminStats;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};