import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { StyleType } from './usePhotoStylizer';

interface CreatePosterProductParams {
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

interface CreatePosterProductResult {
  product_id: string;
  product_slug: string;
}

export const usePosterProductCreator = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPosterProduct = async ({
    stylizedImage,
    artist,
    title,
    description,
    style,
    price,
    styleVariants
  }: CreatePosterProductParams): Promise<CreatePosterProductResult> => {
    setIsCreating(true);
    try {
      toast({
        title: "📤 Creating POSTER product...",
        description: styleVariants ? "Creating product with all style variants" : "Uploading image and creating product listing",
      });

      const { data, error } = await supabase.functions.invoke('create-poster-product', {
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
        throw new Error(data.error || 'Failed to create product');
      }

      // Invalidate platform products cache
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });

      toast({
        title: "✅ POSTER product created!",
        description: styleVariants 
          ? `"${title}" is now available with ${styleVariants.length} style options!`
          : `"${title}" is now available in the ART SHOP`,
      });

      return {
        product_id: data.product_id,
        product_slug: data.product_slug
      };

    } catch (error: any) {
      console.error('Create product error:', error);
      const message = error?.message || 'Failed to create POSTER product';
      
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
    createPosterProduct,
    isCreating
  };
};
