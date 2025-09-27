import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CuratedShow {
  id: string;
  spotify_show_id: string | null;
  name: string;
  description: string | null;
  publisher: string | null;
  image_url: string | null;
  spotify_url: string | null;
  total_episodes: number;
  is_active: boolean;
  category: string;
  curator_notes: string | null;
  feed_type?: string;
  rss_feed_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ShowEpisode {
  id: string;
  show_id: string;
  spotify_episode_id: string;
  name: string;
  description: string | null;
  audio_preview_url: string | null;
  release_date: string | null;
  duration_ms: number | null;
  spotify_url: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  type?: 'spotify' | 'rss';
}

export interface RSSEpisode {
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
  type?: 'rss';
}

export const useCuratedPodcasts = (category?: string) => {
  return useQuery({
    queryKey: ['curated-podcasts', category],
    queryFn: async () => {
      let query = supabase
        .from('spotify_curated_shows')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CuratedShow[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePodcastEpisodes = (showId: string, featured?: boolean) => {
  return useQuery({
    queryKey: ['podcast-episodes', showId, featured],
    queryFn: async () => {
      // Fetch both Spotify and RSS episodes
      const [spotifyResult, rssResult] = await Promise.all([
        // Spotify episodes
        (() => {
          let query = supabase
            .from('spotify_show_episodes')
            .select('*')
            .eq('show_id', showId);
          
          // Only filter by is_featured when explicitly requested
          if (featured !== undefined) {
            query = query.eq('is_featured', featured);
          }
          
          return query.order('release_date', { ascending: false });
        })(),
        
        // RSS episodes
        (() => {
          let query = supabase
            .from('rss_feed_episodes')
            .select('*')
            .eq('show_id', showId);
          
          // Only filter by is_featured when explicitly requested
          if (featured !== undefined) {
            query = query.eq('is_featured', featured);
          }
          
          return query.order('published_date', { ascending: false });
        })()
      ]);

      const spotifyEpisodes = (spotifyResult.data || []).map(episode => ({
        ...episode,
        type: 'spotify' as const
      }));

      const rssEpisodes = (rssResult.data || []).map(episode => ({
        ...episode,
        name: episode.title,
        release_date: episode.published_date,
        duration_ms: episode.duration_seconds ? episode.duration_seconds * 1000 : undefined,
        type: 'rss' as const
      }));

      // Combine and sort all episodes by date
      const allEpisodes = [...spotifyEpisodes, ...rssEpisodes];
      allEpisodes.sort((a, b) => {
        const dateA = new Date(a.release_date || (a as any).published_date || 0);
        const dateB = new Date(b.release_date || (b as any).published_date || 0);
        return dateB.getTime() - dateA.getTime();
      });

      return allEpisodes;
    },
    enabled: !!showId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFeaturedEpisodes = (limit = 6) => {
  return useQuery({
    queryKey: ['featured-episodes', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spotify_show_episodes')
        .select(`
          *,
          spotify_curated_shows!inner(*)
        `)
        .eq('is_featured', true)
        .eq('spotify_curated_shows.is_active', true)
        .order('release_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePodcastCategories = () => {
  return useQuery({
    queryKey: ['podcast-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spotify_curated_shows')
        .select('category')
        .eq('is_active', true);

      if (error) throw error;
      
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      return uniqueCategories.filter(Boolean);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useSearchPodcasts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke('spotify-podcast-manager', {
        body: { action: 'search_shows', query }
      });

      if (error) throw error;
      return data.shows;
    },
  });
};

export const useAddCuratedShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      spotify_show_id, 
      category, 
      curator_notes 
    }: { 
      spotify_show_id: string; 
      category?: string; 
      curator_notes?: string; 
    }) => {
      const { data, error } = await supabase.functions.invoke('spotify-podcast-manager', {
        body: { 
          action: 'add_curated_show', 
          spotify_show_id, 
          category, 
          curator_notes 
        }
      });

      if (error) throw error;
      return data.show;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curated-podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['podcast-categories'] });
    },
  });
};

export const useAddCuratedShowByUrl = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      url, 
      category, 
      curator_notes 
    }: { 
      url: string; 
      category?: string; 
      curator_notes?: string; 
    }) => {
      // Check if it's an RSS feed URL
      if (url.includes('.xml') || url.includes('rss') || url.includes('feed')) {
        // Handle RSS feed
        const { data, error } = await supabase.functions.invoke('rss-feed-parser', {
          body: {
            action: 'add_rss_show',
            params: { 
              rssUrl: url,
              name: 'RSS Podcast',
              description: 'Added from RSS feed',
              category: category || 'Algemeen'
            }
          }
        });

        if (error) throw error;
        return data;
      } else {
        // Handle Spotify URL
        const { data, error } = await supabase.functions.invoke('spotify-podcast-manager', {
          body: { 
            action: 'add_curated_show_by_url', 
            spotify_url: url, 
            category, 
            curator_notes 
          }
        });

        if (error) throw error;
        return data.show;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curated-podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['podcast-categories'] });
    },
  });
};

export const useSyncEpisodes = () => {
  const queryClient = useQueryClient();

return useMutation({
  mutationFn: async (showId: string) => {
    const { data, error } = await supabase.functions.invoke('spotify-podcast-manager', {
      body: { action: 'sync_episodes', show_id: showId }
    });

    if (error) {
      // Prefer server-provided error message when available
      const serverMsg = (data as any)?.error;
      throw new Error(serverMsg || error.message);
    }
    return data;
  },
  onSuccess: (_, showId) => {
    queryClient.invalidateQueries({ queryKey: ['podcast-episodes', showId] });
  },
});
};

export const useToggleFeaturedEpisode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ episodeId, isFeatured }: { episodeId: string; isFeatured: boolean }) => {
      const { data, error } = await supabase.functions.invoke('spotify-podcast-manager', {
        body: { 
          action: 'toggle_featured_episode', 
          episode_id: episodeId, 
          is_featured: isFeatured 
        }
      });

      if (error) throw error;
      return data.episode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast-episodes'] });
      queryClient.invalidateQueries({ queryKey: ['featured-episodes'] });
    },
  });
};