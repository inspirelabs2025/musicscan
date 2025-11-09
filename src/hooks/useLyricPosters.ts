import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LyricPoster {
  id: string;
  created_at: string;
  artist_name: string;
  song_title: string;
  album_name?: string;
  release_year?: number;
  poster_url?: string;
  style_variants?: any;
  qr_code_url?: string;
  standard_product_id?: string;
  metal_product_id?: string;
  slug?: string;
  is_published: boolean;
  license_type?: string;
}

export const useLyricPosters = () => {
  return useQuery({
    queryKey: ['lyric-posters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lyric_posters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LyricPoster[];
    }
  });
};

export const useLyricPoster = (id?: string) => {
  return useQuery({
    queryKey: ['lyric-poster', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('lyric_posters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as LyricPoster;
    },
    enabled: !!id
  });
};
