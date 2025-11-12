import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Anecdote {
  id: string;
  anecdote_date: string;
  subject_type: string;
  subject_name: string;
  subject_details: any;
  anecdote_title: string;
  anecdote_content: string;
  extended_content: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  reading_time: number;
  source_reference?: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
}

export const useAnecdotes = (filters?: {
  searchQuery?: string;
  subjectType?: string;
  sortBy?: 'newest' | 'oldest' | 'popular';
}) => {
  return useQuery({
    queryKey: ['anecdotes', filters],
    queryFn: async () => {
      let query = supabase
        .from('music_anecdotes')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters?.subjectType && filters.subjectType !== 'all') {
        query = query.eq('subject_type', filters.subjectType);
      }

      if (filters?.searchQuery) {
        query = query.or(
          `anecdote_title.ilike.%${filters.searchQuery}%,subject_name.ilike.%${filters.searchQuery}%`
        );
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'oldest':
          query = query.order('anecdote_date', { ascending: true });
          break;
        case 'popular':
          query = query.order('views_count', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('anecdote_date', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Anecdote[];
    },
  });
};

export const useAnecdote = (slug: string) => {
  return useQuery({
    queryKey: ['anecdote', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_anecdotes')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Increment view count
      if (data) {
        await supabase
          .from('music_anecdotes')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', data.id);
      }

      return data as Anecdote;
    },
    enabled: !!slug,
  });
};

export const useRelatedAnecdotes = (currentId: string, subjectType: string, subjectName: string) => {
  return useQuery({
    queryKey: ['related-anecdotes', currentId, subjectType, subjectName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_anecdotes')
        .select('*')
        .eq('is_active', true)
        .neq('id', currentId)
        .or(`subject_type.eq.${subjectType},subject_name.eq.${subjectName}`)
        .order('views_count', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as Anecdote[];
    },
    enabled: !!currentId,
  });
};
