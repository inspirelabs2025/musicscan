import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ArtistStory {
  id: string;
  artist_name: string;
  slug: string;
  story_content: string;
  biography?: string;
  music_style?: string[];
  notable_albums?: string[];
  cultural_impact?: string;
  artwork_url?: string;
  is_published: boolean;
  views_count: number;
  reading_time?: number;
  word_count?: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  published_at?: string;
  is_spotlight: boolean;
  spotlight_images?: any[];
  spotlight_description?: string;
  featured_products?: string[];
}

interface UseArtistStoriesOptions {
  search?: string;
  genre?: string;
  sortBy?: 'newest' | 'popular' | 'alphabetical';
  limit?: number;
}

export const useArtistStories = (options: UseArtistStoriesOptions = {}) => {
  const { search, genre, sortBy = 'newest', limit } = options;

  return useQuery({
    queryKey: ['artist-stories', search, genre, sortBy, limit],
    queryFn: async () => {
      let query = supabase
        .from('artist_stories')
        .select('*')
        .eq('is_published', true);

      // Apply search filter
      if (search) {
        query = query.or(`artist_name.ilike.%${search}%,biography.ilike.%${search}%`);
      }

      // Apply genre filter
      if (genre) {
        query = query.contains('music_style', [genre]);
      }

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('published_at', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.order('views_count', { ascending: false });
      } else if (sortBy === 'alphabetical') {
        query = query.order('artist_name', { ascending: true });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching artist stories:', error);
        throw error;
      }

      return data as ArtistStory[];
    },
  });
};

export const useArtistStory = (slug: string) => {
  return useQuery({
    queryKey: ['artist-story', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        console.error('Error fetching artist story:', error);
        throw error;
      }

      // Increment view count
      if (data) {
        await supabase
          .from('artist_stories')
          .update({ views_count: data.views_count + 1 })
          .eq('id', data.id);
      }

      return data as ArtistStory;
    },
  });
};

export const useArtistStoriesStats = () => {
  return useQuery({
    queryKey: ['artist-stories-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('music_style')
        .eq('is_published', true);

      if (error) {
        console.error('Error fetching artist stories stats:', error);
        throw error;
      }

      // Extract unique genres
      const genres = new Set<string>();
      data.forEach(story => {
        if (story.music_style) {
          story.music_style.forEach(genre => genres.add(genre));
        }
      });

      return {
        totalStories: data.length,
        genres: Array.from(genres).sort()
      };
    },
  });
};
