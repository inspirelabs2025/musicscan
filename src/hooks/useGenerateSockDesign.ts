import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GenerateSockParams {
  artistName: string;
  albumTitle: string;
  albumCoverUrl: string;
  discogsId?: number;
  releaseYear?: number;
  genre?: string;
  generateProducts?: boolean;
  generateStyleVariants?: boolean;
}

interface GenerateSockResponse {
  sock_id: string;
  slug: string;
  base_design_url: string;
  color_palette: any;
  style_variants?: any[];
  standard_product_id?: string;
  premium_product_id?: string;
  standard_slug?: string;
  premium_slug?: string;
}

export const useGenerateSockDesign = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GenerateSockParams): Promise<GenerateSockResponse> => {
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

      if (colorError) throw colorError;

      toast({
        title: "🧦 Generating Sock Design",
        description: "Creating your unique sock design... (30-60 sec)",
      });

      // Step 2: Generate sock design
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { data: designData, error: designError } = await supabase.functions.invoke(
        'generate-sock-design',
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

      if (designError) throw designError;

      let result: GenerateSockResponse = designData;

      // Step 3: Generate style variants if requested
      if (params.generateStyleVariants) {
        toast({
          title: "🎭 Generating Style Variants",
          description: "Creating 7 different style versions...",
        });

        const { data: styleData, error: styleError } = await supabase.functions.invoke(
          'batch-generate-sock-styles',
          {
            body: {
              baseDesignUrl: designData.base_design_url,
              sockId: designData.sock_id
            }
          }
        );

        if (!styleError && styleData) {
          result = { ...result, style_variants: styleData.styleVariants };
        }
      }

      // Step 4: Create products if requested
      if (params.generateProducts) {
        toast({
          title: "📦 Creating Products",
          description: "Setting up your sock products...",
        });

        const { data: productData, error: productError } = await supabase.functions.invoke(
          'create-sock-products',
          {
            body: {
              sockId: designData.sock_id,
              styleVariants: result.style_variants
            }
          }
        );

        if (!productError && productData) {
          result = { ...result, ...productData };
        }
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['album-socks'] });
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
      
      toast({
        title: "🎉 Sock Design Complete!",
        description: data.standard_product_id 
          ? "Design and products created successfully!"
          : "Sock design generated successfully!",
      });
    },
    onError: (error) => {
      console.error('Sock generation error:', error);
      toast({
        title: "Error Generating Socks",
        description: error instanceof Error ? error.message : "Failed to generate sock design",
        variant: "destructive",
      });
    },
  });
};
