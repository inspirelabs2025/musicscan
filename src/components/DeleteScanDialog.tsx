
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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

  const handleDelete = async () => {
    if (!scan) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("ai_scan_results")
        .delete()
        .eq("id", scan.id);

      if (error) throw error;

      toast({
        title: "Scan verwijderd",
        description: "De scan is succesvol verwijderd.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting scan:", error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de scan.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!scan) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card-dark text-card-dark-foreground border-card-dark">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-card-dark-foreground">Scan verwijderen</AlertDialogTitle>
          <AlertDialogDescription className="text-card-dark-foreground/70">
            Weet je zeker dat je deze scan wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-4 p-4 bg-muted/20 rounded-lg border border-muted/30">
          <p className="font-medium text-card-dark-foreground">{scan.artist || "Onbekende artiest"} - {scan.title || "Onbekende titel"}</p>
          <p className="text-sm text-card-dark-foreground/70">
            {scan.media_type} • {scan.condition_grade}
            {scan.discogs_id && ` • Discogs ID: ${scan.discogs_id}`}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="border-card-dark-foreground/20 text-card-dark-foreground hover:bg-card-dark-foreground/10">
            Annuleren
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Verwijderen..." : "Verwijderen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
