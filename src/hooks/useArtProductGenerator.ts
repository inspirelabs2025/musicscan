import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateArtProductParams {
  discogs_id?: number;
  catalog_number?: string;
  artist?: string;
  title?: string;
  price?: number;
}

interface CreateArtProductResponse {
  success: boolean;
  product_id: string;
  product_slug: string;
  message: string;
}

export const useArtProductGenerator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateArtProductParams) => {
      toast({
        title: "🎨 ART Product Genereren",
        description: "Bezig met zoeken op Discogs en artwork ophalen...",
      });

      const { data, error } = await supabase.functions.invoke('create-art-product', {
        body: params
      });

      if (error) throw error;
      return data as CreateArtProductResponse;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Product Aangemaakt",
        description: data.message,
      });
      
      // Refresh product lists
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
    },
    onError: (error: any) => {
      console.error('Error creating ART product:', error);
      
      if (error.message?.includes('already exists')) {
        toast({
          title: "⚠️ Product Bestaat Al",
          description: "Dit album is al als ART product toegevoegd",
          variant: "destructive"
        });
      } else if (error.message?.includes('No results found')) {
        toast({
          title: "❌ Niet Gevonden",
          description: "Album niet gevonden op Discogs. Controleer je zoekgegevens.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ Fout bij Aanmaken",
          description: error.message || "Er is een fout opgetreden bij het aanmaken van het product",
          variant: "destructive"
        });
      }
    }
  });
};
