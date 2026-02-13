import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDiscogsExport, ExportResult } from "@/hooks/useDiscogsExport";
import { useDiscogsConnection } from "@/hooks/useDiscogsConnection";
import { CheckCircle2, XCircle, Loader2, Upload } from "lucide-react";

interface DiscogsExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discogsIds: number[];
  itemCount: number;
}

export const DiscogsExportDialog = ({ open, onOpenChange, discogsIds, itemCount }: DiscogsExportDialogProps) => {
  const [target, setTarget] = useState<"collection" | "wantlist">("collection");
  const { exportToDiscogs, isExporting, exportResult, clearResult } = useDiscogsExport();
  const { isConnected } = useDiscogsConnection();

  const handleExport = async () => {
    await exportToDiscogs(discogsIds, target);
  };

  const handleClose = () => {
    clearResult();
    onOpenChange(false);
  };

  if (!isConnected) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discogs niet gekoppeld</DialogTitle>
            <DialogDescription>
              Koppel eerst je Discogs account via de knop bovenaan je collectie.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Sluiten</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exporteer naar Discogs</DialogTitle>
          <DialogDescription>
            {itemCount} item{itemCount !== 1 ? 's' : ''} met Discogs ID geselecteerd.
          </DialogDescription>
        </DialogHeader>

        {!exportResult ? (
          <>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Kies waar je de items wilt toevoegen:</p>
              <div className="flex gap-3">
                <Button
                  variant={target === "collection" ? "default" : "outline"}
                  onClick={() => setTarget("collection")}
                  className="flex-1"
                >
                  Collection
                </Button>
                <Button
                  variant={target === "wantlist" ? "default" : "outline"}
                  onClick={() => setTarget("wantlist")}
                  className="flex-1"
                >
                  Wantlist
                </Button>
              </div>
            </div>

            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporteren... (±{itemCount} seconden)
                </div>
                <Progress value={undefined} className="h-2" />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isExporting}>
                Annuleren
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Exporteer {itemCount} items
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">{exportResult.successful} geslaagd</span>
              </div>
              {exportResult.failed > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">{exportResult.failed} mislukt</span>
                </div>
              )}
              {exportResult.failed > 0 && (
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-1">
                  {exportResult.results
                    .filter(r => !r.success)
                    .map((r, i) => (
                      <div key={i}>ID {r.discogs_id}: {r.error}</div>
                    ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Sluiten</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
