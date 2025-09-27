import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MusicStory {
  id: string;
  query: string;
  story_content: string;
  title: string;
  slug: string;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export const useMuziekVerhalen = (userId?: string) => {
  return useQuery({
    queryKey: ['music-stories', userId],
    queryFn: async () => {
      let query = supabase
        .from('music_stories')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MusicStory[];
    },
  });
};

export const useMuziekVerhaal = (slug: string) => {
  return useQuery({
    queryKey: ['music-story', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_stories')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data as MusicStory;
    },
    enabled: !!slug,
  });
};