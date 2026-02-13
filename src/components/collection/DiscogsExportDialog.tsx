import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDiscogsExport, ExportResult } from "@/hooks/useDiscogsExport";
import { useDiscogsConnection } from "@/hooks/useDiscogsConnection";
import { CheckCircle2, XCircle, Loader2, Upload } from "lucide-react";

const CONDITION_OPTIONS = [
  "Mint (M)",
  "Near Mint (NM or M-)",
  "Very Good Plus (VG+)",
  "Very Good (VG)",
  "Good Plus (G+)",
  "Good (G)",
  "Fair (F)",
  "Poor (P)",
];

interface DiscogsExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discogsIds: number[];
  itemCount: number;
  defaultPrice?: number;
  defaultCondition?: string;
}

export const DiscogsExportDialog = ({ open, onOpenChange, discogsIds, itemCount, defaultPrice, defaultCondition }: DiscogsExportDialogProps) => {
  const [target, setTarget] = useState<"collection" | "wantlist" | "forsale">("collection");
  const { exportToDiscogs, isExporting, exportResult, clearResult } = useDiscogsExport();
  const { isConnected } = useDiscogsConnection();

  // Marketplace fields
  const [price, setPrice] = useState(defaultPrice?.toString() || "");
  const [condition, setCondition] = useState(defaultCondition || "Very Good Plus (VG+)");
  const [sleeveCondition, setSleeveCondition] = useState("Very Good Plus (VG+)");
  const [comments, setComments] = useState("");

  const handleExport = async () => {
    const listingData = target === "forsale" ? {
      price: parseFloat(price),
      condition,
      sleeve_condition: sleeveCondition,
      comments: comments || undefined,
    } : undefined;

    await exportToDiscogs(discogsIds, target, listingData);
  };

  const handleClose = () => {
    clearResult();
    onOpenChange(false);
  };

  const canSubmitForSale = target !== "forsale" || (price && parseFloat(price) > 0);

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
      <DialogContent className="max-w-md !max-h-[85vh] !flex !flex-col !grid-rows-none">
        <DialogHeader className="shrink-0">
          <DialogTitle>Exporteer naar Discogs</DialogTitle>
          <DialogDescription>
            {itemCount} item{itemCount !== 1 ? 's' : ''} met Discogs ID geselecteerd.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
        {!exportResult ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Kies waar je de items wilt toevoegen:</p>
                <div className="flex gap-2">
                  <Button
                    variant={target === "collection" ? "default" : "outline"}
                    onClick={() => setTarget("collection")}
                    className="flex-1"
                    size="sm"
                  >
                    Collection
                  </Button>
                  <Button
                    variant={target === "wantlist" ? "default" : "outline"}
                    onClick={() => setTarget("wantlist")}
                    className="flex-1"
                    size="sm"
                  >
                    Wantlist
                  </Button>
                  <Button
                    variant={target === "forsale" ? "default" : "outline"}
                    onClick={() => setTarget("forsale")}
                    className="flex-1"
                    size="sm"
                  >
                    For Sale
                  </Button>
                </div>
              </div>

              {target === "forsale" && (
                <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
                  <h4 className="text-sm font-semibold">Marketplace Listing</h4>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-xs">Prijs (€) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="bijv. 12.50"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="condition" className="text-xs">Media conditie *</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger id="condition">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sleeve" className="text-xs">Hoes conditie</Label>
                    <Select value={sleeveCondition} onValueChange={setSleeveCondition}>
                      <SelectTrigger id="sleeve">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="comments" className="text-xs">Opmerkingen (optioneel)</Label>
                    <Textarea
                      id="comments"
                      placeholder="Beschrijf de staat, bijzonderheden..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Listing wordt direct actief op Discogs Marketplace.
                  </p>
                </div>
              )}
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
              <Button onClick={handleExport} disabled={isExporting || !canSubmitForSale}>
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {target === "forsale" ? `Plaats ${itemCount} listing${itemCount !== 1 ? 's' : ''}` : `Exporteer ${itemCount} items`}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
