import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MediaLibraryItem {
  id: string;
  user_id: string | null;
  storage_path: string;
  storage_bucket: string;
  public_url: string;
  thumbnail_url: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  ai_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  recognized_artist: string | null;
  artist_confidence: number | null;
  ai_tags: string[] | null;
  ai_description: string | null;
  alternative_artists: string[] | null;
  ai_context_type: string | null;
  ai_reasoning: string | null;
  manual_artist: string | null;
  manual_tags: string[] | null;
  notes: string | null;
  sent_to_posters: boolean;
  sent_to_socks: boolean;
  sent_to_buttons: boolean;
  sent_to_tshirts: boolean;
  sent_to_fanwall: boolean;
  sent_to_canvas: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductType = 'posters' | 'socks' | 'buttons' | 'tshirts' | 'fanwall' | 'canvas';

export const useMediaLibrary = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all media library items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['media-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MediaLibraryItem[];
    }
  });

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storagePath = `media-library/${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('artist-images')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('artist-images')
        .getPublicUrl(storagePath);

      // Create database record
      const { data: record, error: dbError } = await supabase
        .from('media_library')
        .insert({
          user_id: user.id,
          storage_path: storagePath,
          storage_bucket: 'artist-images',
          public_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          ai_status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return record as MediaLibraryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Analyze image with AI
  const analyzeMutation = useMutation({
    mutationFn: async (item: MediaLibraryItem) => {
      // Update status to analyzing
      await supabase
        .from('media_library')
        .update({ ai_status: 'analyzing' })
        .eq('id', item.id);

      const { data, error } = await supabase.functions.invoke('ai-recognize-artist', {
        body: {
          imageUrl: item.public_url,
          mediaLibraryId: item.id
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      toast({
        title: 'Analysis complete',
        description: 'Artist recognition finished'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update item
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MediaLibraryItem> }) => {
      const { error } = await supabase
        .from('media_library')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
    }
  });

  // Delete item
  const deleteMutation = useMutation({
    mutationFn: async (item: MediaLibraryItem) => {
      // Delete from storage
      await supabase.storage
        .from(item.storage_bucket)
        .remove([item.storage_path]);

      // Delete from database
      const { error } = await supabase
        .from('media_library')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      toast({
        title: 'Deleted',
        description: 'Item removed from media library'
      });
    }
  });

  // Send to product queue
  const sendToQueueMutation = useMutation({
    mutationFn: async ({ 
      items, 
      productType 
    }: { 
      items: MediaLibraryItem[]; 
      productType: ProductType 
    }) => {
      const fieldMap: Record<ProductType, string> = {
        posters: 'sent_to_posters',
        socks: 'sent_to_socks',
        buttons: 'sent_to_buttons',
        tshirts: 'sent_to_tshirts',
        fanwall: 'sent_to_fanwall',
        canvas: 'sent_to_canvas'
      };

      const field = fieldMap[productType];
      
      for (const item of items) {
        await supabase
          .from('media_library')
          .update({ [field]: true })
          .eq('id', item.id);
      }

      return { items, productType };
    },
    onSuccess: ({ items, productType }) => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      toast({
        title: `Sent to ${productType}`,
        description: `${items.length} item(s) queued for ${productType} generation`
      });
    }
  });

  return {
    items,
    isLoading,
    refetch,
    uploadImage: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    analyzeImage: analyzeMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isPending,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    sendToQueue: sendToQueueMutation.mutateAsync,
    isSendingToQueue: sendToQueueMutation.isPending
  };
};
