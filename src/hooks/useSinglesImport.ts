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
      const { data, error } = await supabase.functions.invoke('import-singles-batch', {
        body: { singles }
      });

      if (error) {
        toast({
          title: "Import Failed",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Import Successful",
        description: `${data.imported} singles imported to queue`,
      });

      return data as ImportResult;
    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message,
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

  return {
    importSingles,
    startBatchProcessing,
    stopBatchProcessing,
    getBatchStatus,
    retryFailed,
    isImporting,
    isBatchProcessing,
  };
};
