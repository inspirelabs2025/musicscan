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
import { useLanguage } from "@/contexts/LanguageContext";

const CONDITION_OPTIONS = [
  "Mint (M)", "Near Mint (NM or M-)", "Very Good Plus (VG+)",
  "Very Good (VG)", "Good Plus (G+)", "Good (G)", "Fair (F)", "Poor (P)",
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
  const { tr } = useLanguage();
  const sc = tr.scanCollectionUI;
  const [target, setTarget] = useState<"collection" | "wantlist" | "forsale">("collection");
  const { exportToDiscogs, isExporting, exportResult, clearResult } = useDiscogsExport();
  const { isConnected } = useDiscogsConnection();

  const [price, setPrice] = useState(defaultPrice?.toString() || "");
  const [condition, setCondition] = useState(defaultCondition || "Very Good Plus (VG+)");
  const [sleeveCondition, setSleeveCondition] = useState("Very Good Plus (VG+)");
  const [comments, setComments] = useState("");

  const handleExport = async () => {
    const listingData = target === "forsale" ? {
      price: parseFloat(price), condition, sleeve_condition: sleeveCondition, comments: comments || undefined,
    } : undefined;
    await exportToDiscogs(discogsIds, target, listingData);
  };

  const handleClose = () => { clearResult(); onOpenChange(false); };
  const canSubmitForSale = target !== "forsale" || (price && parseFloat(price) > 0);

  if (!isConnected) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sc.discogsNotConnected}</DialogTitle>
            <DialogDescription>{sc.discogsNotConnectedDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => onOpenChange(false)}>{sc.close}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md !max-h-[85vh] !flex !flex-col !grid-rows-none">
        <DialogHeader className="shrink-0">
          <DialogTitle>{sc.exportToDiscogs}</DialogTitle>
          <DialogDescription>
            {sc.itemsSelected.replace('{count}', String(itemCount)).replace('{plural}', itemCount !== 1 ? 's' : '')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
        {!exportResult ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{sc.chooseTarget}</p>
                <div className="flex gap-2">
                  <Button variant={target === "collection" ? "default" : "outline"} onClick={() => setTarget("collection")} className="flex-1" size="sm">Collection</Button>
                  <Button variant={target === "wantlist" ? "default" : "outline"} onClick={() => setTarget("wantlist")} className="flex-1" size="sm">Wantlist</Button>
                  <Button variant={target === "forsale" ? "default" : "outline"} onClick={() => setTarget("forsale")} className="flex-1" size="sm">For Sale</Button>
                </div>
              </div>

              {target === "forsale" && (
                <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
                  <h4 className="text-sm font-semibold">{sc.marketplaceListing}</h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-xs">{sc.priceEur}</Label>
                    <Input id="price" type="number" step="0.01" min="0.01" placeholder={sc.priceExample} value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="condition" className="text-xs">{sc.mediaCondition}</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger id="condition"><SelectValue /></SelectTrigger>
                      <SelectContent>{CONDITION_OPTIONS.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sleeve" className="text-xs">{sc.sleeveCondition}</Label>
                    <Select value={sleeveCondition} onValueChange={setSleeveCondition}>
                      <SelectTrigger id="sleeve"><SelectValue /></SelectTrigger>
                      <SelectContent>{CONDITION_OPTIONS.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="comments" className="text-xs">{sc.remarksOptional}</Label>
                    <Textarea id="comments" placeholder={sc.describeState} value={comments} onChange={(e) => setComments(e.target.value)} rows={2} />
                  </div>
                  <p className="text-xs text-muted-foreground">{sc.listingActive}</p>
                </div>
              )}
            </div>

            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {sc.exporting.replace('{count}', String(itemCount))}
                </div>
                <Progress value={undefined} className="h-2" />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isExporting}>{sc.cancel}</Button>
              <Button onClick={handleExport} disabled={isExporting || !canSubmitForSale}>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {target === "forsale" 
                  ? sc.placeListing.replace('{count}', String(itemCount)).replace('{plural}', itemCount !== 1 ? 's' : '')
                  : sc.exportItems.replace('{count}', String(itemCount))}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">{sc.succeeded.replace('{count}', String(exportResult.successful))}</span>
              </div>
              {exportResult.failed > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">{sc.failedCount.replace('{count}', String(exportResult.failed))}</span>
                </div>
              )}
              {exportResult.failed > 0 && (
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-1">
                  {exportResult.results.filter(r => !r.success).map((r, i) => (<div key={i}>ID {r.discogs_id}: {r.error}</div>))}
                </div>
              )}
            </div>
            <DialogFooter><Button onClick={handleClose}>{sc.close}</Button></DialogFooter>
          </>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
