import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface ExportResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{ discogs_id: number; success: boolean; error?: string }>;
}

export const useDiscogsExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const { toast } = useToast();

  const exportToDiscogs = async (
    discogsIds: number[],
    target: "collection" | "wantlist"
  ): Promise<ExportResult | null> => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/discogs-collection-export`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ discogs_ids: discogsIds, target }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Export mislukt");
      }

      const result: ExportResult = await res.json();
      setExportResult(result);

      toast({
        title: "Export voltooid",
        description: `${result.successful} van ${result.total} items succesvol geëxporteerd naar Discogs ${target === "collection" ? "Collection" : "Wantlist"}.`,
        variant: result.failed > 0 ? "destructive" : "default",
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Export mislukt",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToDiscogs,
    isExporting,
    exportResult,
    clearResult: () => setExportResult(null),
  };
};
