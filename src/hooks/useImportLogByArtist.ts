import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ImportLogItem {
  id: string;
  discogs_release_id: number;
  artist: string;
  title: string;
  year: number | null;
  label: string | null;
  catalog_number: string | null;
  format: string | null;
  country: string | null;
  master_id: number | null;
  product_id: string | null;
  blog_id: string | null;
  status: string;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export const useImportLogByArtist = (artistName: string | null) => {
  return useQuery({
    queryKey: ["import-log-by-artist", artistName],
    queryFn: async (): Promise<ImportLogItem[]> => {
      if (!artistName) return [];

      const { data, error } = await supabase
        .from("discogs_import_log")
        .select("*")
        .eq("artist", artistName)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!artistName,
  });
};
