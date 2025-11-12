import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Single {
  id: string;
  query: string;
  story_content: string;
  title: string;
  slug: string;
  views_count: number;
  created_at: string;
  updated_at: string;
  yaml_frontmatter?: any;
  social_post?: string;
  reading_time?: number;
  word_count?: number;
  meta_title?: string;
  meta_description?: string;
  artist?: string;
  single_name?: string;
  year?: number;
  label?: string;
  catalog?: string;
  genre?: string;
  styles?: string[];
  tags?: string[];
  is_published: boolean;
  user_id: string;
  artwork_url?: string;
}

export const useSingles = () => {
  return useQuery({
    queryKey: ['singles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_stories')
        .select('*')
        .eq('is_published', true)
        .not('single_name', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Single[];
    },
  });
};

export const useSingle = (slug: string) => {
  return useQuery({
    queryKey: ['single', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_stories')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .not('single_name', 'is', null)
        .single();

      if (error) throw error;
      return data as Single;
    },
    enabled: !!slug,
  });
};
