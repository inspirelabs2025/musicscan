import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ArtistFanwall } from "./useArtistFanwalls";

export const useArtistFanwall = (slug: string) => {
  return useQuery({
    queryKey: ["artist-fanwall", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_fanwalls")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as ArtistFanwall;
    },
    enabled: !!slug,
  });
};
