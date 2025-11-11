import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadOriginalPosterParams {
  eventId: string;
  imageFile: File;
  metadata?: {
    year?: string;
    source?: string;
    condition?: string;
  };
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const useUploadOriginalPoster = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, imageFile, metadata }: UploadOriginalPosterParams) => {
      // Validate file size (max 10MB)
      if (imageFile.size > 10 * 1024 * 1024) {
        throw new Error('Bestand te groot. Maximaal 10MB toegestaan.');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(imageFile.type)) {
        throw new Error('Ongeldig bestandstype. Alleen JPG, PNG en WebP zijn toegestaan.');
      }

      // Validate resolution
      const img = new Image();
      const imageUrl = URL.createObjectURL(imageFile);
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(imageUrl);
          if (img.width < 1500 || img.height < 2100) {
            reject(new Error('Resolutie te laag. Minimaal 1500x2100px vereist voor print kwaliteit.'));
          }
          resolve(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Kan afbeelding niet laden.'));
        };
        img.src = imageUrl;
      });

      // Convert file to base64
      const base64 = await fileToBase64(imageFile);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('upload-original-poster', {
        body: { 
          eventId, 
          imageBase64: base64, 
          metadata,
          fileName: imageFile.name 
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Upload failed');

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Originele Poster Geüpload",
        description: "De poster is succesvol toegevoegd aan het event",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['time-machine-events'] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Upload Mislukt",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
