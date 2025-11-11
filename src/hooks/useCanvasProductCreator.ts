import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { StyleType } from './usePhotoStylizer';

interface CreateCanvasProductParams {
  stylizedImage: string;
  artist: string;
  title: string;
  description?: string;
  style: StyleType | 'multi-style';
  price: number;
  styleVariants?: Array<{
    style: string;
    url: string;
    label: string;
    emoji: string;
  }>;
}

interface CreateCanvasProductResult {
  product_id: string;
  product_slug: string;
}

export const useCanvasProductCreator = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCanvasProduct = async ({
    stylizedImage,
    artist,
    title,
    description,
    style,
    price,
    styleVariants
  }: CreateCanvasProductParams): Promise<CreateCanvasProductResult> => {
    setIsCreating(true);
    try {
      toast({
        title: "📤 Creating CANVAS product...",
        description: "Uploading image and creating canvas product listing",
      });

      const { data, error } = await supabase.functions.invoke('create-canvas-product', {
        body: {
          stylizedImageBase64: stylizedImage,
          artist,
          title,
          description,
          style,
          price,
          styleVariants: styleVariants || []
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to create canvas product');
      }

      // Invalidate platform products cache
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });

      toast({
        title: "✅ CANVAS product created!",
        description: `"${title}" is now available in the ART SHOP`,
      });

      return {
        product_id: data.product_id,
        product_slug: data.product_slug
      };

    } catch (error: any) {
      console.error('Create canvas product error:', error);
      const message = error?.message || 'Failed to create CANVAS product';
      
      toast({
        title: "❌ Product creation failed",
        description: message,
        variant: "destructive"
      });

      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createCanvasProduct,
    isCreating
  };
};
