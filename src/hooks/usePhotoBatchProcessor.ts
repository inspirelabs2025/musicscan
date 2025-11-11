import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BatchStatus {
  id: string;
  photo_url: string;
  status: 'processing' | 'completed' | 'completed_with_errors' | 'failed';
  total_jobs: number;
  completed_jobs: number;
  current_job: string;
  results: {
    posters: Array<{ style: string; url: string; label: string; emoji: string }>;
    canvas: string | null;
    tshirt: {
      baseDesign: string;
      variants: Array<{ style: string; url: string }>;
    } | null;
    socks: string | null;
    errors: Array<{ job: string; error: string }>;
  } | null;
  created_at: string;
  completed_at: string | null;
}

export const usePhotoBatchProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startBatch = async (photoUrl: string): Promise<string> => {
    setIsProcessing(true);
    
    try {
      toast({
        title: "🚀 Starting batch processing...",
        description: "Generating all product variants in background"
      });

      const { data, error } = await supabase.functions.invoke('photo-batch-processor', {
        body: {
          action: 'start',
          photoUrl
        }
      });

      if (error) throw error;

      const batchId = data.batchId;
      
      // Start polling for status updates
      const interval = setInterval(() => pollBatchStatus(batchId), 3000);
      setPollingInterval(interval);

      toast({
        title: "✅ Batch started!",
        description: "Tracking progress automatically..."
      });

      return batchId;
    } catch (error: any) {
      console.error('Failed to start batch:', error);
      toast({
        title: "❌ Failed to start batch",
        description: error.message,
        variant: "destructive"
      });
      setIsProcessing(false);
      throw error;
    }
  };

  const pollBatchStatus = async (batchId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('photo-batch-processor', {
        body: {
          action: 'status',
          batchId
        }
      });

      if (error) throw error;

      setBatchStatus(data);

      // Stop polling if batch is completed
      if (data.status !== 'processing') {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setIsProcessing(false);

        if (data.status === 'completed') {
          toast({
            title: "🎉 All products generated!",
            description: `${data.completed_jobs}/${data.total_jobs} jobs completed successfully`
          });
        } else if (data.status === 'completed_with_errors') {
          toast({
            title: "⚠️ Batch completed with errors",
            description: `${data.results?.errors?.length || 0} jobs failed`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "❌ Batch failed",
            description: "Check logs for details",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Failed to poll batch status:', error);
    }
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const getProgressPercentage = () => {
    if (!batchStatus) return 0;
    return Math.round((batchStatus.completed_jobs / batchStatus.total_jobs) * 100);
  };

  return {
    startBatch,
    isProcessing,
    batchStatus,
    progress: getProgressPercentage(),
    stopPolling
  };
};
