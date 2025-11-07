import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type StyleType = 'posterize' | 'oilPainting' | 'watercolor' | 'pencilSketch' | 'comicBook' | 'abstract' | 'vectorCartoon';

interface StylizeResult {
  stylizedImageUrl: string;
  style: StyleType;
}

export const usePhotoStylizer = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [stylizedImage, setStylizedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `originals/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('vinyl_images')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('vinyl_images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const stylizePhoto = async (file: File, style: StyleType): Promise<StylizeResult> => {
    setIsProcessing(true);
    try {
      // Upload original image
      toast({
        title: "📤 Uploading photo...",
        description: "Please wait while we upload your image",
      });

      const imageUrl = await uploadImage(file);
      setOriginalImage(imageUrl);

      // Stylize the image
      toast({
        title: "🎨 Transforming photo...",
        description: `Applying ${style} style with AI`,
      });

      const { data, error } = await supabase.functions.invoke('stylize-photo', {
        body: { imageUrl, style }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Stylization failed');
      }

      setStylizedImage(data.stylizedImageUrl);

      toast({
        title: "✅ Photo stylized!",
        description: "Your artistic transformation is ready",
      });

      return {
        stylizedImageUrl: data.stylizedImageUrl,
        style: data.style
      };

    } catch (error: any) {
      console.error('Stylization error:', error);
      const message = error?.message || 'Failed to stylize photo';
      
      toast({
        title: "❌ Stylization failed",
        description: message,
        variant: "destructive"
      });

      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setStylizedImage(null);
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    isProcessing,
    originalImage,
    stylizedImage,
    stylizePhoto,
    reset,
    downloadImage
  };
};
