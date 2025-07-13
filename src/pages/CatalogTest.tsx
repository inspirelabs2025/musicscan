import { useState } from "react";
import { Search, Copy, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  discogs_id: string;
  discogs_url: string;
  sell_url: string;
  api_url: string;
  title: string;
  artist: string;
  year?: string;
  similarity_score: number;
  search_strategy: string;
  catalog_number: string;
  pricing_stats?: {
    have: number;
    want: number;
    avg_rating: number;
    rating_count: number;
    last_sold: string | null;
    lowest_price: string | null;
    median_price: string | null;
    highest_price: string | null;
  } | null;
}

const CatalogTest = () => {
  const [catalogNumber, setCatalogNumber] = useState("");
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [includePricing, setIncludePricing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchStrategies, setSearchStrategies] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!catalogNumber.trim()) {
      toast({
        title: "Fout",
        description: "Voer een catalogusnummer in",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setResults([]);
    setSearchStrategies([]);

    try {
      console.log('🔍 Testing catalog number search:', catalogNumber);
      
      const { data, error } = await supabase.functions.invoke('test-catalog-search', {
        body: {
          catalog_number: catalogNumber,
          artist: artist || undefined,
          title: title || undefined,
          include_pricing: includePricing
        }
      });

      if (error) {
        console.error('❌ Search error:', error);
        throw error;
      }

      console.log('✅ Search results:', data);
      
      setResults(data.results || []);
      setSearchStrategies(data.search_strategies || []);
      
      toast({
        title: "Zoeken Voltooid",
        description: `${data.results?.length || 0} resultaten gevonden`,
        variant: "default"
      });

    } catch (error: any) {
      console.error('❌ Search failed:', error);
      toast({
        title: "Zoeken Mislukt",
        description: error.message || "Er is een fout opgetreden",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Gekopieerd!",
      description: "URL gekopieerd naar klembord",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-scan">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Terug
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-vinyl bg-clip-text text-transparent">
                  Catalog Test
                </h1>
                <p className="text-sm text-muted-foreground">Test catalogusnummer naar Discogs URL conversie</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Test
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle>Catalogusnummer Zoeken</CardTitle>
              <CardDescription>
                Test hoe een catalogusnummer wordt omgezet naar Discogs URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="catalog">Catalogusnummer *</Label>
                  <Input
                    id="catalog"
                    placeholder="bijv. 5C062.13024, CBS 81227, MOTOWN 5149"
                    value={catalogNumber}
                    onChange={(e) => setCatalogNumber(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Test voorbeelden: 5C062.13024, CBS 81227, ATCO SD 33-329
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist">Artiest (optioneel)</Label>
                  <Input
                    id="artist"
                    placeholder="bijv. Michael Jackson"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Titel (optioneel)</Label>
                  <Input
                    id="title"
                    placeholder="bijv. Thriller"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-pricing" 
                  checked={includePricing}
                  onCheckedChange={(checked) => setIncludePricing(checked as boolean)}
                />
                <Label htmlFor="include-pricing" className="text-sm">
                  Include Pricing Statistics (langzamer)
                </Label>
              </div>
              
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                className="w-full md:w-auto"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? (includePricing ? "Zoeken & Scrapen..." : "Zoeken...") : "Zoek Discogs URLs"}
              </Button>
            </CardContent>
          </Card>

          {/* Search Strategies */}
          {searchStrategies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Zoekstrategieën Gebruikt</CardTitle>
                <CardDescription>
                  Verschillende manieren waarop naar de catalogus is gezocht
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {searchStrategies.map((strategy, index) => (
                    <Badge key={index} variant="outline">
                      {strategy}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Gevonden Resultaten ({results.length})</CardTitle>
                <CardDescription>
                  Discogs releases gevonden met het opgegeven catalogusnummer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">
                            {result.artist} - {result.title}
                          </h3>
                          {result.year && (
                            <p className="text-sm text-muted-foreground">
                              Jaar: {result.year}
                            </p>
                          )}
                          <p className="text-sm">
                            <strong>Catalogusnummer:</strong> {result.catalog_number}
                          </p>
                          <p className="text-sm">
                            <strong>Discogs ID:</strong> {result.discogs_id}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant={result.similarity_score > 0.8 ? "default" : "secondary"}>
                            {Math.round(result.similarity_score * 100)}% match
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {result.search_strategy}
                          </Badge>
                        </div>
                      </div>

                      {/* Pricing Statistics */}
                      {result.pricing_stats && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="text-xs text-muted-foreground font-semibold">Pricing Statistics:</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Have:</span> {result.pricing_stats.have}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Want:</span> {result.pricing_stats.want}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rating:</span> {result.pricing_stats.avg_rating > 0 ? `${result.pricing_stats.avg_rating}/5 (${result.pricing_stats.rating_count})` : 'N/A'}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Last Sold:</span> {result.pricing_stats.last_sold || 'N/A'}
                            </div>
                          </div>
                          {(result.pricing_stats.lowest_price || result.pricing_stats.median_price || result.pricing_stats.highest_price) && (
                            <div className="flex flex-wrap gap-2 text-sm">
                              {result.pricing_stats.lowest_price && (
                                <Badge variant="outline" className="text-green-600">
                                  Low: {result.pricing_stats.lowest_price}
                                </Badge>
                              )}
                              {result.pricing_stats.median_price && (
                                <Badge variant="outline" className="text-blue-600">
                                  Med: {result.pricing_stats.median_price}
                                </Badge>
                              )}
                              {result.pricing_stats.highest_price && (
                                <Badge variant="outline" className="text-red-600">
                                  High: {result.pricing_stats.highest_price}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground font-semibold">URL Types:</div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a 
                              href={result.discogs_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Release Info
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a 
                              href={result.sell_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Marketplace
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a 
                              href={result.api_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              API URL
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.sell_url)}
                            className="text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Kopieer Marketplace
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {!isSearching && results.length === 0 && catalogNumber && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Geen resultaten gevonden voor "{catalogNumber}"
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default CatalogTest;