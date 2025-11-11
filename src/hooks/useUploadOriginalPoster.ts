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
  autoUpscale?: boolean;
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
    mutationFn: async ({ eventId, imageFile, metadata, autoUpscale = false }: UploadOriginalPosterParams) => {
      // Validate file size (max 10MB)
      if (imageFile.size > 10 * 1024 * 1024) {
        throw new Error('Bestand te groot. Maximaal 10MB toegestaan.');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(imageFile.type)) {
        throw new Error('Ongeldig bestandstype. Alleen JPG, PNG en WebP zijn toegestaan.');
      }

      // Load and validate resolution
      const img = new Image();
      const imageUrl = URL.createObjectURL(imageFile);
      let base64 = '';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(imageUrl);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Kan afbeelding niet laden.'));
        };
        img.src = imageUrl;
      });

      const needsUpscaling = img.width < 1500 || img.height < 2100;

      // Convert file to base64
      base64 = await fileToBase64(imageFile);

      // If resolution is too low and auto-upscale is enabled, upscale first
      if (needsUpscaling && autoUpscale) {
        toast({
          title: "🎨 AI Upscaling...",
          description: `Verhogen resolutie van ${img.width}x${img.height} naar minimaal 1500x2100px`,
        });

        const targetWidth = Math.max(1500, img.width * 2);
        const targetHeight = Math.max(2100, img.height * 2);

        const { data: upscaleData, error: upscaleError } = await supabase.functions.invoke('upscale-image', {
          body: { 
            imageBase64: base64,
            targetWidth,
            targetHeight
          },
        });

        if (upscaleError || !upscaleData?.success) {
          throw new Error(upscaleData?.error || 'AI upscaling mislukt');
        }

        base64 = upscaleData.upscaledImageBase64;
        
        toast({
          title: "✅ Upscaling Voltooid",
          description: "Afbeelding succesvol vergroot met AI",
        });
      } else if (needsUpscaling && !autoUpscale) {
        throw new Error(`Resolutie te laag (${img.width}x${img.height}px). Schakel "Automatisch upscalen" in of upload een hogere resolutie.`);
      }

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
