import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TimeMachineEvent {
  id: string;
  event_title: string;
  event_subtitle?: string;
  slug: string;
  artist_name: string;
  venue_name: string;
  venue_city: string;
  venue_country?: string;
  concert_date: string;
  tour_name?: string;
  historical_context?: string;
  cultural_significance?: string;
  attendance_count?: number;
  ticket_price_original?: number;
  poster_style?: string;
  color_palette?: any;
  typography_style?: string;
  story_content: string;
  setlist?: any;
  archive_photos?: any;
  audio_fragments?: any;
  press_reviews?: any;
  fan_quotes?: any;
  poster_image_url?: string;
  metal_print_image_url?: string;
  qr_code_url?: string;
  edition_size?: number;
  price_poster?: number;
  price_metal?: number;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  is_published: boolean;
  is_featured: boolean;
  views_count?: number;
  products_sold?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface UseTimeMachineEventsOptions {
  published?: boolean;
  featured?: boolean;
  artist?: string;
  limit?: number;
}

export const useTimeMachineEvents = (options: UseTimeMachineEventsOptions = {}) => {
  return useQuery({
    queryKey: ['time-machine-events', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.published !== undefined) params.append('published', String(options.published));
      if (options.featured !== undefined) params.append('featured', String(options.featured));
      if (options.artist) params.append('artist', options.artist);
      if (options.limit) params.append('limit', String(options.limit));

      const { data, error } = await supabase.functions.invoke('time-machine-events', {
        method: 'GET',
        body: Object.fromEntries(params)
      });

      if (error) throw error;
      return data.events as TimeMachineEvent[];
    },
  });
};

export const useTimeMachineEvent = (slugOrId?: string) => {
  return useQuery({
    queryKey: ['time-machine-event', slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      const param = isUuid ? 'id' : 'slug';

      const { data, error } = await supabase.functions.invoke('time-machine-events', {
        method: 'GET',
        body: { [param]: slugOrId }
      });

      if (error) throw error;
      return data.event as TimeMachineEvent;
    },
    enabled: !!slugOrId,
  });
};

export const useCreateTimeMachineEvent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Partial<TimeMachineEvent>) => {
      const { data, error } = await supabase.functions.invoke('time-machine-events', {
        method: 'POST',
        body: event
      });

      if (error) throw error;
      return data.event as TimeMachineEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-machine-events'] });
      toast({
        title: 'Success',
        description: 'Time Machine event created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTimeMachineEvent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Partial<TimeMachineEvent> & { id: string }) => {
      const { data, error } = await supabase.functions.invoke('time-machine-events', {
        method: 'PUT',
        body: event
      });

      if (error) throw error;
      return data.event as TimeMachineEvent;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-machine-events'] });
      queryClient.invalidateQueries({ queryKey: ['time-machine-event', data.id] });
      queryClient.invalidateQueries({ queryKey: ['time-machine-event', data.slug] });
      toast({
        title: 'Success',
        description: 'Time Machine event updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteTimeMachineEvent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('time-machine-events', {
        method: 'DELETE',
        body: { id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-machine-events'] });
      toast({
        title: 'Success',
        description: 'Time Machine event deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
