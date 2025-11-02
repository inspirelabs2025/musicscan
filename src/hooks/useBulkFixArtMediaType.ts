import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBulkFixArtMediaType = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      toast({
        title: "🔧 Bulk Update Starten",
        description: "Bezig met updaten van metaalprint producten naar 'art' categorie...",
      });

      const { data, error } = await supabase.functions.invoke('bulk-fix-art-media-type');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Bulk Update Voltooid",
        description: `${data.updated_count} metaalprint producten zijn bijgewerkt naar 'art' categorie`,
      });
    },
    onError: (error: any) => {
      console.error('Error in bulk fix:', error);
      toast({
        title: "❌ Fout bij Bulk Update",
        description: error?.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    }
  });
};
