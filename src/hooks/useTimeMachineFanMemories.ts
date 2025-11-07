import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FanMemory {
  id: string;
  event_id: string;
  user_id: string;
  memory_text: string;
  was_present: boolean;
  discovery_story?: string;
  photo_url?: string;
  is_approved: boolean;
  is_featured: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name?: string;
    avatar_url?: string;
  };
}

interface UseFanMemoriesOptions {
  eventId: string;
  approved?: boolean;
  featured?: boolean;
  limit?: number;
}

export const useFanMemories = (options: UseFanMemoriesOptions) => {
  return useQuery({
    queryKey: ['fan-memories', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('event_id', options.eventId);
      if (options.approved !== undefined) params.append('approved', String(options.approved));
      if (options.featured !== undefined) params.append('featured', String(options.featured));
      if (options.limit) params.append('limit', String(options.limit));

      const { data, error } = await supabase.functions.invoke('time-machine-fan-memories', {
        method: 'GET',
        body: Object.fromEntries(params)
      });

      if (error) throw error;
      return data.memories as FanMemory[];
    },
    enabled: !!options.eventId,
  });
};

export const useFanMemory = (id?: string) => {
  return useQuery({
    queryKey: ['fan-memory', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase.functions.invoke('time-machine-fan-memories', {
        method: 'GET',
        body: { id }
      });

      if (error) throw error;
      return data.memory as FanMemory;
    },
    enabled: !!id,
  });
};

export const useCreateFanMemory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memory: Partial<FanMemory>) => {
      const { data, error } = await supabase.functions.invoke('time-machine-fan-memories', {
        method: 'POST',
        body: memory
      });

      if (error) throw error;
      return data.memory as FanMemory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-memories'] });
      toast({
        title: 'Bedankt!',
        description: 'Je herinnering is verzonden en wacht op goedkeuring',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateFanMemory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memory: Partial<FanMemory> & { id: string }) => {
      const { data, error } = await supabase.functions.invoke('time-machine-fan-memories', {
        method: 'PUT',
        body: memory
      });

      if (error) throw error;
      return data.memory as FanMemory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fan-memories'] });
      queryClient.invalidateQueries({ queryKey: ['fan-memory', data.id] });
      toast({
        title: 'Gelukt',
        description: 'Herinnering bijgewerkt',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useLikeFanMemory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('time-machine-fan-memories', {
        method: 'PUT',
        body: { id, action: 'like' }
      });

      if (error) throw error;
      return data.memory as FanMemory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fan-memories'] });
      queryClient.invalidateQueries({ queryKey: ['fan-memory', data.id] });
    },
  });
};

export const useDeleteFanMemory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('time-machine-fan-memories', {
        method: 'DELETE',
        body: { id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-memories'] });
      toast({
        title: 'Verwijderd',
        description: 'Herinnering verwijderd',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
