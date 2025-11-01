import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Sparkles, Download, Eye, Loader2, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AlbumInput {
  artist: string;
  title: string;
  price: number;
  originalLine: string;
}

interface ProcessingResult {
  input: AlbumInput;
  status: 'pending' | 'searching' | 'creating' | 'success' | 'exists' | 'error';
  discogsId?: number;
  productId?: string;
  productSlug?: string;
  error?: string;
}

export default function BulkArtGenerator() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("49.95");
  const [albums, setAlbums] = useState<AlbumInput[]>([]);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const parseInput = (text: string): AlbumInput[] => {
    const price = parseFloat(defaultPrice) || 49.95;
    
    return text
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        let artist = '', title = '';
        const trimmedLine = line.trim();
        
        // Support multiple formats: Artist - Album, Artist | Album, Artist, Album
        if (trimmedLine.includes(' - ')) {
          [artist, title] = trimmedLine.split(' - ').map(s => s.trim());
        } else if (trimmedLine.includes('|')) {
          [artist, title] = trimmedLine.split('|').map(s => s.trim());
        } else if (trimmedLine.includes(',')) {
          [artist, title] = trimmedLine.split(',').map(s => s.trim());
        }
        
        return {
          artist,
          title,
          price,
          originalLine: trimmedLine
        };
      })
      .filter(item => item.artist && item.title);
  };

  const handleParseInput = () => {
    const parsed = parseInput(inputText);
    
    if (parsed.length === 0) {
      toast({
        title: "❌ Geen albums gevonden",
        description: "Controleer je input format (Artist - Album per regel)",
        variant: "destructive"
      });
      return;
    }
    
    setAlbums(parsed);
    setResults([]);
    toast({
      title: "✅ Input geparsed",
      description: `${parsed.length} albums gevonden en klaar voor verwerking`,
    });
  };

  const processBatch = async () => {
    if (albums.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: albums.length });
    
    const initialResults: ProcessingResult[] = albums.map(album => ({
      input: album,
      status: 'pending'
    }));
    setResults(initialResults);

    const chunkSize = 5;
    
    for (let i = 0; i < albums.length; i += chunkSize) {
      const chunk = albums.slice(i, i + chunkSize);
      
      await Promise.allSettled(
        chunk.map(async (album, index) => {
          const resultIndex = i + index;
          
          try {
            // Update status to searching
            setResults(prev => {
              const updated = [...prev];
              updated[resultIndex] = { ...updated[resultIndex], status: 'searching' };
              return updated;
            });
            
            // Call create-art-product (handles search + creation)
            const { data, error } = await supabase.functions.invoke('create-art-product', {
              body: {
                artist: album.artist,
                title: album.title,
                price: album.price
              }
            });
            
            if (error) {
              const errorMessage = error.message || '';
              const status = error.status || error?.context?.response?.status;
              
              // Handle "already exists" as warning, not error
              if (status === 409 || errorMessage.includes('already exists')) {
                setResults(prev => {
                  const updated = [...prev];
                  updated[resultIndex] = {
                    ...updated[resultIndex],
                    status: 'exists',
                    error: 'Product bestaat al'
                  };
                  return updated;
                });
              } else if (errorMessage.includes('No results found')) {
                setResults(prev => {
                  const updated = [...prev];
                  updated[resultIndex] = {
                    ...updated[resultIndex],
                    status: 'error',
                    error: 'Niet gevonden op Discogs'
                  };
                  return updated;
                });
              } else {
                throw error;
              }
            } else {
              // Success
              setResults(prev => {
                const updated = [...prev];
                updated[resultIndex] = {
                  ...updated[resultIndex],
                  status: 'success',
                  productId: data.product_id,
                  productSlug: data.product_slug,
                  discogsId: data.discogs_id
                };
                return updated;
              });
            }
          } catch (error: any) {
            setResults(prev => {
              const updated = [...prev];
              updated[resultIndex] = {
                ...updated[resultIndex],
                status: 'error',
                error: error.message || 'Onbekende fout'
              };
              return updated;
            });
          }
          
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        })
      );
      
      // Small delay between chunks
      if (i + chunkSize < albums.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setIsProcessing(false);
    
    const successCount = results.filter(r => r.status === 'success').length;
    const existsCount = results.filter(r => r.status === 'exists').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    toast({
      title: "🎉 Batch Verwerking Voltooid",
      description: `✅ ${successCount} aangemaakt | ⚠️ ${existsCount} bestond al | ❌ ${errorCount} fouten`,
    });
  };

  const downloadResults = () => {
    const csv = [
      ['Artist', 'Album', 'Status', 'Discogs ID', 'Product ID', 'Error'].join(','),
      ...results.map(r => [
        r.input.artist,
        r.input.title,
        r.status,
        r.discogsId || '',
        r.productId || '',
        r.error || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-art-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: ProcessingResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'searching':
      case 'creating':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'exists':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ProcessingResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Wacht</Badge>;
      case 'searching':
        return <Badge className="bg-blue-500">Zoeken...</Badge>;
      case 'creating':
        return <Badge className="bg-blue-600">Aanmaken...</Badge>;
      case 'success':
        return <Badge className="bg-green-500">Aangemaakt</Badge>;
      case 'exists':
        return <Badge className="bg-yellow-500">Bestaat al</Badge>;
      case 'error':
        return <Badge variant="destructive">Fout</Badge>;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const existsCount = results.filter(r => r.status === 'exists').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/platform-products')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Bulk ART Generator
            </h1>
            <p className="text-muted-foreground">
              Importeer meerdere albums tegelijk - volledig geautomatiseerd
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="input-text" className="text-base font-semibold">
              📋 Plak je lijst hier (Artist - Album per regel)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Ondersteunde formaten: "Artist - Album", "Artist | Album", "Artist, Album"
            </p>
            <Textarea
              id="input-text"
              placeholder={"Pink Floyd - The Wall\nThe Beatles - Abbey Road\nLed Zeppelin - IV"}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              disabled={isProcessing}
            />
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="default-price">💰 Standaard Prijs (€)</Label>
              <Input
                id="default-price"
                type="number"
                step="0.01"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <Button onClick={handleParseInput} disabled={!inputText.trim() || isProcessing}>
              <Upload className="w-4 h-4 mr-2" />
              Parse Input
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview & Processing */}
      {albums.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                📋 Preview ({albums.length} albums gevonden)
              </h2>
              {!isProcessing && results.length === 0 && (
                <Button onClick={processBatch} size="lg" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  Start Batch Processing
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress: {progress.current} / {progress.total}</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}

            {/* Results Summary */}
            {results.length > 0 && (
              <div className="flex gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-semibold">{successCount}</span>
                  <span className="text-sm text-muted-foreground">Aangemaakt</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">{existsCount}</span>
                  <span className="text-sm text-muted-foreground">Bestond al</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="font-semibold">{errorCount}</span>
                  <span className="text-sm text-muted-foreground">Fouten</span>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Artist</th>
                      <th className="text-left p-3 font-semibold">Album</th>
                      <th className="text-left p-3 font-semibold">Prijs</th>
                      <th className="text-left p-3 font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(results.length > 0 ? results : albums.map(a => ({ input: a, status: 'pending' as const }))).map((result, index) => (
                      <tr key={index} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            {getStatusBadge(result.status)}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{result.input.artist}</td>
                        <td className="p-3">{result.input.title}</td>
                        <td className="p-3">€{result.input.price.toFixed(2)}</td>
                        <td className="p-3">
                          {result.error && (
                            <span className="text-sm text-red-500">{result.error}</span>
                          )}
                          {result.discogsId && (
                            <span className="text-sm text-muted-foreground">
                              Discogs: {result.discogsId}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            {results.length > 0 && !isProcessing && (
              <div className="flex gap-2">
                <Button onClick={downloadResults} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button onClick={() => navigate('/admin/platform-products')} variant="default">
                  <Eye className="w-4 h-4 mr-2" />
                  Bekijk Producten
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Help Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-2">💡 Tips</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Elk album op een nieuwe regel</li>
          <li>• Format: "Artist - Album" of "Artist | Album" of "Artist, Album"</li>
          <li>• Systeem verwerkt automatisch in batches van 5 albums tegelijk</li>
          <li>• Duplicates worden automatisch gedetecteerd (⚠️ warning, geen error)</li>
          <li>• Download het rapport na afloop voor een compleet overzicht</li>
        </ul>
      </Card>
    </div>
  );
}
