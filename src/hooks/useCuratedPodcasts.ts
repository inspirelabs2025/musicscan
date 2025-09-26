import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CuratedShow {
  id: string;
  spotify_show_id: string;
  name: string;
  description: string | null;
  publisher: string | null;
  image_url: string | null;
  spotify_url: string | null;
  total_episodes: number;
  is_active: boolean;
  category: string;
  curator_notes: string | null;
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
      let query = supabase
        .from('spotify_show_episodes')
        .select('*')
        .eq('show_id', showId)
        .order('release_date', { ascending: false });

      if (featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ShowEpisode[];
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
      spotify_url, 
      category, 
      curator_notes 
    }: { 
      spotify_url: string; 
      category?: string; 
      curator_notes?: string; 
    }) => {
      const { data, error } = await supabase.functions.invoke('spotify-podcast-manager', {
        body: { 
          action: 'add_curated_show_by_url', 
          spotify_url, 
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