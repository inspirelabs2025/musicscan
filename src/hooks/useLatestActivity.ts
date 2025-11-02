import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  type: 'scan' | 'forum' | 'news';
  title: string;
  user?: string;
  created_at: string;
  icon: string;
}

export const useLatestActivity = () => {
  return useQuery({
    queryKey: ['latest-activity'],
    queryFn: async () => {
      const activities: ActivityItem[] = [];

      // Get latest scans
      const { data: scans } = await supabase
        .from('unified_scans')
        .select('id, artist, title, created_at, user_id, profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(3);

      if (scans) {
        scans.forEach((scan: any) => {
          activities.push({
            id: scan.id,
            type: 'scan',
            title: `${scan.profiles?.display_name || 'Someone'} added ${scan.artist} - ${scan.title}`,
            user: scan.profiles?.display_name,
            created_at: scan.created_at,
            icon: '🎵'
          });
        });
      }

      // Get latest forum topics
      const { data: topics } = await supabase
        .from('forum_topics')
        .select('id, title, created_at, created_by, profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(2);

      if (topics) {
        topics.forEach((topic: any) => {
          activities.push({
            id: topic.id,
            type: 'forum',
            title: `💬 New discussion: ${topic.title}`,
            user: topic.profiles?.display_name,
            created_at: topic.created_at,
            icon: '💬'
          });
        });
      }

      // Sort by date
      activities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return activities.slice(0, 5);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
