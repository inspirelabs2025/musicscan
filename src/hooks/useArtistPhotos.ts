import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  id: string;
  display_url: string;
  seo_title: string;
  seo_slug: string;
  artist: string | null;
  year: number | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  format: string | null;
  user_id: string;
  profiles: {
    user_id: string;
    first_name: string;
    avatar_url: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 20;

export const useArtistPhotos = (artistName: string, formatFilter: string = "all") => {
  return useInfiniteQuery({
    queryKey: ["artist-photos", artistName, formatFilter],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("photos")
        .select("*")
        .eq("status", "published")
        .eq("artist", artistName)
        .order("published_at", { ascending: false })
        .range(pageParam, pageParam + ITEMS_PER_PAGE - 1);

      if (formatFilter !== "all") {
        query = query.eq("format", formatFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Photo[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < ITEMS_PER_PAGE) return undefined;
      return allPages.length * ITEMS_PER_PAGE;
    },
    initialPageParam: 0,
    enabled: !!artistName,
  });
};
