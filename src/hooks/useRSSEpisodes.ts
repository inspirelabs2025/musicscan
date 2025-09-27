import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RSSEpisode {
  id: string;
  title: string;
  description?: string;
  audio_url: string;
  duration_seconds?: number;
  published_date?: string;
  episode_number?: number;
  season_number?: number;
  is_featured: boolean;
  show_name?: string;
  show_id: string;
  created_at: string;
  updated_at: string;
}

export const useRSSEpisodes = (showId?: string, featured?: boolean) => {
  return useQuery({
    queryKey: ['rss-episodes', showId, featured],
    queryFn: async () => {
      let query = supabase
        .from('rss_feed_episodes')
        .select(`
          *,
          spotify_curated_shows!inner(name)
        `);

      if (showId) {
        query = query.eq('show_id', showId);
      }

      if (featured !== undefined) {
        query = query.eq('is_featured', featured);
      }

      const { data, error } = await query.order('published_date', { ascending: false });

      if (error) {
        console.error('Error fetching RSS episodes:', error);
        throw error;
      }

      return data?.map(episode => ({
        ...episode,
        show_name: episode.spotify_curated_shows?.name
      })) || [];
    },
    enabled: showId ? !!showId : true,
  });
};

export const useSyncRSSFeed = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ showId, rssUrl }: { showId: string; rssUrl: string }) => {
      const { data, error } = await supabase.functions.invoke('rss-feed-parser', {
        body: {
          action: 'sync_rss_feed',
          params: { showId, rssUrl }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rss-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['podcast-episodes'] });
      toast.success('RSS feed synced successfully!');
    },
    onError: (error) => {
      console.error('Failed to sync RSS feed:', error);
      toast.error('Failed to sync RSS feed. Please try again.');
    },
  });
};

export const useToggleRSSEpisodeFeatured = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ episodeId }: { episodeId: string }) => {
      const { data, error } = await supabase.functions.invoke('rss-feed-parser', {
        body: {
          action: 'toggle_rss_episode_featured',
          params: { episodeId }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rss-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['podcast-episodes'] });
      toast.success('Episode featured status updated!');
    },
    onError: (error) => {
      console.error('Failed to toggle episode featured status:', error);
      toast.error('Failed to update episode. Please try again.');
    },
  });
};