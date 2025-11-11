import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GenerateTshirtParams {
  artistName: string;
  albumTitle: string;
  albumCoverUrl: string;
  discogsId?: number;
  releaseYear?: number;
  genre?: string;
  generateProducts?: boolean;
  generateStyleVariants?: boolean;
}

interface GenerateTshirtResponse {
  tshirt_id: string;
  slug: string;
  base_design_url: string;
  color_palette: any;
  style_variants?: any[];
  standard_product_id?: string;
  premium_product_id?: string;
  standard_slug?: string;
  premium_slug?: string;
}

export const useGenerateTshirtDesign = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateTshirtParams): Promise<GenerateTshirtResponse> => {
      toast({
        title: "🎨 Colors Extracting",
        description: "AI analyzes album cover colors...",
      });

      // Step 1: Extract colors from album cover
      const { data: colorData, error: colorError } = await supabase.functions.invoke(
        'extract-album-colors',
        {
          body: {
            albumCoverUrl: params.albumCoverUrl,
            discogsId: params.discogsId,
            artistName: params.artistName,
            albumTitle: params.albumTitle
          }
        }
      );

      if (colorError) {
        const errorMsg = colorError.message || String(colorError);
        if (errorMsg.includes('credits') || errorMsg.includes('INSUFFICIENT_CREDITS')) {
          throw new Error('INSUFFICIENT_CREDITS: Not enough Lovable AI credits. Add credits at Settings → Workspace → Usage.');
        }
        console.error('❌ Step 1 failed - Color extraction:', colorError);
        throw new Error(`Color extraction failed: ${errorMsg}`);
      }
      console.log('✅ Step 1 complete - Colors extracted');

      toast({
        title: "👕 Generating T-Shirt Design",
        description: "Creating your unique T-shirt design... (30-60 sec)",
      });

      // Step 2: Generate T-shirt design
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { data: designData, error: designError } = await supabase.functions.invoke(
        'generate-tshirt-design',
        {
          body: {
            artistName: params.artistName,
            albumTitle: params.albumTitle,
            albumCoverUrl: params.albumCoverUrl,
            colorPalette: colorData,
            discogsId: params.discogsId,
            releaseYear: params.releaseYear,
            genre: params.genre,
            userId: userId
          }
        }
      );

      if (designError) {
        const errorMsg = designError.message || String(designError);
        if (errorMsg.includes('credits') || errorMsg.includes('INSUFFICIENT_CREDITS')) {
          throw new Error('INSUFFICIENT_CREDITS: Not enough Lovable AI credits. Add credits at Settings → Workspace → Usage.');
        }
        console.error('❌ Step 2 failed - Design generation:', designError);
        throw new Error(`Design generation failed: ${errorMsg}`);
      }
      console.log('✅ Step 2 complete - Base design created:', designData.tshirt_id);

      let result: GenerateTshirtResponse = designData;

      // Step 3: Generate style variants if requested
      if (params.generateStyleVariants) {
        toast({
          title: "🎭 Generating Style Variants",
          description: "Creating 7 different style versions...",
        });

        const { data: styleData, error: styleError } = await supabase.functions.invoke(
          'batch-generate-tshirt-styles',
          {
            body: {
              baseDesignUrl: designData.base_design_url,
              tshirtId: designData.tshirt_id
            }
          }
        );

        if (styleError) {
          const errorMsg = styleError.message || String(styleError);
          if (errorMsg.includes('credits') || errorMsg.includes('INSUFFICIENT_CREDITS')) {
            throw new Error('INSUFFICIENT_CREDITS: Not enough Lovable AI credits. Add credits at Settings → Workspace → Usage.');
          }
          console.error('⚠️ Step 3 failed - Style variants (continuing):', styleError);
        } else if (styleData) {
          console.log('✅ Step 3 complete - Style variants created:', styleData.styleVariants?.length || 0);
          result = { ...result, style_variants: styleData.styleVariants };
        }
      }

      // Step 4: Create products if requested
      if (params.generateProducts) {
        toast({
          title: "📦 Creating Products",
          description: "Setting up your T-shirt products...",
        });

        const { data: productData, error: productError } = await supabase.functions.invoke(
          'create-tshirt-products',
          {
            body: {
              tshirtId: designData.tshirt_id,
              styleVariants: result.style_variants
            }
          }
        );

        if (productError) {
          console.error('⚠️ Step 4 failed - Product creation (continuing):', productError);
        } else if (productData) {
          console.log('✅ Step 4 complete - Products created:', productData);
          result = { ...result, ...productData };
        }
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['album-tshirts'] });
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
      
      toast({
        title: "🎉 T-Shirt Design Complete!",
        description: data.standard_product_id 
          ? "Design and products created successfully!"
          : "T-shirt design generated successfully!",
      });
    },
    onError: (error) => {
      console.error('T-shirt generation error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('INSUFFICIENT_CREDITS') || errorMsg.includes('credits')) {
        toast({
          title: "⚠️ Not Enough AI Credits",
          description: "Your workspace has run out of Lovable AI credits. Add credits at Settings → Workspace → Usage to continue.",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "Error Generating T-Shirts",
          description: errorMsg,
          variant: "destructive",
        });
      }
    },
  });
};
