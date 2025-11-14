import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  Music, 
  ShoppingBag, 
  Disc3, 
  Calendar, 
  User, 
  Search,
  Loader2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { useArtistSearch } from '@/hooks/useArtistSearch';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatResultCount } from '@/lib/artistSearchUtils';

export default function ArtistSearchResults() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const debouncedSearch = useDebounceSearch(searchTerm, 500);
  const navigate = useNavigate();

  const { data: results, isLoading } = useArtistSearch(debouncedSearch);

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      navigate(`/search/artist?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const stats = results ? [
    { label: 'Verhalen', count: results.verhalen.length + results.singles.length, icon: Music },
    { label: 'Producten', count: results.products.length, icon: ShoppingBag },
    { label: 'Collectie', count: results.collectie.length, icon: Disc3 },
    { label: 'Releases', count: results.releases.length, icon: Calendar },
  ] : [];

  return (
    <>
      <Helmet>
        <title>Zoek naar {debouncedSearch || 'Artiest'} | Vinyl Verzamelaar</title>
        <meta name="description" content={`Doorzoek alle content over ${debouncedSearch || 'je favoriete artiest'}`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header with search */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </Button>
            </div>

            <form onSubmit={handleSearch} className="max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                {isLoading && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
                )}
                <Input
                  type="text"
                  placeholder="Zoek naar een artiest..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-12 h-12"
                />
              </div>
            </form>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Results header */}
          {debouncedSearch && results && (
            <div className="mb-8 animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Zoekresultaten voor "{debouncedSearch}"
              </h1>
              <p className="text-muted-foreground text-lg">
                {results.totalResults === 0 
                  ? 'Geen resultaten gevonden' 
                  : formatResultCount(results.totalResults, 'resultaat gevonden', 'resultaten gevonden')}
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Icon className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">{stat.count}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Results tabs */}
          {!isLoading && results && results.totalResults > 0 && (
            <Tabs defaultValue="all" className="animate-fade-in">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all">
                  Alles ({results.totalResults})
                </TabsTrigger>
                {(results.verhalen.length + results.singles.length) > 0 && (
                  <TabsTrigger value="verhalen">
                    Verhalen ({results.verhalen.length + results.singles.length})
                  </TabsTrigger>
                )}
                {results.products.length > 0 && (
                  <TabsTrigger value="producten">
                    Producten ({results.products.length})
                  </TabsTrigger>
                )}
                {results.collectie.length > 0 && (
                  <TabsTrigger value="collectie">
                    Collectie ({results.collectie.length})
                  </TabsTrigger>
                )}
                {results.releases.length > 0 && (
                  <TabsTrigger value="releases">
                    Releases ({results.releases.length})
                  </TabsTrigger>
                )}
                {results.artistInfo && (
                  <TabsTrigger value="artist">
                    Artiest Info
                  </TabsTrigger>
                )}
              </TabsList>

              {/* All Results */}
              <TabsContent value="all" className="space-y-6 mt-6">
                {/* Verhalen section */}
                {(results.verhalen.length > 0 || results.singles.length > 0) && (
                  <ResultSection
                    title="Verhalen"
                    icon={Music}
                    items={[...results.verhalen, ...results.singles]}
                    renderItem={(item) => (
                      <Card key={item.id} className="hover:border-primary transition-colors">
                        <CardContent className="p-4 flex gap-4">
                          {item.artwork_url && (
                            <img 
                              src={item.artwork_url} 
                              alt={item.title}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <Link to={`/verhaal/${item.slug}`} className="hover:text-primary">
                              <h3 className="font-semibold mb-1">{item.title}</h3>
                            </Link>
                            {'artist' in item && item.artist && (
                              <p className="text-sm text-muted-foreground mb-2">{item.artist}</p>
                            )}
                            {item.story_content && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.story_content.substring(0, 150)}...
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {'single_name' in item ? 'Single' : 'Album'}
                          </Badge>
                        </CardContent>
                      </Card>
                    )}
                  />
                )}

                {/* Products section */}
                {results.products.length > 0 && (
                  <ResultSection
                    title="Shop Producten"
                    icon={ShoppingBag}
                    items={results.products}
                    renderItem={(product) => (
                      <Card key={product.id} className="hover:border-primary transition-colors">
                        <CardContent className="p-4 flex gap-4">
                          {product.primary_image && (
                            <img 
                              src={product.primary_image} 
                              alt={product.title}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <Link to={`/product/${product.slug}`} className="hover:text-primary">
                              <h3 className="font-semibold mb-1">{product.title}</h3>
                            </Link>
                            {product.artist && (
                              <p className="text-sm text-muted-foreground mb-2">{product.artist}</p>
                            )}
                            <p className="text-lg font-bold text-primary">€{product.price.toFixed(2)}</p>
                          </div>
                          <Badge variant="secondary">{product.media_type}</Badge>
                        </CardContent>
                      </Card>
                    )}
                  />
                )}

                {/* Other sections similarly... */}
              </TabsContent>

              {/* Individual tab contents */}
              <TabsContent value="verhalen">
                <div className="grid gap-4 mt-6">
                  {[...results.verhalen, ...results.singles].map((item) => (
                    <Card key={item.id} className="hover:border-primary transition-colors">
                      <CardContent className="p-6 flex gap-4">
                        {item.artwork_url && (
                          <img 
                            src={item.artwork_url} 
                            alt={item.title}
                            className="w-24 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <Link to={`/verhaal/${item.slug}`} className="hover:text-primary">
                            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                          </Link>
                          {'artist' in item && item.artist && (
                            <p className="text-muted-foreground mb-3">{item.artist}</p>
                          )}
                          {item.story_content && (
                            <p className="text-muted-foreground line-clamp-3">
                              {item.story_content.substring(0, 200)}...
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Add other tab contents as needed */}
            </Tabs>
          )}

          {/* Empty state */}
          {!isLoading && results && results.totalResults === 0 && debouncedSearch && (
            <Card className="animate-fade-in">
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Geen resultaten gevonden voor "{debouncedSearch}"
                </h3>
                <p className="text-muted-foreground mb-6">
                  Probeer een andere schrijfwijze of artiest
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" asChild>
                    <Link to="/verhalen">Bekijk alle verhalen</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/metaalprints">Bekijk shop</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

// Helper component for result sections
function ResultSection({ 
  title, 
  icon: Icon, 
  items, 
  renderItem 
}: { 
  title: string;
  icon: any;
  items: any[];
  renderItem: (item: any) => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">{title}</h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="grid gap-4">
        {items.slice(0, 5).map(renderItem)}
      </div>
      {items.length > 5 && (
        <Button variant="outline" className="w-full">
          Bekijk alle {items.length} resultaten
        </Button>
      )}
    </div>
  );
}
