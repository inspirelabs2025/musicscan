import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, CheckCircle2, XCircle, Clock, Search, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

interface AlbumInput {
  artist: string;
  title: string;
  price?: number;
  discogsId?: number;
  idType?: 'master' | 'release';
  masterId?: number;
  verifiedArtist?: string;
  verifiedTitle?: string;
  matchStatus?: 'idle' | 'verifying' | 'match' | 'partial' | 'mismatch' | 'search' | 'error';
  similarity?: number;
  error?: string;
  originalLine?: string;
}

interface ProcessingResult extends AlbumInput {
  status: 'pending' | 'searching' | 'creating' | 'success' | 'exists' | 'error';
  productId?: string;
  productSlug?: string;
  message?: string;
}

const BulkArtGenerator = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [defaultPrice, setDefaultPrice] = useState(29.99);
  const [albums, setAlbums] = useState<AlbumInput[]>([]);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [idTypeIsMaster, setIdTypeIsMaster] = useState(true);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Normalization helper
  const normalize = (text: string): string => {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Simple similarity calculation
  const calculateSimilarity = (a: string, b: string): number => {
    const normA = normalize(a);
    const normB = normalize(b);
    
    if (normA === normB) return 1.0;
    if (normA.length === 0 || normB.length === 0) return 0;
    
    const longer = normA.length > normB.length ? normA : normB;
    const shorter = normA.length > normB.length ? normB : normA;
    
    if (longer.includes(shorter)) return 0.85;
    
    // Count matching characters
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    return matches / longer.length;
  };

  // Extract Discogs ID from various formats
  const extractDiscogsId = (text: string): { id: number; type: 'master' | 'release' } | null => {
    // Check /master/ URL
    const masterUrlMatch = text.match(/discogs\.com\/master\/(\d+)/);
    if (masterUrlMatch) return { id: parseInt(masterUrlMatch[1]), type: 'master' };
    
    // Check /release/ URL
    const releaseUrlMatch = text.match(/discogs\.com\/release\/(\d+)/);
    if (releaseUrlMatch) return { id: parseInt(releaseUrlMatch[1]), type: 'release' };
    
    // Plain number: use toggle state
    const plainNumber = text.match(/\b(\d{4,})\b/);
    if (plainNumber) {
      return { 
        id: parseInt(plainNumber[1]), 
        type: idTypeIsMaster ? 'master' : 'release' 
      };
    }
    
    return null;
  };

  // Normalize input text
  const normalizeInput = (text: string): string => {
    return text
      .replace(/\u00A0/g, ' ')
      .split(/\r?\n/)
      .map(line => line
        .replace(/[–—−‐]/g, '-')
        .replace(/\s*>\.?\s*/g, ' - ')
        .replace(/\s*-\s*/g, ' - ')
        .replace(/\s*\|\s*/g, ' | ')
        .replace(/\s*,\s*/g, ', ')
        .replace(/[ \t]+/g, ' ')
        .trim()
      )
      .filter(Boolean)
      .join('\n');
  };

  // Parse input text
  const parseInput = async () => {
    const normalizedText = normalizeInput(input);
    const lines = normalizedText.split('\n').filter(line => line.trim());
    const parsed: AlbumInput[] = [];
    const seenIds = new Set<number>();

    setIsProcessing(true);

    try {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Extract Discogs ID
        const idInfo = extractDiscogsId(trimmed);
        
        // Check if input is ONLY an ID (no artist/title)
        const isIdOnly = /^(m|r)?(\d+)$/i.test(trimmed);

        if (isIdOnly && idInfo) {
          // Skip duplicates
          if (seenIds.has(idInfo.id)) {
            console.log(`Skipping duplicate ID: ${idInfo.id}`);
            continue;
          }

          // Fetch artist/title from Discogs
          try {
            const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
              body: { 
                direct_discogs_id: idInfo.id.toString(),
                is_master: idInfo.type === 'master'
              }
            });

            if (error) throw error;

            if (data?.results?.[0]) {
              const result = data.results[0];
              parsed.push({
                artist: result.artist,
                title: result.title,
                price: defaultPrice,
                discogsId: idInfo.id,
                idType: idInfo.type,
                masterId: result.master_id,
                matchStatus: 'match',
                verifiedArtist: result.artist,
                verifiedTitle: result.title,
                similarity: 1.0,
                originalLine: trimmed
              });
              seenIds.add(idInfo.id);
              continue;
            }
          } catch (err: any) {
            console.error(`Failed to fetch data for ${idInfo.id}:`, err);
            parsed.push({
              artist: '',
              title: '',
              price: defaultPrice,
              discogsId: idInfo.id,
              idType: idInfo.type,
              matchStatus: 'error',
              error: 'Kon album data niet ophalen',
              originalLine: trimmed
            });
            seenIds.add(idInfo.id);
            continue;
          }
        }

        // Remove ID/URL from text for artist/title parsing
        let cleanText = trimmed
          .replace(/https?:\/\/[^\s]+/g, '')
          .replace(/\b\d{4,}\b/g, '')
          .trim();

        // Split on common delimiters
        const parts = cleanText.split(/[—–-]\s*|\s*-\s*/).map(p => p.trim()).filter(Boolean);
        
        if (parts.length >= 2) {
          const artist = parts[0];
          const title = parts.slice(1).join(' - ');
          
          // Skip duplicates
          if (idInfo && seenIds.has(idInfo.id)) {
            console.log(`Skipping duplicate ID: ${idInfo.id}`);
            continue;
          }

          const album: AlbumInput = {
            artist,
            title,
            price: defaultPrice,
            matchStatus: 'idle',
            originalLine: trimmed
          };

          if (idInfo) {
            album.discogsId = idInfo.id;
            album.idType = idInfo.type;
            seenIds.add(idInfo.id);
          }

          parsed.push(album);
        }
      }

      setAlbums(parsed);
      setResults(parsed.map(a => ({ ...a, status: 'pending' })));
      
      toast({
        title: "✅ Lijst geparsed",
        description: `${parsed.length} albums gevonden`,
      });
    } catch (err: any) {
      console.error('Parse error:', err);
      toast({
        title: "❌ Parse fout",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Verify list with Discogs API
  const handleVerifyList = async () => {
    if (albums.length === 0) {
      toast({
        title: "⚠️ Geen albums",
        description: "Parse eerst de input lijst",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    const verified: AlbumInput[] = [];

    try {
      for (let i = 0; i < albums.length; i++) {
        const album = albums[i];
        
        // Skip albums that are already verified during parse
        if (album.matchStatus === 'match') {
          verified.push(album);
          continue;
        }
        
        // Update status
        setAlbums(prev => prev.map((a, idx) => 
          idx === i ? { ...a, matchStatus: 'verifying' } : a
        ));

        if (!album.discogsId) {
          // No ID → fallback to search
          verified.push({ ...album, matchStatus: 'search' });
          continue;
        }

        try {
          // Call optimized-catalog-search
          const { data, error } = await supabase.functions.invoke('optimized-catalog-search', {
            body: { 
              direct_discogs_id: album.discogsId.toString(),
              is_master: album.idType === 'master'
            }
          });

          if (error) throw error;

          if (!data || !data.results || data.results.length === 0) {
            verified.push({ 
              ...album, 
              matchStatus: 'error',
              error: 'Geen resultaten gevonden'
            });
            continue;
          }

          const result = data.results[0];
          const inputNorm = normalize(`${album.artist} ${album.title}`);
          const resultNorm = normalize(`${result.artist} ${result.title}`);
          
          const similarity = calculateSimilarity(inputNorm, resultNorm);

          if (similarity >= 0.8) {
            verified.push({ 
              ...album, 
              matchStatus: 'match',
              verifiedArtist: result.artist,
              verifiedTitle: result.title,
              masterId: result.master_id,
              similarity
            });
          } else if (similarity >= 0.5) {
            verified.push({ 
              ...album, 
              matchStatus: 'partial',
              verifiedArtist: result.artist,
              verifiedTitle: result.title,
              similarity
            });
          } else {
            verified.push({ 
              ...album, 
              matchStatus: 'mismatch',
              verifiedArtist: result.artist,
              verifiedTitle: result.title,
              similarity
            });
          }
        } catch (err: any) {
          console.error(`Verification error for ${album.artist} - ${album.title}:`, err);
          verified.push({ 
            ...album, 
            matchStatus: 'error',
            error: err.message
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setAlbums(verified);
      setResults(verified.map(a => ({ ...a, status: 'pending' })));
      
      const matches = verified.filter(a => a.matchStatus === 'match').length;
      const mismatches = verified.filter(a => a.matchStatus === 'mismatch').length;

      toast({
        title: "🔍 Verificatie voltooid",
        description: `${matches} matches, ${mismatches} mismatches`,
      });
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: "❌ Verificatie fout",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Process batch
  const processBatch = async () => {
    if (albums.length === 0) {
      toast({
        title: "⚠️ Geen albums om te verwerken",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const batchSize = 5;
    let completed = 0;

    for (let i = 0; i < albums.length; i += batchSize) {
      const batch = albums.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (album, batchIndex) => {
          const index = i + batchIndex;

          // Skip mismatches
          if (album.matchStatus === 'mismatch') {
            setResults(prev => prev.map((r, idx) => 
              idx === index 
                ? { ...r, status: 'error', message: '❌ ID mismatch - overgeslagen' }
                : r
            ));
            completed++;
            setProgress((completed / albums.length) * 100);
            return;
          }

          setResults(prev => prev.map((r, idx) => 
            idx === index ? { ...r, status: 'creating' } : r
          ));

          try {
            const requestBody: any = {
              artist: album.verifiedArtist || album.artist,
              title: album.verifiedTitle || album.title,
              price: album.price || defaultPrice
            };

            // Priority: masterId from verification > masterId from input > discogsId
            if (album.masterId) {
              requestBody.master_id = album.masterId;
            } else if (album.discogsId && album.idType === 'master') {
              requestBody.master_id = album.discogsId;
            } else if (album.discogsId) {
              requestBody.discogs_id = album.discogsId;
            }

            console.log(`Creating product for ${album.artist} - ${album.title}`, requestBody);

            const { data, error } = await supabase.functions.invoke('create-art-product', {
              body: requestBody
            });

            // Handle 409 "already exists" errors
            if (error) {
              if (error.message?.includes('already exists') || 
                  error.context?.response?.status === 409) {
                setResults(prev => prev.map((r, idx) => 
                  idx === index 
                    ? { 
                        ...r, 
                        status: 'exists',
                        productId: error.context?.body?.product_id,
                        message: '⚠️ Product bestaat al'
                      }
                    : r
                ));
              } else {
                throw error;
              }
            } else if (data.success && data.product_id) {
              setResults(prev => prev.map((r, idx) => 
                idx === index 
                  ? { 
                      ...r, 
                      status: 'success',
                      productId: data.product_id,
                      productSlug: data.product_slug,
                      blogId: data.blog_id,
                      message: `✅ ${data.message || 'Aangemaakt'}`
                    }
                  : r
              ));
            }
          } catch (error: any) {
            console.error(`Error creating product for ${album.artist} - ${album.title}:`, error);
            setResults(prev => prev.map((r, idx) => 
              idx === index 
                ? { ...r, status: 'error', message: `❌ ${error.message}` }
                : r
            ));
          }

          completed++;
          setProgress((completed / albums.length) * 100);
        })
      );

      // Delay between batches
      if (i + batchSize < albums.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsProcessing(false);
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    toast({
      title: "🎉 Batch verwerking voltooid",
      description: `${successful} succesvol, ${failed} gefaald`,
    });
  };

  // Download results as CSV
  const downloadResults = () => {
    const csv = [
      ['Artist', 'Title', 'Status', 'Product ID', 'Slug', 'Message'].join(','),
      ...results.map(r => [
        r.artist,
        r.title,
        r.status,
        r.productId || '',
        r.productSlug || '',
        r.message || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `art-products-${Date.now()}.csv`;
    a.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'exists': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'creating': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'searching': return <Search className="h-4 w-4 animate-pulse" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: 'default',
      error: 'destructive',
      exists: 'secondary',
      pending: 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getMatchIcon = (status?: string) => {
    switch (status) {
      case 'match': return '✅';
      case 'partial': return '⚠️';
      case 'mismatch': return '❌';
      case 'search': return '🔍';
      case 'verifying': return '⏳';
      case 'error': return '❌';
      default: return '—';
    }
  };

  const getRowClassName = (matchStatus?: string) => {
    switch (matchStatus) {
      case 'match': return 'bg-green-50 dark:bg-green-950/20';
      case 'partial': return 'bg-yellow-50 dark:bg-yellow-950/20';
      case 'mismatch': return 'bg-red-50 dark:bg-red-950/20';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
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
            <p className="text-muted-foreground">Genereer meerdere merchandise producten tegelijk</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🎨 Bulk Art Product Generator</CardTitle>
          <CardDescription>
            Genereer meerdere merchandise producten tegelijk vanuit een lijst
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="master-toggle" className="text-base font-semibold">
                  🎭 IDs zijn Master IDs (aanbevolen)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Zet aan als je lijst Master IDs bevat (bijv. 11452) in plaats van Release IDs
                </p>
              </div>
              <Switch 
                id="master-toggle"
                checked={idTypeIsMaster} 
                onCheckedChange={setIdTypeIsMaster}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Standaard Prijs (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="input">Album Lijst</Label>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Voorbeelden:

🎭 MASTER IDs (aanbevolen):
The Clash - The Clash, 11452
https://www.discogs.com/master/13750
Pink Floyd - The Wall

📀 RELEASE IDs werken ook:
https://www.discogs.com/release/1034729
Bryan Ferry - In Your Mind, 1034729

💡 TIP: Gebruik /master/ URLs voor beste resultaten!`}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Formaat: Artist - Title, ID (of URL). Één album per regel.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={parseInput} disabled={!input.trim()}>
              Parse Input
            </Button>
            <Button 
              onClick={handleVerifyList} 
              disabled={albums.length === 0 || isVerifying || isProcessing}
              variant="outline"
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              🔍 Verifieer Lijst (Dry-Run)
            </Button>
            <Button 
              onClick={processBatch} 
              disabled={albums.length === 0 || isProcessing || isVerifying}
              variant="default"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Batch Processing
            </Button>
            {results.length > 0 && (
              <Button onClick={downloadResults} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Rapport
              </Button>
            )}
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Voortgang</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Preview / Results */}
          {albums.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {isProcessing ? 'Resultaten' : 'Preview'} ({albums.length} albums)
                </h3>
                {results.filter(r => r.status === 'success').length > 0 && (
                  <Badge variant="default">
                    {results.filter(r => r.status === 'success').length} succesvol
                  </Badge>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead className="w-12">ID</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-24">ID Type</TableHead>
                      <TableHead className="w-20">Prijs</TableHead>
                      <TableHead>Resultaat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {albums.map((album, index) => {
                      const result = results[index];
                      return (
                        <TableRow key={index} className={getRowClassName(album.matchStatus)}>
                          <TableCell>
                            {result ? getStatusIcon(result.status) : getMatchIcon(album.matchStatus)}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {album.discogsId ? `${album.discogsId}` : '—'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{album.verifiedArtist || album.artist}</div>
                              {album.matchStatus === 'mismatch' && album.verifiedArtist && (
                                <div className="text-xs text-red-600">
                                  Input: {album.artist}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{album.verifiedTitle || album.title}</div>
                              {album.matchStatus === 'mismatch' && album.verifiedTitle && (
                                <div className="text-xs text-red-600">
                                  Input: {album.title}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {album.idType === 'master' && (
                              <Badge variant="default" className="text-xs">🎭 Master</Badge>
                            )}
                            {album.idType === 'release' && (
                              <Badge variant="secondary" className="text-xs">📀 Release</Badge>
                            )}
                          </TableCell>
                          <TableCell>€{album.price?.toFixed(2)}</TableCell>
                          <TableCell>
                            {result ? (
                              <div className="space-y-1">
                                {getStatusBadge(result.status)}
                                {result.message && (
                                  <p className="text-xs text-muted-foreground">{result.message}</p>
                                )}
                                {result.similarity !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    Match: {(result.similarity * 100).toFixed(0)}%
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Wachtend...</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Help */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">💡 Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• <strong>Master IDs</strong> geven de beste resultaten (bijv. <code className="text-xs">/master/11452</code>)</p>
              <p>• Gebruik de <strong>Verifieer Lijst</strong> knop voor een dry-run preview</p>
              <p>• Groene rijen = perfect match, gele = gedeeltelijke match, rode = mismatch</p>
              <p>• Items met mismatch worden automatisch overgeslagen tijdens processing</p>
              <p>• Batch verwerking is gelimiteerd tot 5 concurrent requests</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkArtGenerator;
