import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Pause, RotateCcw, FileText, Music } from 'lucide-react';
import { useSinglesImport } from '@/hooks/useSinglesImport';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { toast } = useToast();
  const {
    importSingles,
    startBatchProcessing,
    stopBatchProcessing,
    getBatchStatus,
    retryFailed,
    isImporting,
    isBatchProcessing,
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

  const parseInput = () => {
    try {
      // Try JSON first
      const data = JSON.parse(inputText);
      if (Array.isArray(data)) {
        setParsedSingles(data);
        toast({
          title: "Parsed Successfully",
          description: `Found ${data.length} singles`,
        });
        return;
      }
    } catch (e) {
      // Try CSV parsing
      const lines = inputText.trim().split('\n');
      if (lines.length < 2) {
        toast({
          title: "Parse Error",
          description: "No data found",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const singles: SingleData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const single: any = {};

        headers.forEach((header, index) => {
          const value = values[index];
          if (header === 'year' || header === 'discogs_id') {
            single[header] = value ? parseInt(value) : undefined;
          } else if (header === 'styles') {
            single[header] = value ? value.split(';') : [];
          } else {
            single[header] = value || undefined;
          }
        });

        if (single.artist && single.single_name) {
          singles.push(single);
        }
      }

      setParsedSingles(singles);
      toast({
        title: "Parsed Successfully",
        description: `Found ${singles.length} singles`,
      });
    }
  };

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

  const activeBatch = batchStatus?.batch;
  const queueStats = batchStatus?.queue_stats || { pending: 0, completed: 0, failed: 0 };
  const totalItems = activeBatch?.total_items || 0;
  const processedItems = activeBatch?.processed_items || 0;
  const progress = totalItems > 0 ? (processedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
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
              Stap 1: Plak JSON of CSV Data
            </h3>
            <Textarea
              placeholder='JSON: [{"artist":"Madonna","single_name":"Like a Prayer","year":1989}]\nof CSV:\nartist,single_name,album,year\n"Madonna","Like a Prayer","Like a Prayer",1989'
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <Button onClick={parseInput} disabled={!inputText}>
              <Upload className="h-4 w-4 mr-2" />
              Parse Data
            </Button>
          </div>

          {/* Step 2: Preview */}
          {parsedSingles.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Stap 2: Preview & Validatie</h3>
              <Alert>
                <AlertDescription>
                  <div className="flex items-center gap-4">
                    <Badge variant="default">{parsedSingles.length} singles gevonden</Badge>
                    <span className="text-sm text-muted-foreground">
                      Verplicht: artist + single_name
                    </span>
                  </div>
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
              <div className="flex gap-2">
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
          <CardTitle className="text-base">Data Formaat Hulp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">JSON Formaat:</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "artist": "Madonna",
    "single_name": "Like a Prayer",
    "album": "Like a Prayer",
    "year": 1989,
    "label": "Sire",
    "genre": "Pop"
  }
]`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">CSV Formaat:</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`artist,single_name,album,year,label,genre
"Madonna","Like a Prayer","Like a Prayer",1989,"Sire","Pop"
"Prince","Purple Rain","Purple Rain",1984,"Warner Bros.","Rock"`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
