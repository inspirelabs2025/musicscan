import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";

interface RefetchProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: number;
  total: number;
  successCount: number;
  errorCount: number;
  noArtworkCount: number;
  currentProduct?: {
    artist?: string;
    title?: string;
    status?: string;
  };
  isComplete: boolean;
  results?: any[];
}

export const RefetchProgressDialog = ({
  open,
  onOpenChange,
  current,
  total,
  successCount,
  errorCount,
  noArtworkCount,
  currentProduct,
  isComplete,
  results = []
}: RefetchProgressDialogProps) => {
  const progress = total > 0 ? (current / total) * 100 : 0;

  const downloadResults = () => {
    if (!results.length) return;

    const csv = [
      'Product ID,Status,Artwork URL,Source,Error',
      ...results.map(r => 
        `${r.product_id},${r.status},${r.artwork_url || ''},${r.source || ''},${r.error || ''}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artwork-refetch-results-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isComplete ? '✅ Verwerking voltooid' : '🔄 Artwork ophalen...'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{current} van {total} verwerkt</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Current product */}
          {!isComplete && currentProduct && (
            <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">Bezig met:</p>
              <p className="font-medium">
                {currentProduct.artist} - {currentProduct.title}
              </p>
            </div>
          )}

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {successCount}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                ✅ Succesvol
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {errorCount}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                ❌ Fouten
              </div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {noArtworkCount}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                ⏭️ Geen artwork
              </div>
            </div>
          </div>

          {/* Download results button */}
          {isComplete && results.length > 0 && (
            <Button 
              onClick={downloadResults} 
              variant="outline" 
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download resultaten (CSV)
            </Button>
          )}

          {/* Close button */}
          {isComplete && (
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full"
            >
              Sluiten
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
