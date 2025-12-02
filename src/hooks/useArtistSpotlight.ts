import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { ArtistStory } from "./useArtistStories";

interface GenerateSpotlightParams {
  artistName: string;
  initialText?: string;
  force?: boolean;
}

// Helper function to extract a clean intro from biography or story content
export const extractSpotlightIntro = (spotlight: ArtistStory): string => {
  if (spotlight.spotlight_description?.trim()) return spotlight.spotlight_description.trim();

  const raw = (spotlight.biography || spotlight.story_content || '').trim();
  if (!raw) return 'Ontdek het verhaal van deze legendarische artiest.';

  // Strip common markdown artifacts
  const noMd = raw
    .replace(/^#+\s+/gm, '') // headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/_([^_]+)_/g, '$1') // italic alt
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // links
    .replace(/\s+/g, ' ')
    .trim();

  // First 2 sentences or max 220 chars
  const sentences = noMd.match(/[^.!?]+[.!?]+/g) || [noMd];
  let intro = sentences.slice(0, 2).join(' ').trim();
  if (intro.length > 220) intro = intro.slice(0, 217) + '...';

  return intro || 'Ontdek het verhaal van deze legendarische artiest.';
};

// Helper to pick image URL from story_content only (not uploads/artwork_url)
export const getSpotlightImageUrl = (spotlight: ArtistStory): string | null => {
  const md = spotlight.story_content || '';
  
  // Try markdown image syntax: ![alt](url)
  const mdImg = md.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (mdImg?.[1]?.startsWith('http')) return mdImg[1];
  
  // Try plain URLs ending in image extensions
  const plainImg = md.match(/https?:[^\s)]+\.(png|jpg|jpeg|webp|gif)/i);
  if (plainImg?.[0]) return plainImg[0];
  
  // No image found in text - return null (show fallback)
  return null;
};

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

      // Order by created_at for admin view (includes unpublished), published_at for public
      query = query.order('created_at', { ascending: false });

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
        .maybeSingle();

      if (error) {
        console.error('Error fetching spotlight by id:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Spotlight niet gevonden. Ververs de pagina om de nieuwste versie te laden.');
      }

      return data as ArtistStory;
    },
    enabled: options?.enabled !== false && !!id,
  });
};

export const useGenerateSpotlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ artistName, initialText, force }: GenerateSpotlightParams) => {
      const { data, error } = await supabase.functions.invoke('generate-artist-spotlight', {
        body: { artistName, initialText, force }
      });

      // Handle 409 duplicate gracefully
      if (error) {
        // Check if we got a duplicate response in the data
        if (data?.code === 'DUPLICATE') {
          return data;
        }
        
        // Try to extract error details from FunctionsHttpError
        if (error instanceof FunctionsHttpError && error.context) {
          try {
            // Clone response to avoid "body already consumed" issues
            const clonedResponse = error.context.clone?.() || error.context;
            const errorText = await clonedResponse.text();
            
            // Try to parse as JSON
            try {
              const errorBody = JSON.parse(errorText);
              if (errorBody?.code === 'DUPLICATE') {
                return errorBody;
              }
            } catch {
              // Not JSON, use text as error message
              throw new Error(errorText || error.message);
            }
          } catch (parseError) {
            // If parsing fails, throw original error
            throw error;
          }
        }
        
        throw error;
      }
      
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
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Spotlight niet gevonden. Mogelijk is deze verwijderd of opnieuw aangemaakt. Ververs de pagina.');
      }
      
      return data[0];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['artist-spotlights'] });
      queryClient.invalidateQueries({ queryKey: ['artist-spotlight', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['artist-spotlight-by-id', data.id] });
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

export const useAddImagesToSpotlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (spotlightId: string) => {
      const { data, error } = await supabase.functions.invoke('add-images-to-spotlight', {
        body: { spotlightId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-spotlight'] });
      queryClient.invalidateQueries({ queryKey: ['artist-spotlight-by-id'] });
    },
  });
};

export const useGenerateSpotlightImages = () => {
  return useMutation({
    mutationFn: async (spotlightId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-spotlight-images', {
        body: { spotlightId }
      });

      if (error) throw error;
      return data;
    },
  });
};

export const useInsertImagesToSpotlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ spotlightId, images }: { spotlightId: string; images: any[] }) => {
      const { data, error } = await supabase.functions.invoke('insert-images-to-spotlight', {
        body: { spotlightId, images }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-spotlight'] });
      queryClient.invalidateQueries({ queryKey: ['artist-spotlight-by-id'] });
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

      // Handle errors
      if (error) {
        // Check if we got a duplicate response in the data
        if (data?.code === 'DUPLICATE') {
          return data;
        }
        
        if (error instanceof FunctionsHttpError && error.context) {
          try {
            const clonedResponse = error.context.clone?.() || error.context;
            const errorText = await clonedResponse.text();
            
            try {
              const errorBody = JSON.parse(errorText);
              if (errorBody?.code === 'DUPLICATE') {
                return {
                  success: false,
                  code: 'DUPLICATE',
                  existing_id: errorBody.existing_id
                };
              }
            } catch {
              throw new Error(errorText || error.message);
            }
          } catch (parseError) {
            throw error;
          }
        }
        
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-spotlights'] });
    },
  });
};
