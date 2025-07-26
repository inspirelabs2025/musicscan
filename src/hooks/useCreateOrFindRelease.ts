import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateReleaseParams {
  discogs_id: number;
  artist: string;
  title: string;
  label?: string;
  catalog_number?: string;
  year?: number;
  format?: string;
  genre?: string;
  country?: string;
  style?: string[];
  discogs_url?: string;
  master_id?: number;
}

export const useCreateOrFindRelease = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateReleaseParams) => {
      const { data, error } = await supabase.functions.invoke('find-or-create-release', {
        body: params
      });

      if (error) throw error;
      return data.release_id;
    },
    onError: (error) => {
      console.error('Error creating/finding release:', error);
      toast({
        title: "Fout bij release verwerking",
        description: "Er is een fout opgetreden bij het verwerken van de release",
        variant: "destructive"
      });
    }
  });
};