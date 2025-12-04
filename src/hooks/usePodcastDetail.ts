import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PodcastDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  author: string | null;
  artwork_url: string | null;
  website_url: string | null;
  language: string | null;
  is_published: boolean;
  total_listens: number;
  created_at: string;
  updated_at: string;
}

export interface PodcastEpisodeDetail {
  id: string;
  podcast_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  audio_url: string;
  audio_duration_seconds: number | null;
  episode_artwork_url: string | null;
  season_number: number | null;
  episode_number: number | null;
  is_published: boolean;
  published_at: string | null;
  views_count: number;
  created_at: string;
}

export function usePodcastBySlug(podcastSlug: string | undefined) {
  return useQuery({
    queryKey: ['podcast', podcastSlug],
    queryFn: async () => {
      if (!podcastSlug) return null;
      
      const { data, error } = await supabase
        .from('own_podcasts')
        .select('*')
        .eq('slug', podcastSlug)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      return data as PodcastDetail | null;
    },
    enabled: !!podcastSlug,
  });
}

export function usePodcastEpisodes(podcastId: string | undefined) {
  return useQuery({
    queryKey: ['podcast-episodes', podcastId],
    queryFn: async () => {
      if (!podcastId) return [];
      
      const { data, error } = await supabase
        .from('own_podcast_episodes')
        .select('*')
        .eq('podcast_id', podcastId)
        .eq('is_published', true)
        .order('season_number', { ascending: false })
        .order('episode_number', { ascending: false });

      if (error) throw error;
      return (data || []) as PodcastEpisodeDetail[];
    },
    enabled: !!podcastId,
  });
}

export function usePodcastEpisodeBySlug(podcastSlug: string | undefined, episodeSlug: string | undefined) {
  return useQuery({
    queryKey: ['podcast-episode', podcastSlug, episodeSlug],
    queryFn: async () => {
      if (!podcastSlug || !episodeSlug) return null;
      
      // First get the podcast
      const { data: podcast, error: podcastError } = await supabase
        .from('own_podcasts')
        .select('id, name, slug, artwork_url, author')
        .eq('slug', podcastSlug)
        .maybeSingle();

      if (podcastError) throw podcastError;
      if (!podcast) return null;

      // Then get the episode
      const { data: episode, error: episodeError } = await supabase
        .from('own_podcast_episodes')
        .select('*')
        .eq('podcast_id', podcast.id)
        .eq('slug', episodeSlug)
        .eq('is_published', true)
        .maybeSingle();

      if (episodeError) throw episodeError;
      if (!episode) return null;

      // Increment view count
      await supabase
        .from('own_podcast_episodes')
        .update({ views_count: (episode.views_count || 0) + 1 })
        .eq('id', episode.id);

      return {
        episode: episode as PodcastEpisodeDetail,
        podcast: podcast as { id: string; name: string; slug: string; artwork_url: string | null; author: string | null },
      };
    },
    enabled: !!podcastSlug && !!episodeSlug,
  });
}

export function useRelatedEpisodes(podcastId: string | undefined, currentEpisodeId: string | undefined, limit = 4) {
  return useQuery({
    queryKey: ['related-episodes', podcastId, currentEpisodeId, limit],
    queryFn: async () => {
      if (!podcastId || !currentEpisodeId) return [];
      
      const { data, error } = await supabase
        .from('own_podcast_episodes')
        .select('id, title, slug, audio_duration_seconds, season_number, episode_number, episode_artwork_url')
        .eq('podcast_id', podcastId)
        .eq('is_published', true)
        .neq('id', currentEpisodeId)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!podcastId && !!currentEpisodeId,
  });
}
