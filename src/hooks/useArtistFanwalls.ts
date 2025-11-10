import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ArtistFanwall {
  id: string;
  artist_name: string;
  slug: string;
  photo_count: number;
  total_views: number;
  total_likes: number;
  featured_photo_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
}

export const useArtistFanwalls = (sortBy: "photo_count" | "total_views" | "artist_name" = "photo_count") => {
  return useQuery({
    queryKey: ["artist-fanwalls", sortBy],
    queryFn: async () => {
      let query = supabase
        .from("artist_fanwalls")
        .select("*")
        .eq("is_active", true)
        .gt("photo_count", 0);

      // Sort based on user preference
      if (sortBy === "photo_count") {
        query = query.order("photo_count", { ascending: false });
      } else if (sortBy === "total_views") {
        query = query.order("total_views", { ascending: false });
      } else {
        query = query.order("artist_name", { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ArtistFanwall[];
    },
  });
};
