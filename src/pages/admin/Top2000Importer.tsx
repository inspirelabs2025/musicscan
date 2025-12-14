import React, { useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, FileJson, Table, Play, CheckCircle, AlertCircle, Loader2, Download, RefreshCw } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ImportEntry {
  year: number;
  position: number;
  artist: string;
  title: string;
  album?: string;
  release_year?: number;
  genres?: string[];
  country?: string;
}

export default function Top2000Importer() {
  const queryClient = useQueryClient();
  const [parsedData, setParsedData] = useState<ImportEntry[]>([]);
  const [clearExisting, setClearExisting] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch existing data stats
  const { data: stats } = useQuery({
    queryKey: ['top2000-stats'],
    queryFn: async () => {
      const { data: entries } = await supabase
        .from('top2000_entries')
        .select('year', { count: 'exact' });
      
      const { data: analyses } = await supabase
        .from('top2000_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      const years = entries ? [...new Set(entries.map((e: any) => e.year))].sort() : [];
      
      return {
        totalEntries: entries?.length || 0,
        years: years as number[],
        latestAnalysis: analyses?.[0] || null,
      };
    },
  });

  // Parse CSV line handling quoted values with commas inside
  // Parse a single CSV line using a specific delimiter and handling quotes
  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.length > 0) {
      result.push(current.trim());
    }

    return result.map(v => v.replace(/^"|"$/g, ''));
  };

  // Detect most likely delimiter from header line
  const detectDelimiter = (headerLine: string): string => {
    const candidates = [',', ';', '\t'];
    let best = ',';
    let bestCount = 0;

    for (const d of candidates) {
      const count = (headerLine.match(new RegExp(`\\${d}`, 'g')) || []).length;
      if (count > bestCount) {
        best = d;
        bestCount = count;
      }
    }

    return best;
  };

  const parseCSV = (text: string): ImportEntry[] => {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      console.warn('CSV heeft geen datarijen');
      return [];
    }

    const delimiter = detectDelimiter(lines[0]);
    console.log('Top2000 CSV delimiter gedetecteerd:', delimiter === '\t' ? 'TAB' : delimiter);

    const headers = parseCSVLine(lines[0].toLowerCase(), delimiter).map(h => h.trim());
    console.log('Top2000 CSV headers:', headers);

    const entries: ImportEntry[] = [];
    const perYearPositionCounter: Record<number, number> = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line, delimiter);
      const entry: any = {};

      headers.forEach((header, idx) => {
        const value = (values[idx] ?? '').trim();
        const h = header.replace(/['"]/g, '');

        if (h === 'year' || h === 'jaar') entry.year = value ? parseInt(value, 10) : undefined;
        else if (h === 'position' || h === 'positie' || h === 'pos') entry.position = value ? parseInt(value, 10) : undefined;
        else if (h === 'artist' || h === 'artiest') entry.artist = value || undefined;
        else if (h === 'title' || h === 'titel' || h === 'song' || h === 'nummer') entry.title = value || undefined;
        else if (h === 'album') entry.album = value || undefined;
        else if (h === 'release_year' || h === 'releasejaar' || h === 'release') entry.release_year = value ? parseInt(value, 10) : undefined;
        else if (h === 'genres' || h === 'genre') entry.genres = value ? value.split(/[;|]/).map(g => g.trim()).filter(Boolean) : undefined;
        else if (h === 'country' || h === 'land') entry.country = value || undefined;
      });

      // Fallback: als positie ontbreekt, bepaal positie op basis van volgorde per jaar
      if (entry.year && (!entry.position || Number.isNaN(entry.position))) {
        const current = perYearPositionCounter[entry.year] ?? 0;
        entry.position = current + 1;
        perYearPositionCounter[entry.year] = entry.position;
      }

      // Vereist: jaar, artiest, titel. Positie vullen we desnoods zelf in.
      if (entry.year && entry.artist && entry.title && entry.position) {
        entries.push(entry);
      } else {
        console.warn(`Top2000 rij ${i + 1} overgeslagen, ontbrekende verplichte velden`, {
          year: entry.year,
          position: entry.position,
          artist: entry.artist,
          title: entry.title,
        });
      }
    }

    console.log(`Top2000 CSV parsing: ${entries.length} geldige entries van ${lines.length - 1} datarijen`);
    return entries;
  };
  const parseJSON = (text: string): ImportEntry[] => {
    const data = JSON.parse(text);
    const entries = Array.isArray(data) ? data : data.entries || data.data || [];
    return entries.filter((e: any) => e.year && e.artist && e.title);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        let parsed: ImportEntry[];
        if (file.name.endsWith('.json')) {
          parsed = parseJSON(text);
        } else {
          parsed = parseCSV(text);
        }
        setParsedData(parsed);
        toast.success(`${parsed.length} entries geparsed`);
      } catch (error) {
        toast.error('Fout bij parsen van bestand');
        console.error('Top2000 parse error:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('Geen data om te importeren');
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-top2000', {
        body: { entries: parsedData, clear_existing: clearExisting },
      });

      if (error) throw error;

      toast.success(`${data.inserted} entries geïmporteerd`);
      queryClient.invalidateQueries({ queryKey: ['top2000-stats'] });
      
      // Analysis starts automatically
      if (data.inserted > 0) {
        toast.info('AI analyse wordt automatisch gestart...');
        setIsAnalyzing(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Import mislukt');
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-top2000', {
        body: { force: true },
      });

      if (error) throw error;

      toast.success(`Analyse voltooid in ${data.generation_time_ms}ms`);
      queryClient.invalidateQueries({ queryKey: ['top2000-stats'] });
    } catch (error: any) {
      toast.error(error.message || 'Analyse mislukt');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadTemplate = () => {
    const template = `year,position,artist,title,album,release_year,genres,country
2024,1,Queen,Bohemian Rhapsody,A Night at the Opera,1975,Rock;Classic Rock,UK
2024,2,Eagles,Hotel California,Hotel California,1977,Rock,US
2024,3,Golden Earring,Radar Love,Moontan,1973,Rock,Netherlands`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'top2000_template.csv';
    a.click();
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Top 2000 Importer</h1>
              <p className="text-muted-foreground">Import en analyseer Top 2000 data</p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Totaal Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEntries?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.years?.length || 0} jaren
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Jaren in Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {stats?.years?.slice(-5).map((year: number) => (
                    <Badge key={year} variant="secondary">{year}</Badge>
                  ))}
                  {(stats?.years?.length || 0) > 5 && (
                    <Badge variant="outline">+{(stats?.years?.length || 0) - 5}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Laatste Analyse</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.latestAnalysis ? (
                  <div className="space-y-1">
                    <div className="text-sm">
                      {new Date(stats.latestAnalysis.created_at).toLocaleDateString('nl-NL')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.latestAnalysis.years_covered?.length || 0} jaren geanalyseerd
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nog geen analyse</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="import">
            <TabsList>
              <TabsTrigger value="import">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Table className="h-4 w-4 mr-2" />
                Preview ({parsedData.length})
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <Play className="h-4 w-4 mr-2" />
                Analyse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bestand Uploaden</CardTitle>
                  <CardDescription>
                    Upload een CSV of JSON bestand met Top 2000 data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                  >
                    <input {...getInputProps()} />
                    <FileJson className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    {isDragActive ? (
                      <p>Drop het bestand hier...</p>
                    ) : (
                      <div>
                        <p className="font-medium">Sleep een bestand hierheen of klik om te selecteren</p>
                        <p className="text-sm text-muted-foreground mt-1">CSV of JSON formaat</p>
                      </div>
                    )}
                  </div>

                  {parsedData.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{parsedData.length} entries geparsed</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="clear-existing"
                            checked={clearExisting}
                            onCheckedChange={setClearExisting}
                          />
                          <Label htmlFor="clear-existing">Bestaande data overschrijven</Label>
                        </div>
                        <Button onClick={handleImport} disabled={isImporting}>
                          {isImporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Importeren
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vereiste Kolommen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Badge>year / jaar</Badge>
                      <p className="text-muted-foreground mt-1">Verplicht</p>
                    </div>
                    <div>
                      <Badge>position / positie</Badge>
                      <p className="text-muted-foreground mt-1">Verplicht</p>
                    </div>
                    <div>
                      <Badge>artist / artiest</Badge>
                      <p className="text-muted-foreground mt-1">Verplicht</p>
                    </div>
                    <div>
                      <Badge>title / titel</Badge>
                      <p className="text-muted-foreground mt-1">Verplicht</p>
                    </div>
                    <div>
                      <Badge variant="outline">album</Badge>
                      <p className="text-muted-foreground mt-1">Optioneel</p>
                    </div>
                    <div>
                      <Badge variant="outline">release_year</Badge>
                      <p className="text-muted-foreground mt-1">Optioneel</p>
                    </div>
                    <div>
                      <Badge variant="outline">genres</Badge>
                      <p className="text-muted-foreground mt-1">Optioneel (;)</p>
                    </div>
                    <div>
                      <Badge variant="outline">country / land</Badge>
                      <p className="text-muted-foreground mt-1">Optioneel</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>Eerste 100 entries van het geüploade bestand</CardDescription>
                </CardHeader>
                <CardContent>
                  {parsedData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Jaar</th>
                            <th className="text-left p-2">Pos</th>
                            <th className="text-left p-2">Artiest</th>
                            <th className="text-left p-2">Titel</th>
                            <th className="text-left p-2">Album</th>
                            <th className="text-left p-2">Release</th>
                            <th className="text-left p-2">Land</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 100).map((entry, i) => (
                            <tr key={i} className="border-b hover:bg-muted/50">
                              <td className="p-2">{entry.year}</td>
                              <td className="p-2">{entry.position}</td>
                              <td className="p-2">{entry.artist}</td>
                              <td className="p-2">{entry.title}</td>
                              <td className="p-2 text-muted-foreground">{entry.album || '-'}</td>
                              <td className="p-2">{entry.release_year || '-'}</td>
                              <td className="p-2">{entry.country || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsedData.length > 100 && (
                        <p className="text-center text-muted-foreground mt-4">
                          + {parsedData.length - 100} meer entries...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>Upload eerst een bestand om de preview te zien</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis">
              <Card>
                <CardHeader>
                  <CardTitle>AI Analyse</CardTitle>
                  <CardDescription>
                    Start een culturele analyse van de Top 2000 data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    De AI analyse wordt automatisch gestart na een succesvolle import.
                    Je kunt hier ook handmatig een nieuwe analyse starten.
                  </p>

                  <Button 
                    onClick={handleManualAnalysis} 
                    disabled={isAnalyzing || (stats?.totalEntries || 0) === 0}
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {isAnalyzing ? 'Analyseren...' : 'Nieuwe Analyse Starten'}
                  </Button>

                  {stats?.latestAnalysis?.main_narrative && stats.latestAnalysis.main_narrative !== 'PENDING' && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Laatste Analyse Resultaat</h4>
                      <p className="text-sm">{stats.latestAnalysis.main_narrative}</p>
                      
                      {stats.latestAnalysis.key_insights && (
                        <div className="mt-4">
                          <h5 className="font-medium text-sm mb-2">Key Insights</h5>
                          <ul className="text-sm space-y-1">
                            {(stats.latestAnalysis.key_insights as any[]).slice(0, 5).map((insight: any, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <Badge variant="outline" className="shrink-0">{insight.category}</Badge>
                                <span>{insight.insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
