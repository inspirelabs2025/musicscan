import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const FUNCTIONS_BASE = 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4';
const defaultHeaders = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
};

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
  original_poster_url?: string;
  poster_source?: 'ai' | 'original';
  original_poster_metadata?: {
    year?: string;
    source?: string;
    condition?: string;
  };
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

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${FUNCTIONS_BASE}/time-machine-events${queryString}`, {
        method: 'GET',
        headers: defaultHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch time machine events');
      }
      return (json.events || []) as TimeMachineEvent[];
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

      const res = await fetch(`${FUNCTIONS_BASE}/time-machine-events?${param}=${encodeURIComponent(slugOrId)}`, {
        method: 'GET',
        headers: defaultHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(json.error || 'Failed to fetch time machine event');
      }
      return json.event as TimeMachineEvent;
    },
    enabled: !!slugOrId,
  });
};

export const useCreateTimeMachineEvent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Partial<TimeMachineEvent>) => {
      const res = await fetch(`${FUNCTIONS_BASE}/time-machine-events`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(event),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create time machine event');
      }
      return json.event as TimeMachineEvent;
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
      const res = await fetch(`${FUNCTIONS_BASE}/time-machine-events?id=${encodeURIComponent(event.id)}`, {
        method: 'PUT',
        headers: defaultHeaders,
        body: JSON.stringify(event),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update time machine event');
      }
      return json.event as TimeMachineEvent;
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
      const res = await fetch(`${FUNCTIONS_BASE}/time-machine-events?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: defaultHeaders,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete time machine event');
      }
      return json;
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
