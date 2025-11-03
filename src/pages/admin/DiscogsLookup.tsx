import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, ExternalLink, Copy, ArrowLeft, Sparkles, Search, Hash, Clock, List, Download } from 'lucide-react';

interface DiscogsResult {
  discogs_id: number;
  artist: string;
  title: string;
  year?: number;
  label?: string;
  catalog_number?: string;
  format?: string;
  thumb?: string;
  discogs_url?: string;
  search_strategy?: string;
  similarity_score?: number;
  master_id?: number;
  original_master_id?: number | string; // Set when a Master ID was converted to Release ID
}

interface SearchHistoryItem {
  artist: string;
  title: string;
  discogs_id: number;
  timestamp: number;
}

interface BulkImportRow {
  artist: string;
  title: string;
  catalog_number?: string;
}

interface BulkResult {
  artist: string;
  title: string;
  catalog_number?: string;
  status: 'success' | 'error' | 'pending' | 'processing';
  discogs_id?: number;
  discogs_url?: string;
  error?: string;
  original_master_id?: number | string; // Set when Master ID was converted
}

const DiscogsLookup = () => {
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState<'artist-album' | 'direct-id' | 'bulk'>('artist-album');
  const [artistInput, setArtistInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [catalogInput, setCatalogInput] = useState('');
  const [directIdInput, setDirectIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DiscogsResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  
  // Bulk import states
  const [bulkInput, setBulkInput] = useState('');
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  useEffect(() => {
    const history = localStorage.getItem('discogs-search-history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const saveToHistory = (artist: string, title: string, discogs_id: number) => {
    const newEntry: SearchHistoryItem = {
      artist,
      title,
      discogs_id,
      timestamp: Date.now()
    };
    const updated = [newEntry, ...searchHistory.filter(h => h.discogs_id !== discogs_id)].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem('discogs-search-history', JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (searchMode === 'artist-album' && (!artistInput.trim() || !titleInput.trim())) {
      toast({ 
        title: "⚠️ Vul Artist en Album in", 
        variant: "destructive" 
      });
      return;
    }

    if (searchMode === 'direct-id' && !directIdInput.trim()) {
      toast({ 
        title: "⚠️ Vul een Discogs ID in", 
        variant: "destructive" 
      });
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const body = searchMode === 'direct-id' 
        ? { direct_discogs_id: directIdInput.trim(), include_pricing: false }
        : {
            artist: artistInput.trim(),
            title: titleInput.trim(),
            catalog_number: catalogInput.trim() || undefined,
            include_pricing: false
          };

      const { data, error: searchError } = await supabase.functions.invoke('optimized-catalog-search', {
        body
      });

      if (searchError) throw searchError;

      if (!data?.results || data.results.length === 0) {
        const suggestion = searchMode === 'artist-album' 
          ? 'Probeer zonder "The" of andere spelling'
          : 'Controleer of het ID correct is (Release of Master ID)';
        setError(`Geen resultaten gevonden. ${suggestion}`);
        toast({
          title: "❌ Geen resultaten",
          description: suggestion,
          variant: "destructive"
        });
        return;
      }

      setResults(data.results);
      
      if (data.results.length > 0 && searchMode === 'artist-album') {
        saveToHistory(artistInput, titleInput, data.results[0].discogs_id);
      }

      toast({
        title: "✅ Resultaten gevonden!",
        description: `${data.results.length} match${data.results.length !== 1 ? 'es' : ''} gevonden`
      });

    } catch (err: any) {
      console.error('Search error:', err);
      let errorMsg = 'Er is een fout opgetreden';
      
      if (err.message?.includes('rate limit')) {
        errorMsg = 'Te veel verzoeken. Wacht 60 seconden.';
      } else if (err.message?.includes('not found')) {
        errorMsg = 'Release niet gevonden op Discogs';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      toast({
        title: "❌ Zoeken mislukt",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  const loadFromHistory = (item: SearchHistoryItem) => {
    setSearchMode('artist-album');
    setArtistInput(item.artist);
    setTitleInput(item.title);
    setCatalogInput('');
  };

  const parseAlbumLine = (line: string): BulkImportRow | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Try separators with spaces first
    const separatorsWithSpaces = [' - ', ' – ', ' — ', ', ', ' / ', ' | '];
    for (const sep of separatorsWithSpaces) {
      if (trimmed.includes(sep)) {
        const parts = trimmed.split(sep).map(p => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          return {
            artist: parts[0],
            title: parts[1],
            catalog_number: parts[2] || undefined
          };
        }
      }
    }

    // Try separators without spaces
    const separatorsNoSpaces = ['-', '–', '—', ',', '/', '|'];
    for (const sep of separatorsNoSpaces) {
      if (trimmed.includes(sep)) {
        const parts = trimmed.split(sep).map(p => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          return {
            artist: parts[0],
            title: parts[1],
            catalog_number: parts[2] || undefined
          };
        }
      }
    }

    // Fallback: intelligent word split
    // Assume first 2-3 words are artist, rest is album
    const words = trimmed.split(/\s+/);
    if (words.length >= 3) {
      // Try 2-word artist first
      const artist2 = words.slice(0, 2).join(' ');
      const title2 = words.slice(2).join(' ');
      
      // Heuristic: if album title is very short, take 3 words for artist
      if (title2.length < 5 && words.length >= 4) {
        return {
          artist: words.slice(0, 3).join(' '),
          title: words.slice(3).join(' ')
        };
      }
      
      return { artist: artist2, title: title2 };
    }

    return null; // Can't parse this line
  };

  const handleBulkParse = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      toast({ title: "❌ Voer albums in", variant: "destructive" });
      return;
    }

    const rows: BulkImportRow[] = [];
    const failedLines: string[] = [];

    lines.forEach((line, index) => {
      const parsed = parseAlbumLine(line);
      if (parsed) {
        rows.push(parsed);
      } else {
        failedLines.push(`Regel ${index + 1}: "${line}"`);
      }
    });

    if (rows.length === 0) {
      toast({ 
        title: "❌ Geen geldige rijen", 
        description: "Controleer het formaat (Artist - Album)",
        variant: "destructive" 
      });
      return;
    }

    if (failedLines.length > 0) {
      toast({
        title: `⚠️ ${failedLines.length} rij${failedLines.length > 1 ? 'en' : ''} overgeslagen`,
        description: `${rows.length} albums geladen`,
        variant: "default"
      });
    } else {
      toast({
        title: `✅ ${rows.length} albums geladen`,
        description: "Klik op 'Start Bulk Zoeken' om te beginnen"
      });
    }

    setBulkResults(rows.map(row => ({
      artist: row.artist,
      title: row.title,
      catalog_number: row.catalog_number,
      status: 'pending'
    })));
  };

  const processBulkSearch = async () => {
    if (bulkResults.length === 0) {
      console.warn('⚠️ Geen bulk results om te verwerken');
      return;
    }

    console.log(`🔄 Start bulk search voor ${bulkResults.length} albums`);
    setIsBulkProcessing(true);
    setBulkProgress(0);

    const updatedResults = [...bulkResults];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < bulkResults.length; i++) {
      const row = bulkResults[i];
      const catalogInfo = row.catalog_number ? ` (catalog: ${row.catalog_number})` : '';
      console.log(`🔍 [${i + 1}/${bulkResults.length}] Zoeken: ${row.artist} - ${row.title}${catalogInfo}`);

      // Markeer huidige rij als 'processing' en update UI direct
      updatedResults[i] = {
        ...row,
        status: 'processing',
        error: undefined,
      };
      setBulkResults([...updatedResults]);
      
      try {
        const { data, error: searchError } = await supabase.functions.invoke('optimized-catalog-search', {
          body: {
            artist: row.artist,
            title: row.title,
            catalog_number: row.catalog_number,
            include_pricing: false
          }
        });

        if (searchError) {
          console.error(`❌ [${i + 1}] Error:`, searchError);
          throw searchError;
        }

        if (data?.results && data.results.length > 0) {
          const firstResult = data.results[0];
          console.log(`✅ [${i + 1}] Gevonden: Discogs ID ${firstResult.discogs_id}`);
          updatedResults[i] = {
            ...row,
            status: 'success',
            discogs_id: firstResult.discogs_id,
            discogs_url: firstResult.discogs_url,
            original_master_id: firstResult.original_master_id
          };
          successCount++;
        } else {
          console.warn(`⚠️ [${i + 1}] Geen resultaten gevonden`);
          updatedResults[i] = {
            ...row,
            status: 'error',
            error: 'Geen resultaten'
          };
          errorCount++;
        }
      } catch (err: any) {
        console.error(`❌ [${i + 1}] Exception:`, err);
        updatedResults[i] = {
          ...row,
          status: 'error',
          error: err.message || 'Fout opgetreden'
        };
        errorCount++;
      }

      setBulkResults([...updatedResults]);
      const progress = ((i + 1) / bulkResults.length) * 100;
      setBulkProgress(progress);
      console.log(`📊 Voortgang: ${Math.round(progress)}% (${i + 1}/${bulkResults.length})`);

      // Rate limiting: wait 1 second between requests
      if (i < bulkResults.length - 1) {
        console.log('⏳ Wachten 1 seconde...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsBulkProcessing(false);
    console.log(`✅ Bulk search voltooid - Succes: ${successCount}, Fouten: ${errorCount}`);
    toast({
      title: "✅ Bulk zoeken voltooid",
      description: `${successCount} van ${bulkResults.length} gevonden`
    });
  };

  const downloadBulkResults = () => {
    const csv = [
      'Artist,Album,Discogs ID,Discogs URL,Status',
      ...bulkResults.map(r => 
        `"${r.artist}","${r.title}",${r.discogs_id || ''},${r.discogs_url || ''},${r.status}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discogs-bulk-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportToArtGenerator = () => {
    const successfulResults = bulkResults.filter(r => r.status === 'success' && r.discogs_id);
    
    if (successfulResults.length === 0) {
      toast({
        title: "⚠️ Geen resultaten om te exporteren",
        description: "Zoek eerst naar albums met succesvolle matches",
        variant: "destructive"
      });
      return;
    }

    // ✅ ALWAYS use "DiscogsID, Artist - Title" format (ID first for easy parsing)
    const formatted = successfulResults
      .map(r => {
        const artist = r.artist.trim();
        const title = r.title.trim();
        
        // ✅ If this was a Master → Release conversion, export the ORIGINAL Master ID with 'm' prefix
        const idToExport = r.original_master_id 
          ? `m${r.original_master_id}`  // Master ID with prefix
          : r.discogs_id;                // Regular Release ID
        
        return `${idToExport}, ${artist} - ${title}`;
      })
      .join('\n');

    console.log('📤 Exporting to ART Generator:', {
      count: successfulResults.length,
      format: 'DiscogsID, Artist - Title',
      preview: formatted.split('\n')[0]
    });

    toast({
      title: "📤 Exporteren naar ART Generator...",
      description: `${successfulResults.length} albums in correct formaat`
    });

    navigate('/admin/bulk-art-generator', {
      state: { importedAlbums: formatted }
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Terug
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Discogs ID Lookup
            <Badge variant="secondary">Admin Tool</Badge>
          </CardTitle>
          <CardDescription>
            Zoek Discogs Release IDs op basis van artist + album of direct via ID nummer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="artist-album">
                <Search className="w-4 h-4 mr-2" />
                Artist + Album
              </TabsTrigger>
              <TabsTrigger value="direct-id">
                <Hash className="w-4 h-4 mr-2" />
                Direct ID
              </TabsTrigger>
              <TabsTrigger value="bulk">
                <List className="w-4 h-4 mr-2" />
                Bulk Lijst
              </TabsTrigger>
            </TabsList>

            <TabsContent value="artist-album" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="artist">Artist *</Label>
                  <Input 
                    id="artist"
                    value={artistInput}
                    onChange={(e) => setArtistInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pink Floyd"
                    disabled={isSearching}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Album Title *</Label>
                  <Input 
                    id="title"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="The Wall"
                    disabled={isSearching}
                  />
                </div>
                <div>
                  <Label htmlFor="catalog">Catalog Number (optioneel)</Label>
                  <Input 
                    id="catalog"
                    value={catalogInput}
                    onChange={(e) => setCatalogInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="50999 0 97784 1 3"
                    disabled={isSearching}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="direct-id" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="direct-id">Discogs Release ID of Master ID *</Label>
                <Input 
                  id="direct-id"
                  value={directIdInput}
                  onChange={(e) => setDirectIdInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="249504"
                  disabled={isSearching}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Voer een Release ID of Master ID in (bijv. 249504). Master IDs worden automatisch geconverteerd naar een Release ID. Het resultaat toont altijd een Release ID.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-input">Plak Album Lijst</Label>
                  <Textarea 
                    id="bulk-input"
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="Pink Floyd - The Wall&#10;The Beatles - Abbey Road&#10;Led Zeppelin - IV"
                    disabled={isBulkProcessing}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Ondersteunde formaten:</strong>
                    <br />• <code>Artist - Album</code> (spatie-dash-spatie)
                    <br />• <code>Artist, Album</code> (komma)
                    <br />• <code>Artist / Album</code> (slash)
                    <br />• <code>Artist | Album</code> (pipe)
                    <br />• <code>Artist Album</code> (automatisch splitsen)
                  </p>
                </div>

                {bulkResults.length === 0 && (
                  <Button
                    onClick={handleBulkParse}
                    disabled={!bulkInput.trim() || isBulkProcessing}
                    className="w-full"
                  >
                    <List className="w-4 h-4 mr-2" />
                    Laad Albums
                  </Button>
                )}

                {bulkResults.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {bulkResults.length} albums geladen
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={processBulkSearch}
                          disabled={isBulkProcessing}
                          size="sm"
                        >
                          {isBulkProcessing ? "Bezig..." : "Start Bulk Zoeken"}
                        </Button>
                        {bulkResults.some(r => r.status === 'success') && (
                          <>
                            <Button
                              onClick={downloadBulkResults}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download CSV
                            </Button>
                            <Button
                              onClick={handleExportToArtGenerator}
                              variant="default"
                              size="sm"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Export naar ART Generator ({bulkResults.filter(r => r.status === 'success').length})
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {isBulkProcessing && (
                      <div className="space-y-2">
                        <Progress value={bulkProgress} />
                        <p className="text-xs text-muted-foreground text-center">
                          {Math.round(bulkProgress)}% voltooid
                        </p>
                      </div>
                    )}

                    <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Artist</TableHead>
                            <TableHead>Album</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>ID Type</TableHead>
                            <TableHead>Discogs ID</TableHead>
                            <TableHead>Acties</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulkResults.map((result, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{result.artist}</TableCell>
                              <TableCell>{result.title}</TableCell>
                              <TableCell>
                                {result.status === 'pending' && <Badge variant="secondary">Wachten</Badge>}
                                {result.status === 'processing' && <Badge variant="secondary">Bezig…</Badge>}
                                {result.status === 'success' && <Badge variant="default">Gevonden</Badge>}
                                {result.status === 'error' && (
                                  <Badge variant="destructive">{result.error}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {result.discogs_id && (
                                  result.original_master_id ? (
                                    <Badge variant="secondary" className="text-xs">
                                      Master → Release
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="text-xs">
                                      Release
                                    </Badge>
                                  )
                                )}
                              </TableCell>
                              <TableCell>
                                {result.discogs_id && (
                                  <div className="space-y-1">
                                    <span className="font-mono font-bold">{result.discogs_id}</span>
                                    {result.original_master_id && (
                                      <div className="text-xs text-muted-foreground">
                                        (Master: {result.original_master_id})
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {result.discogs_id && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => navigate(`/admin/art-generator?discogsId=${result.discogs_id}`)}
                                    >
                                      <Sparkles className="w-4 h-4" />
                                    </Button>
                                    {result.discogs_url && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => window.open(result.discogs_url, '_blank')}
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {searchMode !== 'bulk' && (
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="w-full"
              size="lg"
            >
              {isSearching ? "Zoeken..." : "🔍 Zoek op Discogs"}
            </Button>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && searchMode === 'artist-album' && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Recent gezocht</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 5).map((item) => (
                  <Button
                    key={item.timestamp}
                    variant="outline"
                    size="sm"
                    onClick={() => loadFromHistory(item)}
                    className="text-xs"
                  >
                    {item.artist} - {item.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fout</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Grid */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {results.length} Resultaten
                </h3>
              </div>
              
              <div className="grid gap-4">
                {results.map((result) => (
                  <Card key={result.discogs_id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        {result.thumb && (
                          <div className="flex-shrink-0">
                            <img 
                              src={result.thumb} 
                              alt={result.title}
                              className="w-24 h-24 object-cover rounded-lg shadow-md"
                            />
                          </div>
                        )}
                        
                        {/* Metadata */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-lg">{result.artist}</p>
                              <p className="text-muted-foreground">{result.title}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="flex items-center gap-2 justify-end">
                                {result.original_master_id ? (
                                  <Badge variant="secondary" className="text-xs">
                                    Master ID → Release ID
                                  </Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs">
                                    Release ID
                                  </Badge>
                                )}
                              </div>
                              {result.original_master_id && (
                                <div className="text-xs text-muted-foreground">
                                  Master: {result.original_master_id}
                                </div>
                              )}
                              <p className="text-2xl font-bold text-primary">
                                {result.discogs_id}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {result.year && (
                              <div>
                                <span className="text-muted-foreground">Year:</span>{' '}
                                <span className="font-medium">{result.year}</span>
                              </div>
                            )}
                            {result.label && (
                              <div>
                                <span className="text-muted-foreground">Label:</span>{' '}
                                <span className="font-medium">{result.label}</span>
                              </div>
                            )}
                            {result.format && (
                              <div>
                                <span className="text-muted-foreground">Format:</span>{' '}
                                <span className="font-medium">{result.format}</span>
                              </div>
                            )}
                            {result.catalog_number && (
                              <div>
                                <span className="text-muted-foreground">Cat#:</span>{' '}
                                <span className="font-medium">{result.catalog_number}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {result.search_strategy && (
                              <Badge variant="secondary" className="text-xs">
                                {result.search_strategy}
                              </Badge>
                            )}
                            {result.similarity_score !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                Score: {result.similarity_score.toFixed(2)}
                              </Badge>
                            )}
                            {result.master_id && !result.original_master_id && (
                              <Badge variant="outline" className="text-xs">
                                Master: {result.master_id}
                              </Badge>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => navigate(`/admin/art-generator?discogsId=${result.discogs_id}`)}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Maak ART Product
                            </Button>
                            {result.discogs_url && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(result.discogs_url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Discogs
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(result.discogs_id.toString());
                                toast({ title: "✅ ID gekopieerd!" });
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Examples */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchMode('artist-album');
                setArtistInput('Pink Floyd');
                setTitleInput('The Wall');
                setCatalogInput('');
              }}
            >
              Pink Floyd - The Wall
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchMode('artist-album');
                setArtistInput('The Beatles');
                setTitleInput('Abbey Road');
                setCatalogInput('');
              }}
            >
              The Beatles - Abbey Road
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchMode('direct-id');
                setDirectIdInput('249504');
              }}
            >
              Direct ID: 249504
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscogsLookup;
