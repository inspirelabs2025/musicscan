import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SingleImport {
  artist: string;
  single_name: string;
  album?: string;
  year?: number;
  label?: string;
  catalog?: string;
  discogs_id?: number;
  discogs_url?: string;
  artwork_url?: string;
  genre?: string;
  styles?: string[];
  tags?: string[];
}

interface ImportResult {
  success: boolean;
  batch_id?: string;
  imported: number;
  invalid: number;
  invalid_items?: any[];
  message?: string;
  error?: string;
}

export const useSinglesImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const { toast } = useToast();

  const importSingles = async (singles: SingleImport[]): Promise<ImportResult | null> => {
    setIsImporting(true);
    try {
      console.log('🚀 Importing singles:', singles.length);
      const { data, error } = await supabase.functions.invoke('import-singles-batch', {
        body: { singles }
      });

      if (error) {
        console.error('❌ Import function error:', error);
        toast({
          title: "Import Failed",
          description: error.message || 'Unknown error during import',
          variant: "destructive",
        });
        return null;
      }

      if (data?.error) {
        console.error('❌ Import data error:', data.error);
        toast({
          title: "Import Failed",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ Import successful:', data);
      toast({
        title: "Import Successful",
        description: `${data.imported} singles imported to queue`,
      });

      return data as ImportResult;
    } catch (error: any) {
      console.error('❌ Import exception:', error);
      toast({
        title: "Import Error",
        description: error.message || 'Network error or authentication failed',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  const startBatchProcessing = async () => {
    setIsBatchProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('singles-batch-generator', {
        body: { action: 'start' }
      });

      if (error) {
        toast({
          title: "Start Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.error) {
        toast({
          title: "Start Failed",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Batch Processing Started",
        description: data.message,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const stopBatchProcessing = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('singles-batch-generator', {
        body: { action: 'stop' }
      });

      if (error) {
        toast({
          title: "Stop Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Batch Processing Stopped",
        description: "Singles batch has been stopped",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const getBatchStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('singles-batch-generator', {
        body: { action: 'status' }
      });

      if (error) {
        console.error('Status check failed:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Status error:', error);
      return null;
    }
  };

  const retryFailed = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('singles-batch-generator', {
        body: { action: 'retry_failed' }
      });

      if (error) {
        toast({
          title: "Retry Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Retry Initiated",
        description: data.message,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const clearQueue = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('singles-batch-generator', {
        body: { action: 'clear' }
      });

      if (error) {
        toast({
          title: "Clear Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Queue Cleared",
        description: "All pending singles removed from queue",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    importSingles,
    startBatchProcessing,
    stopBatchProcessing,
    getBatchStatus,
    retryFailed,
    clearQueue,
    isImporting,
    isBatchProcessing,
  };
};
