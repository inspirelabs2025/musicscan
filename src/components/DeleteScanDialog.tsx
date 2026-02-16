import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";

type AIScanResult = Tables<"ai_scan_results">;

interface DeleteScanDialogProps {
  scan: AIScanResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteScanDialog({ scan, isOpen, onClose, onSuccess }: DeleteScanDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { tr } = useLanguage();
  const c = tr.contentUI;

  const handleDelete = async () => {
    if (!scan) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from("ai_scan_results").delete().eq("id", scan.id);
      if (error) throw error;
      toast({ title: c.scanDeleted, description: c.scanDeletedDesc });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting scan:", error);
      toast({ title: c.deleteError, description: c.deleteErrorDesc, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!scan) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card-dark text-card-dark-foreground border-card-dark">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-card-dark-foreground">{c.deleteScan}</AlertDialogTitle>
          <AlertDialogDescription className="text-card-dark-foreground/70">{c.deleteConfirm}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 p-4 bg-muted/20 rounded-lg border border-muted/30">
          <p className="font-medium text-card-dark-foreground">{scan.artist || c.unknownArtist} - {scan.title || c.unknownTitle}</p>
          <p className="text-sm text-card-dark-foreground/70">
            {scan.media_type} • {scan.condition_grade}
            {scan.discogs_id && ` • Discogs ID: ${scan.discogs_id}`}
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="border-card-dark-foreground/20 text-card-dark-foreground hover:bg-card-dark-foreground/10">
            {c.cancel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isLoading ? c.deleting : c.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
