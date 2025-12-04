import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OwnPodcast {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  artwork_url: string | null;
  author: string;
  owner_name: string;
  owner_email: string;
  language: string;
  category: string;
  subcategory: string | null;
  explicit: boolean;
  is_published: boolean;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnPodcastEpisode {
  id: string;
  podcast_id: string;
  title: string;
  description: string | null;
  audio_url: string;
  audio_file_size: number | null;
  audio_duration_seconds: number | null;
  episode_number: number | null;
  season_number: number | null;
  episode_type: string;
  artwork_url: string | null;
  transcript: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePodcastInput {
  name: string;
  description?: string;
  slug: string;
  artwork_url?: string;
  author?: string;
  owner_name?: string;
  owner_email?: string;
  language?: string;
  category?: string;
  subcategory?: string;
  explicit?: boolean;
}

export interface CreateEpisodeInput {
  podcast_id: string;
  title: string;
  description?: string;
  audio_url: string;
  audio_file_size?: number;
  audio_duration_seconds?: number;
  episode_number?: number;
  season_number?: number;
  artwork_url?: string;
}

// Fetch all own podcasts
export function useOwnPodcasts() {
  return useQuery({
    queryKey: ['own-podcasts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('own_podcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OwnPodcast[];
    },
  });
}

// Fetch episodes for a podcast
export function useOwnPodcastEpisodes(podcastId: string | null) {
  return useQuery({
    queryKey: ['own-podcast-episodes', podcastId],
    queryFn: async () => {
      if (!podcastId) return [];
      
      const { data, error } = await supabase
        .from('own_podcast_episodes')
        .select('*')
        .eq('podcast_id', podcastId)
        .order('episode_number', { ascending: false });

      if (error) throw error;
      return data as OwnPodcastEpisode[];
    },
    enabled: !!podcastId,
  });
}

// Create podcast mutation
export function useCreatePodcast() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreatePodcastInput) => {
      const { data, error } = await supabase
        .from('own_podcasts')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as OwnPodcast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['own-podcasts'] });
      toast({
        title: 'Podcast aangemaakt',
        description: 'De podcast is succesvol aangemaakt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update podcast mutation
export function useUpdatePodcast() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OwnPodcast> & { id: string }) => {
      const { data, error } = await supabase
        .from('own_podcasts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as OwnPodcast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['own-podcasts'] });
      toast({
        title: 'Podcast bijgewerkt',
        description: 'De podcast is succesvol bijgewerkt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete podcast mutation
export function useDeletePodcast() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('own_podcasts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['own-podcasts'] });
      toast({
        title: 'Podcast verwijderd',
        description: 'De podcast is succesvol verwijderd.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Create episode mutation
export function useCreateEpisode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateEpisodeInput) => {
      const { data, error } = await supabase
        .from('own_podcast_episodes')
        .insert({
          ...input,
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as OwnPodcastEpisode;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['own-podcast-episodes', variables.podcast_id] });
      toast({
        title: 'Episode toegevoegd',
        description: 'De episode is succesvol toegevoegd.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update episode mutation
export function useUpdateEpisode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, podcast_id, ...updates }: Partial<OwnPodcastEpisode> & { id: string; podcast_id: string }) => {
      const { data, error } = await supabase
        .from('own_podcast_episodes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, podcast_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['own-podcast-episodes', result.podcast_id] });
      toast({
        title: 'Episode bijgewerkt',
        description: 'De episode is succesvol bijgewerkt.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Delete episode mutation
export function useDeleteEpisode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, podcast_id }: { id: string; podcast_id: string }) => {
      const { error } = await supabase
        .from('own_podcast_episodes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { podcast_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['own-podcast-episodes', result.podcast_id] });
      toast({
        title: 'Episode verwijderd',
        description: 'De episode is succesvol verwijderd.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Upload audio file
export async function uploadPodcastAudio(file: File, podcastSlug: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${podcastSlug}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('podcast-audio')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('podcast-audio')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Upload podcast artwork
export async function uploadPodcastArtwork(file: File, podcastSlug: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `artwork/${podcastSlug}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('podcast-audio')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('podcast-audio')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Generate RSS feed URL
export function getRSSFeedUrl(podcastSlug: string): string {
  const supabaseUrl = 'https://ssxbpyqnjfiyubsuonar.supabase.co';
  return `${supabaseUrl}/functions/v1/generate-podcast-rss?podcast=${podcastSlug}`;
}
