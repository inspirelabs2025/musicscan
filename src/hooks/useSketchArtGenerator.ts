import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateSketchParams {
  discogs_id?: number;
  catalog_number?: string;
  artist?: string;
  title?: string;
  price?: number;
  style?: 'pencil_sketch' | 'ink_drawing' | 'charcoal';
}

interface CreateSketchResponse {
  success: boolean;
  product_id: string;
  product_slug: string;
  sketch_url: string;
  original_artwork: string;
  message: string;
}

export const useSketchArtGenerator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateSketchParams) => {
      toast({
        title: "🎨 Sketch Variant Genereren",
        description: "Bezig met AI sketch generatie van albumcover...",
      });

      const { data, error } = await supabase.functions.invoke('create-art-sketch-variant', {
        body: params
      });

      if (error) throw error;
      return data as CreateSketchResponse;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Sketch Variant Aangemaakt",
        description: data.message,
      });
      
      queryClient.invalidateQueries({ queryKey: ['platform-products'] });
    },
    onError: (error: any) => {
      console.error('Error creating sketch variant:', error);
      const message = error?.message || '';

      if (message.includes('bestaat al')) {
        toast({
          title: "⚠️ Sketch Bestaat Al",
          description: "Deze sketch variant is al aangemaakt voor dit album",
          variant: "destructive"
        });
      } else if (message.includes('niet gevonden')) {
        toast({
          title: "❌ Album Niet Gevonden",
          description: "Album niet gevonden op Discogs. Controleer de spelling.",
          variant: "destructive"
        });
      } else if (message.includes('Geen albumcover')) {
        toast({
          title: "❌ Geen Cover",
          description: "Geen albumcover beschikbaar voor dit album",
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ Fout bij Genereren",
          description: message || "Er is een fout opgetreden bij het genereren van de sketch",
          variant: "destructive"
        });
      }
    }
  });
};
