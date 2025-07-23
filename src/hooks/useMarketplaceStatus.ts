import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AIScanResult } from "./useInfiniteAIScans";

interface MarketplaceItem {
  discogs_id: number;
  media_type: string;
}

export const useMarketplaceStatus = (aiScans: AIScanResult[]) => {
  return useQuery({
    queryKey: ["marketplace-status", aiScans.map(scan => scan.id)],
    queryFn: async () => {
      if (!aiScans.length) return new Map<string, boolean>();

      const discogsIds = aiScans
        .filter(scan => scan.discogs_id)
        .map(scan => scan.discogs_id);

      if (!discogsIds.length) return new Map<string, boolean>();

      // Check both cd_scan and vinyl2_scan tables
      const [cdResults, vinylResults] = await Promise.all([
        supabase
          .from("cd_scan")
          .select("discogs_id")
          .in("discogs_id", discogsIds),
        supabase
          .from("vinyl2_scan")
          .select("discogs_id")
          .in("discogs_id", discogsIds)
      ]);

      // Create a set of discogs_ids that are in marketplace
      const marketplaceDiscogsIds = new Set<number>();
      
      if (cdResults.data) {
        cdResults.data.forEach(item => {
          if (item.discogs_id) marketplaceDiscogsIds.add(item.discogs_id);
        });
      }
      
      if (vinylResults.data) {
        vinylResults.data.forEach(item => {
          if (item.discogs_id) marketplaceDiscogsIds.add(item.discogs_id);
        });
      }

      // Map AI scan IDs to marketplace status
      const statusMap = new Map<string, boolean>();
      aiScans.forEach(scan => {
        if (scan.discogs_id && marketplaceDiscogsIds.has(scan.discogs_id)) {
          statusMap.set(scan.id, true);
        }
      });

      return statusMap;
    },
    enabled: aiScans.length > 0,
  });
};