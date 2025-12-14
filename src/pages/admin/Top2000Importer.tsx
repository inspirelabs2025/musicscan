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
import { Progress } from '@/components/ui/progress';
import { Upload, FileJson, Table, Play, CheckCircle, Loader2, Download, RefreshCw, Trash2, AlertCircle, Search, Zap, FileText } from 'lucide-react';
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

// Beschikbare Top 2000 editiejaren (uitgebreid voor scraping)
const EDITION_YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const SCRAPE_YEARS = Array.from({ length: 27 }, (_, i) => 1999 + i); // 1999-2025

export default function Top2000Importer() {
  const queryClient = useQueryClient();
  const [parsedData, setParsedData] = useState<ImportEntry[]>([]);
  const [clearExisting, setClearExisting] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [selectedEditionYear, setSelectedEditionYear] = useState<number | null>(null);
  
  // Scraping state
  const [scrapeYear, setScrapeYear] = useState<number | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [scrapedData, setScrapedData] = useState<ImportEntry[]>([]);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // PDF parsing state
  const [pdfEditionYear, setPdfEditionYear] = useState<number | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [pdfParsedData, setPdfParsedData] = useState<ImportEntry[]>([]);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfParsingNotes, setPdfParsingNotes] = useState<string | null>(null);

  // Scrape via Perplexity
  const handleScrape = async () => {
    if (!scrapeYear) {
      toast.error('Selecteer eerst een editiejaar');
      return;
    }

    setIsScraping(true);
    setScrapeProgress(0);
    setScrapedData([]);
    setScrapeError(null);

    const allEntries: ImportEntry[] = [];
    const batchSize = 100; // Posities per request
    const totalBatches = 20; // 2000 / 100 = 20 batches

    try {
      for (let batch = 0; batch < totalBatches; batch++) {
        const startPos = batch * batchSize + 1;
        const endPos = (batch + 1) * batchSize;

        console.log(`Scraping batch ${batch + 1}/${totalBatches}: posities ${startPos}-${endPos}`);

        const { data, error } = await supabase.functions.invoke('scrape-top2000-perplexity', {
          body: {
            edition_year: scrapeYear,
            start_position: startPos,
            end_position: endPos,
          },
        });

        if (error) throw error;

        if (!data?.success) {
          throw new Error(data?.error || 'Scraping mislukt');
        }

        // Add entries with correct year
        const entries = (data.entries || []).map((e: any) => ({
          ...e,
          year: scrapeYear,
        }));
        
        allEntries.push(...entries);
        setScrapeProgress(((batch + 1) / totalBatches) * 100);
        setScrapedData([...allEntries]);

        // Rate limiting delay
        if (batch < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      toast.success(`${allEntries.length} entries gescraped voor Top 2000 ${scrapeYear}`);
    } catch (error: any) {
      console.error('Scrape error:', error);
      setScrapeError(error.message || 'Scraping mislukt');
      toast.error(error.message || 'Scraping mislukt');
    } finally {
      setIsScraping(false);
    }
  };

  // PDF Upload Handler - processes in 4 batches of 500 entries
  const handlePdfUpload = async (file: File) => {
    if (!pdfEditionYear) {
      toast.error('Selecteer eerst een Top 2000 editiejaar');
      return;
    }

    setIsParsing(true);
    setPdfError(null);
    setPdfParsedData([]);
    setPdfParsingNotes(null);

    const batches = [
      { start: 1, end: 500 },
      { start: 501, end: 1000 },
      { start: 1001, end: 1250 },
      { start: 1251, end: 1350 },
      { start: 1351, end: 1450 },
      { start: 1451, end: 1500 },
      { start: 1501, end: 2000 },
    ];

    let allEntries: any[] = [];

    try {
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        toast.info(`Batch ${i + 1}/${batches.length}: Posities ${batch.start}-${batch.end}...`);

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('edition_year', pdfEditionYear.toString());
        formData.append('start_position', batch.start.toString());
        formData.append('end_position', batch.end.toString());

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-top2000-pdf`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Batch ${i + 1} parsing mislukt`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || `Batch ${i + 1} parsing mislukt`);
        }

        allEntries = [...allEntries, ...data.entries];
        setPdfParsedData([...allEntries]);
        
        // Small delay between batches
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setPdfParsingNotes(`${allEntries.length} entries gevonden in ${batches.length} batches`);
      toast.success(`${allEntries.length} entries gevonden in PDF voor Top 2000 ${pdfEditionYear}`);
    } catch (error: any) {
      console.error('PDF parsing error:', error);
      setPdfError(error.message || 'PDF parsing mislukt');
      toast.error(error.message || 'PDF parsing mislukt');
    } finally {
      setIsParsing(false);
    }
  };

  // Import PDF parsed data
  const handleImportPdfData = async () => {
    if (pdfParsedData.length === 0) {
      toast.error('Geen geparseerde PDF data om te importeren');
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-top2000', {
        body: { entries: pdfParsedData, clear_existing: clearExisting },
      });

      if (error) throw error;

      toast.success(`${data.inserted} entries geïmporteerd vanuit PDF`);
      queryClient.invalidateQueries({ queryKey: ['top2000-stats'] });
      setPdfParsedData([]);
      setPdfParsingNotes(null);
    } catch (error: any) {
      toast.error(error.message || 'Import mislukt');
    } finally {
      setIsImporting(false);
    }
  };

  // PDF Dropzone
  const pdfDropzone = useDropzone({
    onDrop: (files) => {
      if (files[0]) handlePdfUpload(files[0]);
    },
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB max
    disabled: !pdfEditionYear || isParsing,
  });

  // Import scraped data
  const handleImportScraped = async () => {
    if (scrapedData.length === 0) {
      toast.error('Geen gescrapete data om te importeren');
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-top2000', {
        body: { entries: scrapedData, clear_existing: clearExisting },
      });

      if (error) throw error;

      toast.success(`${data.inserted} entries geïmporteerd vanuit scrape`);
      queryClient.invalidateQueries({ queryKey: ['top2000-stats'] });
      setScrapedData([]);
      setScrapeProgress(0);
    } catch (error: any) {
      toast.error(error.message || 'Import mislukt');
    } finally {
      setIsImporting(false);
    }
  };

  // Fetch existing data stats using proper COUNT queries (avoid 1000 row limit)
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['top2000-stats'],
    queryFn: async () => {
      // Get total count
      const { count: totalCount } = await supabase
        .from('top2000_entries')
        .select('*', { count: 'exact', head: true });
      
      // Query each possible year directly (2016-2025) to avoid 1000 row limit issues
      const yearCounts: Record<number, number> = {};
      const years: number[] = [];
      
      const yearPromises = Array.from({ length: 10 }, (_, i) => 2016 + i).map(async (year) => {
        const { count } = await supabase
          .from('top2000_entries')
          .select('*', { count: 'exact', head: true })
          .eq('year', year);
        return { year, count: count || 0 };
      });
      
      const results = await Promise.all(yearPromises);
      results.forEach(({ year, count }) => {
        if (count > 0) {
          years.push(year);
          yearCounts[year] = count;
        }
      });
      years.sort((a, b) => a - b);
      
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

          <Tabs defaultValue="pdf">
            <TabsList>
              <TabsTrigger value="pdf">
                <FileText className="h-4 w-4 mr-2" />
                PDF Import
              </TabsTrigger>
              <TabsTrigger value="scrape">
                <Zap className="h-4 w-4 mr-2" />
                Scrape
              </TabsTrigger>
              <TabsTrigger value="import">
                <Upload className="h-4 w-4 mr-2" />
                CSV/JSON
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Table className="h-4 w-4 mr-2" />
                Preview ({parsedData.length + scrapedData.length + pdfParsedData.length})
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <Play className="h-4 w-4 mr-2" />
                Analyse
              </TabsTrigger>
            </TabsList>

            {/* PDF Import Tab */}
            <TabsContent value="pdf" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    PDF Import met AI Parsing
                  </CardTitle>
                  <CardDescription>
                    Upload een PDF bestand met de Top 2000 lijst. AI extraheert automatisch alle entries.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Select
                      value={pdfEditionYear?.toString() || ''}
                      onValueChange={(val) => {
                        setPdfEditionYear(parseInt(val, 10));
                        setPdfParsedData([]);
                        setPdfError(null);
                        setPdfParsingNotes(null);
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
                    {pdfEditionYear && (
                      <Badge variant="outline" className="text-lg px-4 py-1">
                        Editie: {pdfEditionYear}
                      </Badge>
                    )}
                  </div>

                  <div
                    {...pdfDropzone.getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${!pdfEditionYear || isParsing ? 'opacity-50 cursor-not-allowed' : ''}
                      ${pdfDropzone.isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                  >
                    <input {...pdfDropzone.getInputProps()} />
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    {!pdfEditionYear ? (
                      <p className="text-muted-foreground">Selecteer eerst een editiejaar hierboven</p>
                    ) : isParsing ? (
                      <div className="space-y-2">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                        <p>PDF wordt geanalyseerd door AI...</p>
                        <p className="text-sm text-muted-foreground">Dit kan even duren afhankelijk van de grootte</p>
                      </div>
                    ) : pdfDropzone.isDragActive ? (
                      <p>Drop de PDF hier...</p>
                    ) : (
                      <div>
                        <p className="font-medium">Sleep een PDF hierheen of klik om te selecteren</p>
                        <p className="text-sm text-muted-foreground mt-1">Max 10MB, alleen .pdf bestanden</p>
                      </div>
                    )}
                  </div>

                  {pdfError && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span>{pdfError}</span>
                    </div>
                  )}

                  {pdfParsingNotes && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <strong>AI notities:</strong> {pdfParsingNotes}
                    </div>
                  )}

                  {pdfParsedData.length > 0 && !isParsing && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>{pdfParsedData.length} entries gevonden in PDF voor {pdfEditionYear}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              id="clear-existing-pdf"
                              checked={clearExisting}
                              onCheckedChange={setClearExisting}
                            />
                            <Label htmlFor="clear-existing-pdf">Overschrijf bestaande data</Label>
                          </div>
                          <Button onClick={handleImportPdfData} disabled={isImporting}>
                            {isImporting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Importeren
                          </Button>
                        </div>
                      </div>

                      {/* Preview eerste 10 entries */}
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-3 py-2 text-left">#</th>
                              <th className="px-3 py-2 text-left">Artiest</th>
                              <th className="px-3 py-2 text-left">Titel</th>
                              <th className="px-3 py-2 text-left">Release</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pdfParsedData.slice(0, 10).map((entry, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-3 py-2">{entry.position}</td>
                                <td className="px-3 py-2">{entry.artist}</td>
                                <td className="px-3 py-2">{entry.title}</td>
                                <td className="px-3 py-2">{entry.release_year || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {pdfParsedData.length > 10 && (
                          <div className="px-3 py-2 bg-muted text-sm text-muted-foreground text-center">
                            ... en nog {pdfParsedData.length - 10} entries
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Hoe werkt PDF Import?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• AI (Gemini) analyseert de PDF en extraheert automatisch alle entries</li>
                    <li>• Ondersteunt verschillende PDF formaten en tabelstructuren</li>
                    <li>• Herkent positie, artiest, titel en jaar van release</li>
                    <li>• Controleer de preview voordat je importeert</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scrape Tab */}
            <TabsContent value="scrape" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Scrape via Perplexity AI
                  </CardTitle>
                  <CardDescription>
                    Haal automatisch Top 2000 data op via Perplexity AI (1999-2025)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Select
                      value={scrapeYear?.toString() || ''}
                      onValueChange={(val) => {
                        setScrapeYear(parseInt(val, 10));
                        setScrapedData([]);
                        setScrapeProgress(0);
                        setScrapeError(null);
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecteer editiejaar..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {SCRAPE_YEARS.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            Top 2000 van {year}
                            {stats?.yearCounts?.[year] ? ` (${stats.yearCounts[year]} in DB)` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      onClick={handleScrape} 
                      disabled={!scrapeYear || isScraping}
                      size="lg"
                    >
                      {isScraping ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      {isScraping ? 'Scraping...' : 'Start Scraping'}
                    </Button>
                  </div>

                  {isScraping && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Scraping Top 2000 {scrapeYear}...</span>
                        <span>{Math.round(scrapeProgress)}%</span>
                      </div>
                      <Progress value={scrapeProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {scrapedData.length} / 2000 posities opgehaald
                      </p>
                    </div>
                  )}

                  {scrapeError && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span>{scrapeError}</span>
                    </div>
                  )}

                  {scrapedData.length > 0 && !isScraping && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>{scrapedData.length} entries gescraped voor {scrapeYear}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              id="clear-existing-scrape"
                              checked={clearExisting}
                              onCheckedChange={setClearExisting}
                            />
                            <Label htmlFor="clear-existing-scrape">Overschrijf bestaande data</Label>
                          </div>
                          <Button onClick={handleImportScraped} disabled={isImporting}>
                            {isImporting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Importeren
                          </Button>
                        </div>
                      </div>

                      {/* Preview eerste 10 entries */}
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-3 py-2 text-left">#</th>
                              <th className="px-3 py-2 text-left">Artiest</th>
                              <th className="px-3 py-2 text-left">Titel</th>
                              <th className="px-3 py-2 text-left">Jaar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scrapedData.slice(0, 10).map((entry, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-3 py-2">{entry.position}</td>
                                <td className="px-3 py-2">{entry.artist}</td>
                                <td className="px-3 py-2">{entry.title}</td>
                                <td className="px-3 py-2">{entry.release_year || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {scrapedData.length > 10 && (
                          <div className="px-3 py-2 bg-muted text-sm text-muted-foreground text-center">
                            ... en nog {scrapedData.length - 10} entries
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Hoe werkt het?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Perplexity AI doorzoekt het web naar officiële Top 2000 data</li>
                    <li>• Data wordt opgehaald in batches van 100 posities</li>
                    <li>• Complete scrape duurt ~30-40 seconden</li>
                    <li>• Controleer de preview voordat je importeert</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

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
