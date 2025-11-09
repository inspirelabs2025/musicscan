import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Play, Square, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BatchResult {
  batchNumber: number;
  updated: number;
  skipped: number;
  errors: number;
  timestamp: string;
}

export const AutoBlogSlugBatchProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches] = useState(10); // 914 blogs / 100 = ~10 batches
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalUpdated, setTotalUpdated] = useState(0);
  const [totalSkipped, setTotalSkipped] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [batchHistory, setBatchHistory] = useState<BatchResult[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitTimeRemaining, setWaitTimeRemaining] = useState(0);
  const shouldStop = useRef(false);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const processBatch = async (batchNumber: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('fix-blog-slugs', {
        body: {
          only_unknown_year: true,
          limit: 100
        }
      });

      if (error) throw error;

      const result: BatchResult = {
        batchNumber,
        updated: data.updated || 0,
        skipped: data.skipped || 0,
        errors: data.errors || 0,
        timestamp: new Date().toLocaleTimeString()
      };

      setBatchHistory(prev => [...prev, result]);
      setTotalUpdated(prev => prev + result.updated);
      setTotalSkipped(prev => prev + result.skipped);
      setTotalErrors(prev => prev + result.errors);
      setTotalProcessed(prev => prev + 100);

      return result;
    } catch (error: any) {
      console.error(`Batch ${batchNumber} failed:`, error);
      toast.error(`Batch ${batchNumber} mislukt: ${error.message}`);
      throw error;
    }
  };

  const waitWithCountdown = async (seconds: number) => {
    setIsWaiting(true);
    for (let i = seconds; i > 0; i--) {
      if (shouldStop.current) break;
      setWaitTimeRemaining(i);
      await sleep(1000);
    }
    setIsWaiting(false);
    setWaitTimeRemaining(0);
  };

  const startBatchProcessing = async () => {
    setIsProcessing(true);
    shouldStop.current = false;
    setCurrentBatch(0);
    setTotalProcessed(0);
    setTotalUpdated(0);
    setTotalSkipped(0);
    setTotalErrors(0);
    setBatchHistory([]);

    toast.info("Batch processing gestart!");

    try {
      for (let i = 1; i <= totalBatches; i++) {
        if (shouldStop.current) {
          toast.warning("Batch processing gestopt door gebruiker");
          break;
        }

        setCurrentBatch(i);
        toast.info(`Batch ${i}/${totalBatches} wordt verwerkt...`);

        const result = await processBatch(i);
        
        toast.success(
          `Batch ${i} voltooid: ${result.updated} geüpdatet, ${result.skipped} overgeslagen, ${result.errors} errors`
        );

        // If no more blogs to process, stop early
        if (result.updated === 0 && result.skipped === 0) {
          toast.success("Alle blogs zijn verwerkt!");
          break;
        }

        // Wait 2 minutes between batches (except after last batch)
        if (i < totalBatches && !shouldStop.current) {
          toast.info("Wachten 2 minuten voor volgende batch (Discogs API rate limit)...");
          await waitWithCountdown(120);
        }
      }

      if (!shouldStop.current) {
        toast.success(
          `✅ Batch processing voltooid! ${totalUpdated} blogs geüpdatet, ${totalErrors} errors`
        );
      }
    } catch (error: any) {
      toast.error(`Batch processing mislukt: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setIsWaiting(false);
      shouldStop.current = false;
    }
  };

  const stopProcessing = () => {
    shouldStop.current = true;
    toast.warning("Stoppen na huidige batch...");
  };

  const progress = totalBatches > 0 ? (currentBatch / totalBatches) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 Automatische Blog Slug Batch Processor</CardTitle>
        <CardDescription>
          Verwerkt alle ~914 blogs met '-unknown' in batches van 100 met 2 minuten pauze
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={startBatchProcessing}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Batch Processing
              </>
            )}
          </Button>
          
          {isProcessing && (
            <Button
              onClick={stopProcessing}
              variant="destructive"
              disabled={shouldStop.current}
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          )}
        </div>

        {/* Progress Section */}
        {isProcessing && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Batch {currentBatch}/{totalBatches}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>

            {/* Wait Timer */}
            {isWaiting && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Wachten op Discogs API rate limit: {waitTimeRemaining} seconden
                </AlertDescription>
              </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{totalUpdated}</div>
                  <p className="text-xs text-muted-foreground">Geüpdatet</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{totalSkipped}</div>
                  <p className="text-xs text-muted-foreground">Overgeslagen</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{totalProcessed}</div>
                  <p className="text-xs text-muted-foreground">Verwerkt</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Batch History */}
        {batchHistory.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Batch History</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {batchHistory.map((batch) => (
                <div
                  key={batch.batchNumber}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {batch.errors > 0 ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    <span className="font-medium">Batch #{batch.batchNumber}</span>
                    <span className="text-sm text-muted-foreground">{batch.timestamp}</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">✓ {batch.updated}</span>
                    <span className="text-muted-foreground">⊘ {batch.skipped}</span>
                    {batch.errors > 0 && (
                      <span className="text-red-600">✗ {batch.errors}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <Alert>
          <AlertDescription>
            <strong>💡 Info:</strong> Elke batch verwerkt 100 blogs. Na elke batch wordt 2 minuten
            gewacht vanwege Discogs API rate limits (60 requests/min). Totale verwachte tijd: ~20-25
            minuten.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
