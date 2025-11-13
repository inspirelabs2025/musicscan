import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Pause, RotateCcw, FileText, Music, Trash2, ExternalLink, RefreshCw, ImageIcon } from 'lucide-react';
import { useSinglesImport } from '@/hooks/useSinglesImport';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface SingleData {
  artist: string;
  single_name: string;
  album?: string;
  year?: number;
  label?: string;
  catalog?: string;
  discogs_id?: number;
  genre?: string;
  styles?: string[];
}

export const SinglesImporter = () => {
  const [inputText, setInputText] = useState('');
  const [parsedSingles, setParsedSingles] = useState<SingleData[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [missingArtworkCount, setMissingArtworkCount] = useState(0);
  const { toast } = useToast();
  const {
    importSingles,
    startBatchProcessing,
    stopBatchProcessing,
    getBatchStatus,
    retryFailed,
    clearQueue,
    backfillArtwork,
    isImporting,
    isBatchProcessing,
    isBackfilling,
  } = useSinglesImport();

  // Poll batch status every 5 seconds when there's an active batch
  useEffect(() => {
    const pollStatus = async () => {
      const status = await getBatchStatus();
      setBatchStatus(status);
    };

    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load artwork stats
  useEffect(() => {
    const loadArtworkStats = async () => {
      const { count } = await supabase
        .from('music_stories')
        .select('*', { count: 'exact', head: true })
        .not('single_name', 'is', null)
        .is('artwork_url', null);
      
      setMissingArtworkCount(count || 0);
    };
    
    loadArtworkStats();
    const interval = setInterval(loadArtworkStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-parse with debounce
  useEffect(() => {
    if (!inputText.trim()) {
      setParsedSingles([]);
      return;
    }

    const timer = setTimeout(() => {
      parseInput();
    }, 500);

    return () => clearTimeout(timer);
  }, [inputText]);

  const parseInput = useCallback(() => {
    const lines = inputText.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      setParsedSingles([]);
      return;
    }

    const singles: SingleData[] = [];

    for (const line of lines) {
      // Parse formats:
      // "Artist - Song"
      // "Artist - Song (Year)"
      // "Artist - Song [Album]"
      // "Artist - Song (Year) [Album]"
      const match = line.match(/^(.+?)\s*[-—–]\s*(.+?)(?:\s*\((\d{4})\))?(?:\s*\[(.+?)\])?$/);
      
      if (match) {
        const [, artist, song, year, album] = match;
        singles.push({
          artist: artist.trim(),
          single_name: song.trim(),
          year: year ? parseInt(year) : undefined,
          album: album?.trim()
        });
      }
    }

    setParsedSingles(singles);
  }, [inputText]);

  const handleImport = async () => {
    if (parsedSingles.length === 0) {
      toast({
        title: "No Data",
        description: "Please parse singles data first",
        variant: "destructive",
      });
      return;
    }

    const result = await importSingles(parsedSingles);
    if (result?.success) {
      setBatchId(result.batch_id || null);
    }
  };

  const handleStartBatch = async () => {
    const success = await startBatchProcessing();
    if (success) {
      setTimeout(() => getBatchStatus(), 1000);
    }
  };

  const handleStopBatch = async () => {
    await stopBatchProcessing();
    setTimeout(() => getBatchStatus(), 1000);
  };

  const handleRetryFailed = async () => {
    await retryFailed();
    setTimeout(() => getBatchStatus(), 1000);
  };

  const handleBackfillArtwork = async (refetchAll: boolean = false) => {
    console.log('🖼️ [COMPONENT] handleBackfillArtwork called with refetchAll:', refetchAll);
    console.log('🖼️ [COMPONENT] Current missing count:', missingArtworkCount);
    
    try {
      console.log('🖼️ [COMPONENT] Calling backfillArtwork hook...');
      const result = await backfillArtwork(refetchAll);
      console.log('🖼️ [COMPONENT] backfillArtwork returned:', result);
      
      if (result) {
        console.log('🖼️ [COMPONENT] Refreshing artwork stats...');
        // Refresh artwork stats after backfill
        const { count } = await supabase
          .from('music_stories')
          .select('*', { count: 'exact', head: true })
          .not('single_name', 'is', null)
          .is('artwork_url', null);
        console.log('🖼️ [COMPONENT] New missing count:', count);
        setMissingArtworkCount(count || 0);
      } else {
        console.warn('⚠️ [COMPONENT] backfillArtwork returned null/falsy result');
      }
    } catch (error) {
      console.error('❌ [COMPONENT] Exception in handleBackfillArtwork:', error);
      toast({
        variant: "destructive",
        title: "Component Error",
        description: "Unexpected error in artwork handler"
      });
    }
  };

  const activeBatch = batchStatus?.batch;
  const queueStats = batchStatus?.queue_stats || { pending: 0, completed: 0, failed: 0 };
  const totalItems = activeBatch?.total_items || 0;
  const processedItems = activeBatch?.processed_items || 0;
  const progress = totalItems > 0 ? (processedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Artwork Maintenance Card */}
      {missingArtworkCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <ImageIcon className="h-5 w-5" />
              🎨 Artwork Maintenance
            </CardTitle>
            <CardDescription>
              Automatisch artwork toevoegen aan singles zonder afbeelding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-amber-300 dark:border-amber-800">
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300">
                    {missingArtworkCount} singles zonder artwork
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => handleBackfillArtwork(false)} 
                disabled={isBackfilling}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isBackfilling ? 'animate-spin' : ''}`} />
                {isBackfilling ? 'Bezig...' : 'Fix Missing Only'}
              </Button>
              
              <Button 
                onClick={() => handleBackfillArtwork(true)} 
                disabled={isBackfilling}
                className="flex-1"
                variant="secondary"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isBackfilling ? 'animate-spin' : ''}`} />
                {isBackfilling ? 'Bezig...' : 'Refetch All Artwork'}
              </Button>
            </div>

            {isBackfilling && (
              <div className="text-sm text-muted-foreground text-center">
                Artwork wordt opgehaald...
                <br />
                Dit kan enkele minuten duren.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Singles Bulk Import & Automatische Verwerking
          </CardTitle>
          <CardDescription>
            Importeer een lijst met singles en laat ze automatisch verwerken tot muziekverhalen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Input */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Stap 1: Plak Singles (één per regel)
            </h3>
            <Textarea
              placeholder={`Plak hier je singles, één per regel:

The Beatles - Hey Jude
Queen - Bohemian Rhapsody (1975)
Madonna - Like a Prayer [Like a Prayer]
Prince - Purple Rain (1984) [Purple Rain]

Format: Artist - Song
Optioneel: (Jaar) en/of [Album]`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            {parsedSingles.length > 0 && (
              <div className="text-sm text-muted-foreground">
                ✓ {parsedSingles.length} singles herkend
              </div>
            )}
          </div>

          {/* Step 2: Preview */}
          {parsedSingles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Stap 2: Preview</h3>
              <Alert>
                <AlertDescription>
                  <Badge variant="default">{parsedSingles.length} singles klaar voor import</Badge>
                </AlertDescription>
              </Alert>
              <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                {parsedSingles.slice(0, 10).map((single, index) => (
                  <div key={index} className="text-sm border-l-2 border-primary pl-3 py-1">
                    <div className="font-medium">{single.artist} - {single.single_name}</div>
                    {single.year && <div className="text-muted-foreground text-xs">Year: {single.year}</div>}
                  </div>
                ))}
                {parsedSingles.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    ... en {parsedSingles.length - 10} meer
                  </div>
                )}
              </div>
              <Button onClick={handleImport} disabled={isImporting}>
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importeren...' : `Importeer ${parsedSingles.length} Singles naar Queue`}
              </Button>
            </div>
          )}

          {/* Step 3: Start Processing */}
          {(batchId || queueStats.pending > 0) && (
            <div className="space-y-2">
              <h3 className="font-semibold">Stap 3: Start Automatische Verwerking</h3>
              <Alert>
                <AlertDescription>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{queueStats.pending} wachtend</Badge>
                    <Badge variant="default">{queueStats.completed} voltooid</Badge>
                    <Badge variant="destructive">{queueStats.failed} gefaald</Badge>
                  </div>
                </AlertDescription>
              </Alert>
              <div className="flex gap-2 flex-wrap">
                {!activeBatch || activeBatch.status !== 'running' ? (
                  <Button onClick={handleStartBatch} disabled={isBatchProcessing}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Batch Processing
                  </Button>
                ) : (
                  <Button onClick={handleStopBatch} variant="destructive">
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Batch
                  </Button>
                )}
                {queueStats.failed > 0 && (
                  <Button onClick={handleRetryFailed} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry Failed
                  </Button>
                )}
                {queueStats.pending > 0 && (
                  <Button onClick={async () => {
                    const success = await clearQueue();
                    if (success) {
                      setBatchStatus(await getBatchStatus());
                    }
                  }} variant="outline">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Queue
                  </Button>
                )}
              </div>
              {/* Logs Monitoring */}
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar/functions/import-singles-batch/logs', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Import Logs
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar/functions/singles-batch-processor/logs', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Processor Logs
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://supabase.com/dashboard/project/ssxbpyqnjfiyubsuonar/functions/generate-single-story/logs', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Generator Logs
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Monitor Progress */}
          {activeBatch && activeBatch.status === 'running' && (
            <div className="space-y-2">
              <h3 className="font-semibold">Stap 4: Voortgang</h3>
              <Progress value={progress} className="h-2" />
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Verwerkt:</span>
                  <span className="font-medium">{processedItems} / {totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span>Succesvol:</span>
                  <span className="text-green-600 font-medium">{activeBatch.successful_items || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gefaald:</span>
                  <span className="text-red-600 font-medium">{activeBatch.failed_items || 0}</span>
                </div>
                {activeBatch.current_items && (
                  <div className="pt-2 border-t">
                    <div className="font-medium text-xs text-muted-foreground">Nu bezig:</div>
                    <div className="text-sm">
                      {activeBatch.current_items.artist} - {activeBatch.current_items.single_name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Format Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formaat Voorbeelden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Basis formaat:</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`The Beatles - Hey Jude
Queen - Bohemian Rhapsody`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Met jaar:</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Queen - Bohemian Rhapsody (1975)
Prince - Purple Rain (1984)`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Met album:</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Madonna - Like a Prayer [Like a Prayer]
Prince - Purple Rain [Purple Rain]`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Compleet (jaar + album):</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`Prince - Purple Rain (1984) [Purple Rain]
Michael Jackson - Billie Jean (1983) [Thriller]`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
