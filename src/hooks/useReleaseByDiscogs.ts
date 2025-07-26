import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReleaseItem } from "./useReleaseDetail";

export const useReleaseByDiscogs = (discogsId: number) => {
  const { data: release, isLoading, error } = useQuery({
    queryKey: ["release-by-discogs", discogsId],
    queryFn: async () => {
      if (!discogsId) return null;

      const { data, error } = await supabase
        .from("releases")
        .select("*")
        .eq("discogs_id", discogsId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      
      return data as ReleaseItem;
    },
    enabled: !!discogsId,
  });

  return {
    release,
    isLoading,
    error,
    exists: !!release,
  };
};