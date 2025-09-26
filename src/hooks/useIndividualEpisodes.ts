import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IndividualEpisode {
  id: string;
  spotify_episode_id: string;
  name: string;
  description?: string;
  show_name: string;
  audio_preview_url?: string;
  spotify_url: string;
  release_date?: string;
  duration_ms?: number;
  is_featured: boolean;
  category: string;
  curator_notes?: string;
  created_at: string;
  updated_at: string;
}

// Fetch individual episodes
export const useIndividualEpisodes = (featured?: boolean) => {
  return useQuery({
    queryKey: ['individualEpisodes', featured],
    queryFn: async () => {
      let query = supabase
        .from('spotify_individual_episodes')
        .select('*')
        .order('created_at', { ascending: false });

      if (featured !== undefined) {
        query = query.eq('is_featured', featured);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching individual episodes:', error);
        throw error;
      }

      return data as IndividualEpisode[];
    },
  });
};

// Add individual episode
export const useAddIndividualEpisode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      spotify_url, 
      category = 'General', 
      curator_notes 
    }: { 
      spotify_url: string; 
      category?: string; 
      curator_notes?: string; 
    }) => {
      console.log('🚀 Adding individual episode:', { spotify_url, category, curator_notes });
      
      try {
        const { data, error } = await supabase.functions.invoke('spotify-podcast-manager', {
          body: {
            action: 'add_individual_episode',
            params: {
              spotify_url,
              category,
              curator_notes
            }
          }
        });

        console.log('📡 Edge function response:', { data, error });

        if (error) {
          console.error('❌ Edge function error:', error);
          throw error;
        }
        
        if (data?.error) {
          console.error('❌ Application error:', data.error);
          throw new Error(data.error);
        }

        console.log('✅ Episode added successfully:', data);
        return data;
      } catch (networkError) {
        console.error('❌ Network/request error:', networkError);
        throw networkError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['individualEpisodes'] });
      toast({
        title: 'Episode toegevoegd',
        description: 'De episode is succesvol toegevoegd aan de collectie.',
      });
    },
    onError: (error: Error) => {
      console.error('Error adding individual episode:', error);
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het toevoegen van de episode.',
        variant: 'destructive',
      });
    },
  });
};

// Toggle featured status
export const useToggleFeaturedIndividualEpisode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (episodeId: string) => {
      const { data, error } = await supabase.functions.invoke('spotify-podcast-manager', {
        body: {
          action: 'toggle_featured_individual_episode',
          params: { episode_id: episodeId }
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['individualEpisodes'] });
      toast({
        title: 'Featured status bijgewerkt',
        description: data.message,
      });
    },
    onError: (error: Error) => {
      console.error('Error toggling featured status:', error);
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het bijwerken van de featured status.',
        variant: 'destructive',
      });
    },
  });
};

// Remove individual episode
export const useRemoveIndividualEpisode = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (episodeId: string) => {
      const { data, error } = await supabase.functions.invoke('spotify-podcast-manager', {
        body: {
          action: 'remove_individual_episode',
          params: { episode_id: episodeId }
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['individualEpisodes'] });
      toast({
        title: 'Episode verwijderd',
        description: 'De episode is succesvol verwijderd uit de collectie.',
      });
    },
    onError: (error: Error) => {
      console.error('Error removing individual episode:', error);
      toast({
        title: 'Fout',
        description: error.message || 'Er is een fout opgetreden bij het verwijderen van de episode.',
        variant: 'destructive',
      });
    },
  });
};