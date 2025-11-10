import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAlbumTshirts = (options?: { published?: boolean }) => {
  return useQuery({
    queryKey: ['album-tshirts', options],
    queryFn: async () => {
      let query = supabase
        .from('album_tshirts')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.published) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
};

export const useAlbumTshirt = (id: string) => {
  return useQuery({
    queryKey: ['album-tshirt', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('album_tshirts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};
