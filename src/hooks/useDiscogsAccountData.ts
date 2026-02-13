import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DiscogsTarget = "collection" | "wantlist" | "inventory";

export interface DiscogsPagination {
  page: number;
  pages: number;
  items: number;
  per_page: number;
}

export interface DiscogsBasicInfo {
  id: number;
  title: string;
  year: number;
  thumb: string;
  cover_image: string;
  resource_url: string;
  artists: Array<{ name: string; id: number }>;
  labels: Array<{ name: string; catno: string; id: number }>;
  formats: Array<{ name: string; qty: string; descriptions?: string[] }>;
  genres: string[];
  styles: string[];
}

export interface DiscogsCollectionItem {
  id: number;
  instance_id: number;
  rating: number;
  basic_information: DiscogsBasicInfo;
  date_added: string;
}

export interface DiscogsWantlistItem {
  id: number;
  rating: number;
  basic_information: DiscogsBasicInfo;
  date_added: string;
  notes: string;
}

export interface DiscogsInventoryItem {
  id: number;
  status: string;
  price: { value: number; currency: string };
  condition: string;
  sleeve_condition: string;
  comments: string;
  release: { id: number; description: string; thumbnail: string; title: string; year: number; artist: string; format: string; catalog_number: string };
  posted: string;
  uri: string;
}

export type DiscogsItem = DiscogsCollectionItem | DiscogsWantlistItem | DiscogsInventoryItem;

export const useDiscogsAccountData = (target: DiscogsTarget, page: number = 1, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["discogs-account", target, page],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/fetch-discogs-user-data`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ target, page, per_page: 50 }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ophalen mislukt");
      }

      return (await res.json()) as { items: DiscogsItem[]; pagination: DiscogsPagination };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};
