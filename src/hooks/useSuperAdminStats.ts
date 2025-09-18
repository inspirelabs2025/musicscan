import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SuperAdminStats {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalScans: number;
  scansToday: number;
  scansLast7Days: number;
  aiScans: {
    total: number;
    success: number;
    failed: number;
    pending: number;
  };
  cdScans: {
    total: number;
    withPricing: number;
  };
  vinylScans: {
    total: number;
    withPricing: number;
  };
  batchUploads: {
    total: number;
    completed: number;
    failed: number;
  };
  topArtists: Array<{
    artist: string;
    count: number;
  }>;
  topUsers: Array<{
    email: string;
    scanCount: number;
    lastActive: string;
  }>;
  recentActivity: Array<{
    type: string;
    user: string;
    timestamp: string;
    details: any;
  }>;
  errors: {
    total: number;
    last24h: number;
    recentErrors: Array<{
      message: string;
      timestamp: string;
      source: string;
    }>;
  };
  discogMatches: {
    total: number;
    withIds: number;
    avgConfidence: number;
  };
}

export const useSuperAdminStats = () => {
  return useQuery<SuperAdminStats>({
    queryKey: ['superadmin-stats'],
    queryFn: async () => {
      console.log('🔍 Fetching superadmin statistics...');

      // Get user count from profiles table
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get new users in last 7 and 30 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: newUsersLast7Days } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const { count: newUsersLast30Days } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get AI scan statistics
      const { data: aiScanData } = await supabase
        .from('ai_scan_results')
        .select('status');

      const aiScanStats = {
        total: aiScanData?.length || 0,
        success: aiScanData?.filter(s => s.status === 'completed').length || 0,
        failed: aiScanData?.filter(s => s.status === 'failed').length || 0,
        pending: aiScanData?.filter(s => s.status === 'pending').length || 0,
      };

      // Get CD scan statistics
      const { count: cdScansTotal } = await supabase
        .from('cd_scan')
        .select('*', { count: 'exact', head: true });

      const { count: cdScansWithPricing } = await supabase
        .from('cd_scan')
        .select('*', { count: 'exact', head: true })
        .not('calculated_advice_price', 'is', null);

      // Get Vinyl scan statistics
      const { count: vinylScansTotal } = await supabase
        .from('vinyl2_scan')
        .select('*', { count: 'exact', head: true });

      const { count: vinylScansWithPricing } = await supabase
        .from('vinyl2_scan')
        .select('*', { count: 'exact', head: true })
        .not('calculated_advice_price', 'is', null);

      // Get batch upload statistics
      const { data: batchData } = await supabase
        .from('batch_uploads')
        .select('status');

      const batchUploads = {
        total: batchData?.length || 0,
        completed: batchData?.filter(b => b.status === 'completed').length || 0,
        failed: batchData?.filter(b => b.status === 'failed').length || 0,
      };

      // Get scans from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [aiScansToday, cdScansToday, vinylScansToday] = await Promise.all([
        supabase.from('ai_scan_results').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('cd_scan').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('vinyl2_scan').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())
      ]);

      const scansToday = (aiScansToday.count || 0) + (cdScansToday.count || 0) + (vinylScansToday.count || 0);

      // Get top artists from AI scans
      const { data: aiArtists } = await supabase
        .from('ai_scan_results')
        .select('artist')
        .not('artist', 'is', null);

      const { data: cdArtists } = await supabase
        .from('cd_scan')
        .select('artist')
        .not('artist', 'is', null);

      const { data: vinylArtists } = await supabase
        .from('vinyl2_scan')
        .select('artist')
        .not('artist', 'is', null);

      // Combine and count artists
      const allArtists = [
        ...(aiArtists || []),
        ...(cdArtists || []),
        ...(vinylArtists || [])
      ];

      const artistCounts = allArtists.reduce((acc, item) => {
        const artist = item.artist;
        if (artist) {
          acc[artist] = (acc[artist] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topArtistsData = Object.entries(artistCounts)
        .map(([artist, count]) => ({ artist, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get top users by scan count (simplified)
      const { data: topUsersData } = await supabase
        .from('profiles')
        .select('user_id, first_name, created_at')
        .limit(50);

      // Get scan counts for each user
      const topUsers = [];
      if (topUsersData) {
        for (const user of topUsersData.slice(0, 10)) {
          const [aiCount, cdCount, vinylCount] = await Promise.all([
            supabase.from('ai_scan_results').select('*', { count: 'exact', head: true }).eq('user_id', user.user_id),
            supabase.from('cd_scan').select('*', { count: 'exact', head: true }).eq('user_id', user.user_id),
            supabase.from('vinyl2_scan').select('*', { count: 'exact', head: true }).eq('user_id', user.user_id)
          ]);

          const totalScans = (aiCount.count || 0) + (cdCount.count || 0) + (vinylCount.count || 0);
          
          if (totalScans > 0) {
            topUsers.push({
              email: user.first_name || 'Unknown',
              scanCount: totalScans,
              lastActive: user.created_at
            });
          }
        }
      }

      topUsers.sort((a, b) => b.scanCount - a.scanCount);

      // Get recent activity (simplified)
      const { data: recentAiScans } = await supabase
        .from('ai_scan_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const recentActivity = recentAiScans?.map(scan => ({
        type: 'AI Scan',
        user: scan.artist || 'Unknown',
        timestamp: scan.created_at,
        details: { status: scan.status, artist: scan.artist, title: scan.title }
      })) || [];

      // Calculate total scans
      const totalScans = (aiScanStats.total || 0) + (cdScansTotal || 0) + (vinylScansTotal || 0);

      // Get Discogs match statistics
      const { count: totalWithDiscogs } = await supabase
        .from('ai_scan_results')
        .select('*', { count: 'exact', head: true })
        .not('discogs_id', 'is', null);

      const { data: avgConfidenceData } = await supabase
        .from('ai_scan_results')
        .select('confidence_score')
        .not('confidence_score', 'is', null);

      const avgConfidence = avgConfidenceData?.length ? 
        avgConfidenceData.reduce((sum, item) => sum + (item.confidence_score || 0), 0) / avgConfidenceData.length : 0;

      return {
        totalUsers: totalUsers || 0,
        newUsersLast7Days: newUsersLast7Days || 0,
        newUsersLast30Days: newUsersLast30Days || 0,
        totalScans,
        scansToday,
        scansLast7Days: 0, // Placeholder
        aiScans: aiScanStats || { total: 0, success: 0, failed: 0, pending: 0 },
        cdScans: {
          total: cdScansTotal || 0,
          withPricing: cdScansWithPricing || 0
        },
        vinylScans: {
          total: vinylScansTotal || 0,
          withPricing: vinylScansWithPricing || 0
        },
        batchUploads: batchUploads || { total: 0, completed: 0, failed: 0 },
        topArtists: topArtistsData || [],
        topUsers,
        recentActivity,
        errors: {
          total: 0,
          last24h: 0,
          recentErrors: []
        },
        discogMatches: {
          total: totalWithDiscogs || 0,
          withIds: totalWithDiscogs || 0,
          avgConfidence: Math.round(avgConfidence * 100) / 100
        }
      };
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};