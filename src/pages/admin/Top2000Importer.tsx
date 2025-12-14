import React, { useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileJson, Table, Play, CheckCircle, Loader2, Download, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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

// Beschikbare Top 2000 editiejaren
const EDITION_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export default function Top2000Importer() {
  const queryClient = useQueryClient();
  const [parsedData, setParsedData] = useState<ImportEntry[]>([]);
  const [clearExisting, setClearExisting] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [selectedEditionYear, setSelectedEditionYear] = useState<number | null>(null);

  // Fetch existing data stats using proper COUNT queries (avoid 1000 row limit)
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['top2000-stats'],
    queryFn: async () => {
      // Get total count
      const { count: totalCount } = await supabase
        .from('top2000_entries')
        .select('*', { count: 'exact', head: true });
      
      // Get counts per edition year - need high limit to get all years across 20k entries
      const { data: yearData } = await supabase
        .from('top2000_entries')
        .select('year')
        .order('year')
        .limit(25000);
      
      const years = yearData ? [...new Set(yearData.map((e: any) => e.year))].sort() as number[] : [];
      
      // For each year, get the count (we need separate queries due to Supabase limitations)
      const yearCounts: Record<number, number> = {};
      for (const year of years) {
        const { count } = await supabase
          .from('top2000_entries')
          .select('*', { count: 'exact', head: true })
          .eq('year', year);
        yearCounts[year] = count || 0;
      }
      
      const { data: analyses } = await supabase
        .from('top2000_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      return {
        totalEntries: totalCount || 0,
        years,
        yearCounts,
        latestAnalysis: analyses?.[0] || null,
      };
    },
  });

  // Clear all data
  const handleClearAll = async () => {
    if (!confirm('Weet je zeker dat je ALLE Top 2000 data wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }
    
    setIsClearingAll(true);
    try {
      const { error } = await supabase
        .from('top2000_entries')
        .delete()
        .gte('year', 1900); // Delete all entries
      
      if (error) throw error;
      
      toast.success('Alle Top 2000 data verwijderd');
      setParsedData([]);
      queryClient.invalidateQueries({ queryKey: ['top2000-stats'] });
    } catch (error: any) {
      toast.error(error.message || 'Fout bij verwijderen');
    } finally {
      setIsClearingAll(false);
    }
  };

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

  const parseCSV = (text: string, editionYear: number): ImportEntry[] => {
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
    let positionCounter = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line, delimiter);
      const entry: any = {
        year: editionYear, // Altijd het geselecteerde editiejaar
      };

      headers.forEach((header, idx) => {
        const value = (values[idx] ?? '').trim();
        const h = header.replace(/['"]/g, '');

        // 'jaar' of 'year' in CSV wordt nu release_year (jaar van uitbrengen)
        if (h === 'year' || h === 'jaar') {
          entry.release_year = value ? parseInt(value, 10) : undefined;
        }
        else if (h === 'position' || h === 'positie' || h === 'pos') entry.position = value ? parseInt(value, 10) : undefined;
        else if (h === 'artist' || h === 'artiest') entry.artist = value || undefined;
        else if (h === 'title' || h === 'titel' || h === 'song' || h === 'nummer') entry.title = value || undefined;
        else if (h === 'album') entry.album = value || undefined;
        else if (h === 'release_year' || h === 'releasejaar' || h === 'release') entry.release_year = value ? parseInt(value, 10) : undefined;
        else if (h === 'genres' || h === 'genre') entry.genres = value ? value.split(/[;|]/).map(g => g.trim()).filter(Boolean) : undefined;
        else if (h === 'country' || h === 'land') entry.country = value || undefined;
      });

      // Positie automatisch toekennen op volgorde als niet aanwezig
      if (!entry.position || Number.isNaN(entry.position)) {
        positionCounter++;
        entry.position = positionCounter;
      }

      // Vereist: artiest, titel. Year en position worden automatisch gezet.
      if (entry.artist && entry.title) {
        entries.push(entry);
      } else {
        console.warn(`Top2000 rij ${i + 1} overgeslagen, ontbrekende verplichte velden`, {
          artist: entry.artist,
          title: entry.title,
        });
      }
    }

    console.log(`Top2000 CSV parsing: ${entries.length} geldige entries voor editie ${editionYear}`);
    return entries;
  };

  const parseJSON = (text: string, editionYear: number): ImportEntry[] => {
    const data = JSON.parse(text);
    const rawEntries = Array.isArray(data) ? data : data.entries || data.data || [];
    
    return rawEntries
      .filter((e: any) => e.artist && e.title)
      .map((e: any, idx: number) => ({
        year: editionYear,
        position: e.position || idx + 1,
        artist: e.artist,
        title: e.title,
        album: e.album,
        release_year: e.year || e.jaar || e.release_year,
        genres: e.genres,
        country: e.country,
      }));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!selectedEditionYear) {
      toast.error('Selecteer eerst een Top 2000 editiejaar');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        let parsed: ImportEntry[];
        if (file.name.endsWith('.json')) {
          parsed = parseJSON(text, selectedEditionYear);
        } else {
          parsed = parseCSV(text, selectedEditionYear);
        }
        setParsedData(parsed);
        toast.success(`${parsed.length} entries geparsed voor Top 2000 ${selectedEditionYear}`);
      } catch (error) {
        toast.error('Fout bij parsen van bestand');
        console.error('Top2000 parse error:', error);
      }
    };
    reader.readAsText(file);
  }, [selectedEditionYear]);

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
              <p className="text-muted-foreground">Import en analyseer Top 2000 data (2016-2025)</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleClearAll}
                disabled={isClearingAll || (stats?.totalEntries || 0) === 0}
              >
                {isClearingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Wis Alle Data
              </Button>
            </div>
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
                <CardTitle className="text-sm font-medium">Edities in Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {stats?.years?.map((year: number) => (
                    <Badge 
                      key={year} 
                      variant={stats?.yearCounts?.[year] === 2000 ? "default" : "secondary"}
                      title={`${stats?.yearCounts?.[year] || 0} entries`}
                    >
                      {year} ({stats?.yearCounts?.[year] || 0})
                    </Badge>
                  ))}
                  {(stats?.years?.length || 0) === 0 && (
                    <span className="text-muted-foreground text-sm">Geen data</span>
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
                  <CardTitle>Stap 1: Selecteer Top 2000 Editie</CardTitle>
                  <CardDescription>
                    Kies het jaar van de Top 2000 lijst die je wilt importeren
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Select
                      value={selectedEditionYear?.toString() || ''}
                      onValueChange={(val) => {
                        setSelectedEditionYear(parseInt(val, 10));
                        setParsedData([]); // Reset parsed data when changing year
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecteer editiejaar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {EDITION_YEARS.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            Top 2000 van {year}
                            {stats?.yearCounts?.[year] ? ` (${stats.yearCounts[year]} in DB)` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedEditionYear && (
                      <Badge variant="outline" className="text-lg px-4 py-1">
                        Editie: {selectedEditionYear}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stap 2: Upload Bestand</CardTitle>
                  <CardDescription>
                    Upload een CSV of JSON bestand met de Top 2000 {selectedEditionYear || ''} data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${!selectedEditionYear ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                  >
                    <input {...getInputProps()} disabled={!selectedEditionYear} />
                    <FileJson className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    {!selectedEditionYear ? (
                      <p className="text-muted-foreground">Selecteer eerst een editiejaar hierboven</p>
                    ) : isDragActive ? (
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
                  <CardTitle>Kolom Mapping</CardTitle>
                  <CardDescription>
                    Het editiejaar wordt automatisch ingesteld op basis van je selectie hierboven.
                    De "jaar" kolom in je CSV wordt gebruikt als release_year (jaar van uitbrengen).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Badge>artist / artiest</Badge>
                      <p className="text-muted-foreground mt-1">Verplicht</p>
                    </div>
                    <div>
                      <Badge>title / titel</Badge>
                      <p className="text-muted-foreground mt-1">Verplicht</p>
                    </div>
                    <div>
                      <Badge variant="outline">position / positie</Badge>
                      <p className="text-muted-foreground mt-1">Auto (volgorde)</p>
                    </div>
                    <div>
                      <Badge variant="outline">jaar / year</Badge>
                      <p className="text-muted-foreground mt-1">→ Release jaar</p>
                    </div>
                    <div>
                      <Badge variant="outline">album</Badge>
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
                            <th className="text-left p-2">Editie</th>
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
