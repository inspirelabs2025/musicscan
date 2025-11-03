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
  already_exists?: boolean;
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
      if (data.already_exists) {
        toast({
          title: "ℹ️ Product Bestaat Al",
          description: "Dit album is al als ART product toegevoegd",
        });
      } else {
        toast({
          title: "✅ Product Aangemaakt",
          description: data.message,
        });
      }
      
      // Refresh product lists
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
    },
    onError: (error: any) => {
      console.error('Error creating ART product:', error);
      const status = error?.status || error?.context?.response?.status;
      const message = error?.message || '';

      if (status === 409 || message.includes('already exists')) {
        toast({
          title: "⚠️ Product Bestaat Al",
          description: "Dit album is al als ART product toegevoegd",
          variant: "destructive"
        });
      } else if (status === 404 || message.includes('No results found')) {
        toast({
          title: "❌ Niet Gevonden",
          description: "Album niet gevonden op Discogs. Controleer de spelling.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ Fout bij Aanmaken",
          description: message || "Er is een fout opgetreden bij het aanmaken van het product",
          variant: "destructive"
        });
      }
    }
  });
};
