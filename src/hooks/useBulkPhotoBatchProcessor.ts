import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PhotoMetadata {
  name: string;
  artist: string;
  title: string;
  description?: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  metadata: PhotoMetadata;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: any;
  error?: string;
  progress?: number;
  completedJobs?: number;
  totalJobs?: number;
  currentJob?: string;
}

export interface BulkBatchStatus {
  batchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  photos: PhotoItem[];
  totalPhotos: number;
  completedPhotos: number;
  failedPhotos: number;
  overallProgress: number;
}

export const useBulkPhotoBatchProcessor = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState<BulkBatchStatus | null>(null);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [channel]);

  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `originals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vinyl_images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload failed:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vinyl_images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
      setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    return uploadedUrls;
  };

  const startBulkBatch = async (
    files: File[],
    metadata: PhotoMetadata[]
  ): Promise<string> => {
    try {
      setIsProcessing(true);
      setUploadProgress(0);

      toast({
        title: "📤 Uploading photos...",
        description: `Uploading ${files.length} photos...`
      });

      // Upload all photos
      const photoUrls = await uploadPhotos(files);

      toast({
        title: "✅ Upload complete",
        description: "Initializing batch processing..."
      });

      // Call edge function to initialize batch (bypasses RLS issues)
      const { data, error: functionError } = await supabase.functions.invoke(
        'init-bulk-photo-batch',
        {
          body: {
            photoUrls,
            metadata
          }
        }
      );

      if (functionError) {
        console.error('❌ init-bulk-photo-batch failed:', {
          message: functionError.message,
          context: functionError.context,
          raw: JSON.stringify(functionError)
        });
        throw new Error(`Failed to initialize batch: ${functionError.message}`);
      }

      if (!data?.success || !data?.batchId) {
        throw new Error(data?.error || 'Failed to initialize batch');
      }

      const batchId = data.batchId;

      // Initialize batch status
      setBatchStatus({
        batchId,
        status: 'processing',
        photos: photoUrls.map((url, index) => ({
          id: `photo-${index}`,
          url,
          metadata: metadata[index],
          status: 'pending'
        })),
        totalPhotos: photoUrls.length,
        completedPhotos: 0,
        failedPhotos: 0,
        overallProgress: 0
      });

      // Subscribe to real-time updates
      subscribeToUpdates(batchId);

      toast({
        title: "🚀 Batch processing started",
        description: `Processing ${photoUrls.length} photos in the background`
      });

      return batchId;
    } catch (error: any) {
      console.error('❌ Bulk batch start failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        raw: JSON.stringify(error)
      });
      
      toast({
        title: "❌ Failed to start batch",
        description: error.message || 'Unknown error occurred',
        variant: "destructive"
      });
      
      setIsProcessing(false);
      throw error;
    }
  };

  const subscribeToUpdates = (batchId: string) => {
    const newChannel = supabase
      .channel(`bulk_batch_${batchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'batch_queue_items',
          filter: `batch_id=eq.${batchId}`
        },
        (payload) => {
          console.log('📩 batch_queue_items update:', payload.new);
          updatePhotoStatus(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'photo_batch_queue'
        },
        (payload) => {
          console.log('📩 photo_batch_queue update (sub-progress):', payload.new);
          // Update sub-progress for individual photo batches
          updatePhotoSubProgress(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'batch_uploads',
          filter: `id=eq.${batchId}`
        },
        (payload) => {
          console.log('📩 batch_uploads update:', payload.new);
          updateBatchStatus(payload.new);
        }
      )
      .subscribe();

    setChannel(newChannel);
  };

  const updatePhotoStatus = (queueItem: any) => {
    setBatchStatus(prev => {
      if (!prev) return prev;

      const photoIndex = prev.photos.findIndex(
        p => p.url === queueItem.metadata?.photo_url
      );

      if (photoIndex === -1) return prev;

      const updatedPhotos = [...prev.photos];
      updatedPhotos[photoIndex] = {
        ...updatedPhotos[photoIndex],
        status: queueItem.status,
        results: {
          ...updatedPhotos[photoIndex].results,
          ...queueItem.results,
          batchId: queueItem.metadata?.photo_batch_id || updatedPhotos[photoIndex].results?.batchId
        },
        error: queueItem.error_message,
        progress: queueItem.metadata?.progress,
        completedJobs: queueItem.metadata?.completed_jobs,
        totalJobs: queueItem.metadata?.total_jobs
      };

      const completedPhotos = updatedPhotos.filter(
        p => p.status === 'completed'
      ).length;
      const failedPhotos = updatedPhotos.filter(
        p => p.status === 'failed'
      ).length;

      return {
        ...prev,
        photos: updatedPhotos,
        completedPhotos,
        failedPhotos,
        overallProgress: Math.round((completedPhotos / prev.totalPhotos) * 100)
      };
    });
  };

  const updatePhotoSubProgress = (photoBatch: any) => {
    setBatchStatus(prev => {
      if (!prev) return prev;

      const updatedPhotos = prev.photos.map(photo => {
        // Check if this photo_batch_queue entry belongs to this photo
        // The batchId is stored in results after the photo batch starts
        const photoBatchId = photo.results?.batchId;
        if (photoBatchId === photoBatch.id) {
          return {
            ...photo,
            progress: Math.round((photoBatch.completed_jobs / photoBatch.total_jobs) * 100),
            completedJobs: photoBatch.completed_jobs,
            totalJobs: photoBatch.total_jobs,
            currentJob: photoBatch.current_job
          };
        }
        return photo;
      });

      return {
        ...prev,
        photos: updatedPhotos
      };
    });
  };

  const updateBatchStatus = (batchData: any) => {
    setBatchStatus(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        status: batchData.status
      };
    });

    if (batchData.status === 'completed' || batchData.status === 'failed') {
      setIsProcessing(false);
      
      if (batchData.status === 'completed') {
        toast({
          title: "✅ Batch processing complete!",
          description: "All photos have been processed successfully"
        });
      }
    }
  };

  const stopProcessing = () => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
    }
    setIsProcessing(false);
  };

  return {
    startBulkBatch,
    isProcessing,
    uploadProgress,
    batchStatus,
    stopProcessing
  };
};
