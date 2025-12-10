import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RenderJob {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'running' | 'done' | 'error' | 'processing' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  error_message?: string;
  worker_id?: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  locked_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Legacy fields
  image_url?: string;
  source_type?: string;
  source_id?: string;
  artist?: string;
  title?: string;
  output_url?: string;
}

export interface RenderQueueStats {
  pending: number;
  running: number;
  done: number;
  error: number;
  total: number;
}

export function useRenderQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch jobs with optional status filter
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['render-jobs', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('render_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RenderJob[];
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch queue statistics
  const { data: stats } = useQuery({
    queryKey: ['render-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('render_jobs')
        .select('status');

      if (error) throw error;

      const counts = (data || []).reduce((acc, job) => {
        const status = job.status as string;
        acc[status] = (acc[status] || 0) + 1;
        acc.total = (acc.total || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        pending: 0,
        running: (counts.pending || 0) + (counts.running || 0) + (counts.processing || 0),
        done: (counts.done || 0) + (counts.completed || 0),
        error: (counts.error || 0) + (counts.failed || 0),
        total: counts.total || 0,
      } as RenderQueueStats;
    },
    refetchInterval: 5000,
  });

  // Create new job
  const createJob = useMutation({
    mutationFn: async ({ type, payload, priority = 0 }: { 
      type: string; 
      payload: Record<string, unknown>; 
      priority?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-render-job', {
        body: { type, payload, priority }
      });
      if (error) throw error;
      if (!data.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['render-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['render-queue-stats'] });
      toast({ title: 'Job aangemaakt', description: 'Render job toegevoegd aan queue' });
    },
    onError: (error) => {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  });

  // Retry failed job
  const retryJob = useMutation({
    mutationFn: async (job: RenderJob) => {
      // Create a new job with the same type and payload
      const { data, error } = await supabase.functions.invoke('create-render-job', {
        body: { 
          type: job.type || job.source_type || 'unknown',
          payload: job.payload || {
            image_url: job.image_url,
            artist: job.artist,
            title: job.title,
            source_id: job.source_id
          },
          priority: job.priority + 10 // Slightly higher priority for retries
        }
      });
      if (error) throw error;
      if (!data.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['render-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['render-queue-stats'] });
      toast({ title: 'Job opnieuw gestart', description: 'Een nieuwe job is aangemaakt' });
    },
    onError: (error) => {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  });

  // Delete job
  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('render_jobs')
        .delete()
        .eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['render-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['render-queue-stats'] });
      toast({ title: 'Job verwijderd' });
    },
    onError: (error) => {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  });

  // Clear all jobs with specific status
  const clearByStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from('render_jobs')
        .delete()
        .eq('status', status);
      if (error) throw error;
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['render-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['render-queue-stats'] });
      toast({ title: `${status} jobs verwijderd` });
    },
    onError: (error) => {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    }
  });

  return {
    jobs,
    stats,
    isLoading,
    statusFilter,
    setStatusFilter,
    refetch,
    createJob,
    retryJob,
    deleteJob,
    clearByStatus,
  };
}
