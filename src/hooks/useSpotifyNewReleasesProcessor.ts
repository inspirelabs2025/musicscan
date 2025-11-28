import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProcessedRelease {
  id: string;
  spotify_album_id: string;
  artist: string;
  album_name: string;
  release_date: string | null;
  spotify_url: string | null;
  image_url: string | null;
  discogs_id: number | null;
  product_id: string | null;
  blog_id: string | null;
  status: string;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

export const useSpotifyNewReleasesProcessor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch processed releases
  const { data: processedReleases, isLoading, refetch } = useQuery({
    queryKey: ['spotify-processed-releases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spotify_new_releases_processed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ProcessedRelease[];
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Stats
  const stats = {
    total: processedReleases?.length || 0,
    completed: processedReleases?.filter(r => r.status === 'completed').length || 0,
    pending: processedReleases?.filter(r => r.status === 'pending' || r.status === 'processing').length || 0,
    failed: processedReleases?.filter(r => r.status === 'failed' || r.status === 'product_failed').length || 0,
    noMatch: processedReleases?.filter(r => r.status === 'no_discogs_match').length || 0,
  };

  // Trigger processing mutation
  const triggerProcessing = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('process-spotify-new-releases');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Verwerking Gestart",
        description: `${data.processed || 0} releases verwerkt, ${data.successful || 0} succesvol`,
      });
      queryClient.invalidateQueries({ queryKey: ['spotify-processed-releases'] });
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Fout bij Verwerking",
        description: error.message || "Er ging iets mis",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  // Retry failed release
  const retryRelease = useMutation({
    mutationFn: async (releaseId: string) => {
      // Reset status to pending
      const { error } = await supabase
        .from('spotify_new_releases_processed')
        .update({ 
          status: 'pending',
          error_message: null,
          processed_at: null
        })
        .eq('id', releaseId);
      
      if (error) throw error;
      
      // Trigger processing
      return triggerProcessing.mutateAsync();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotify-processed-releases'] });
    },
  });

  return {
    processedReleases,
    isLoading,
    isProcessing: isProcessing || triggerProcessing.isPending,
    stats,
    triggerProcessing: triggerProcessing.mutate,
    retryRelease: retryRelease.mutate,
    refetch,
  };
};
