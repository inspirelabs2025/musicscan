import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { ArtistStory } from "./useArtistStories";

interface GenerateSpotlightParams {
  artistName: string;
  initialText?: string;
}

export const useArtistSpotlights = (options: { 
  published?: boolean;
  limit?: number;
} = {}) => {
  const { published = true, limit } = options;

  return useQuery({
    queryKey: ['artist-spotlights', published, limit],
    queryFn: async () => {
      let query = supabase
        .from('artist_stories')
        .select('*')
        .eq('is_spotlight', true);

      if (published) {
        query = query.eq('is_published', true);
      }

      query = query.order('published_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching spotlights:', error);
        throw error;
      }

      return data as ArtistStory[];
    },
  });
};

export const useArtistSpotlight = (slug: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['artist-spotlight', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('*')
        .eq('slug', slug)
        .eq('is_spotlight', true)
        .single();

      if (error) {
        console.error('Error fetching spotlight:', error);
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
    enabled: options?.enabled !== false && !!slug,
  });
};

export const useArtistSpotlightById = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['artist-spotlight-by-id', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_stories')
        .select('*')
        .eq('id', id)
        .eq('is_spotlight', true)
        .single();

      if (error) {
        console.error('Error fetching spotlight by id:', error);
        throw error;
      }

      return data as ArtistStory;
    },
    enabled: options?.enabled !== false && !!id,
  });
};

export const useGenerateSpotlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ artistName, initialText }: GenerateSpotlightParams) => {
      const { data, error } = await supabase.functions.invoke('generate-artist-spotlight', {
        body: { artistName, initialText }
      });

      // Handle 409 duplicate gracefully
      if (error instanceof FunctionsHttpError) {
        try {
          const errorBody = await error.context.json();
          // If it's a duplicate, return the payload instead of throwing
          if (errorBody?.code === 'DUPLICATE') {
            return errorBody; // { success: false, code: 'DUPLICATE', existing_id, error }
          }
        } catch (jsonError) {
          // If we can't parse JSON, throw original error
          throw error;
        }
      }

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-spotlights'] });
    },
  });
};

export const useUpdateSpotlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<ArtistStory> 
    }) => {
      const { data, error } = await supabase
        .from('artist_stories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['artist-spotlights'] });
      queryClient.invalidateQueries({ queryKey: ['artist-spotlight', data.slug] });
    },
  });
};

export const useDeleteSpotlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('artist_stories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-spotlights'] });
    },
  });
};

interface FormatSpotlightParams {
  artistName: string;
  fullText: string;
}

export const useFormatSpotlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ artistName, fullText }: FormatSpotlightParams) => {
      const { data, error } = await supabase.functions.invoke('format-spotlight-text', {
        body: { artistName, fullText }
      });

      // Handle 409 duplicate - check error context first
      if (error) {
        if (error instanceof FunctionsHttpError) {
          const status = error.context?.status;
          
          // Handle 409 Conflict (duplicate)
          if (status === 409) {
            try {
              const errorBody = await error.context.json();
              if (errorBody?.code === 'DUPLICATE') {
                return {
                  success: false,
                  code: 'DUPLICATE',
                  existing_id: errorBody.existing_id
                };
              }
            } catch (jsonError) {
              console.error('Failed to parse 409 response:', jsonError);
            }
          }
        }
        
        // For all other errors, throw
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-spotlights'] });
    },
  });
};
