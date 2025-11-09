import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAlbumSocks = (options?: { published?: boolean }) => {
  return useQuery({
    queryKey: ['album-socks', options],
    queryFn: async () => {
      let query = supabase
        .from('album_socks')
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

export const useAlbumSock = (id: string) => {
  return useQuery({
    queryKey: ['album-sock', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('album_socks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};
