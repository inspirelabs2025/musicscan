import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, ExternalLink, Copy, ArrowLeft, Sparkles } from 'lucide-react';

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
}

const TestDiscogsIdFinder = () => {
  const navigate = useNavigate();
  const [artistInput, setArtistInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [catalogInput, setCatalogInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<DiscogsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!artistInput.trim() || !titleInput.trim()) {
      toast({ 
        title: "⚠️ Vul Artist en Album in", 
        variant: "destructive" 
      });
      return;
    }

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: searchError } = await supabase.functions.invoke('optimized-catalog-search', {
        body: {
          artist: artistInput.trim(),
          title: titleInput.trim(),
          catalog_number: catalogInput.trim() || undefined,
          include_pricing: false
        }
      });

      if (searchError) throw searchError;

      if (!data?.results || data.results.length === 0) {
        setError('Geen resultaten gevonden. Probeer andere zoektermen.');
        toast({
          title: "❌ Geen resultaten",
          description: "Probeer andere zoektermen",
          variant: "destructive"
        });
        return;
      }

      setResult(data.results[0]);
      toast({
        title: "✅ Discogs ID Gevonden!",
        description: `ID: ${data.results[0].discogs_id}`
      });

    } catch (err: any) {
      console.error('Search error:', err);
      const errorMsg = err.message || 'Er is een fout opgetreden';
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
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
            🔍 Discogs ID Finder
            <Badge variant="secondary">Test Tool</Badge>
          </CardTitle>
          <CardDescription>
            Test de "Artist + Album → Discogs ID" conversie. Vul de gegevens in en zie direct het resultaat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Form */}
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
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !artistInput.trim() || !titleInput.trim()}
              className="w-full"
              size="lg"
            >
              {isSearching ? "Zoeken..." : "🔍 Zoek Discogs ID"}
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fout</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Result Display */}
          {result && (
            <div className="border rounded-lg p-6 bg-muted/50 space-y-4">
              <div className="flex gap-6">
                {/* Thumbnail */}
                {result.thumb && (
                  <div className="flex-shrink-0">
                    <img 
                      src={result.thumb} 
                      alt={result.title}
                      className="w-32 h-32 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
                
                {/* Metadata */}
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Discogs ID</p>
                    <p className="text-4xl font-bold text-primary">
                      {result.discogs_id}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-lg font-semibold">{result.artist}</p>
                    <p className="text-md text-muted-foreground">{result.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
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
                    {result.catalog_number && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Catalog:</span>{' '}
                        <span className="font-medium">{result.catalog_number}</span>
                      </div>
                    )}
                    {result.format && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Format:</span>{' '}
                        <span className="font-medium">{result.format}</span>
                      </div>
                    )}
                  </div>

                  {(result.search_strategy || result.similarity_score) && (
                    <div className="flex gap-2 pt-2">
                      {result.search_strategy && (
                        <Badge variant="secondary">
                          {result.search_strategy}
                        </Badge>
                      )}
                      {result.similarity_score !== undefined && (
                        <Badge variant="outline">
                          Score: {result.similarity_score.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate(`/admin/art-generator?discogsId=${result.discogs_id}`)}
                  className="flex-1"
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
                    View on Discogs
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(result.discogs_id.toString());
                    toast({ title: "✅ Discogs ID gekopieerd!" });
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy ID
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Test Voorbeelden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
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
                  setArtistInput('Nirvana');
                  setTitleInput('Nevermind');
                  setCatalogInput('');
                }}
              >
                Nirvana - Nevermind
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDiscogsIdFinder;
