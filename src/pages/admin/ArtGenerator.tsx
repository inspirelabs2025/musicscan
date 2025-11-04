import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArtProductGenerator } from "@/hooks/useArtProductGenerator";
import { Loader2, Sparkles, Search, Link as LinkIcon, Home } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function ArtGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate: createArtProduct, isPending } = useArtProductGenerator();

  // Discogs ID search
  const [discogsId, setDiscogsId] = useState("");
  const [activeTab, setActiveTab] = useState("discogs-id");

  // Pre-fill from URL parameter
  useEffect(() => {
    const urlDiscogsId = searchParams.get('discogsId');
    if (urlDiscogsId) {
      setDiscogsId(urlDiscogsId);
      setActiveTab("discogs-id");
    }
  }, [searchParams]);
  
  // Catalog search
  const [catalogNumber, setCatalogNumber] = useState("");
  
  // Artist + Title search
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  
  // Price
  const [price, setPrice] = useState("49.95");

  // Iconic albums for quick add
  const iconicAlbums = [
    { artist: "Pink Floyd", title: "The Dark Side Of The Moon", discogs_id: 4594540 },
    { artist: "The Beatles", title: "Abbey Road", discogs_id: 10598332 },
    { artist: "Nirvana", title: "Nevermind", discogs_id: 3426781 },
    { artist: "Michael Jackson", title: "Thriller", discogs_id: 3642592 },
    { artist: "Fleetwood Mac", title: "Rumours", discogs_id: 6774890 },
    { artist: "Led Zeppelin", title: "Led Zeppelin IV", discogs_id: 3788890 },
  ];

  const handleQuickAdd = (album: typeof iconicAlbums[0]) => {
    createArtProduct({
      discogs_id: album.discogs_id,
      artist: album.artist,
      title: album.title,
      price: parseFloat(price)
    });
  };

  const handleDiscogsIdSearch = () => {
    const id = parseInt(discogsId);
    if (isNaN(id)) {
      return;
    }
    createArtProduct({ 
      discogs_id: id,
      price: parseFloat(price)
    });
  };

  const handleCatalogSearch = () => {
    if (!catalogNumber.trim()) return;
    createArtProduct({ 
      catalog_number: catalogNumber,
      price: parseFloat(price)
    });
  };

  const handleArtistTitleSearch = () => {
    if (!artist.trim() || !title.trim()) return;
    createArtProduct({ 
      artist,
      title,
      price: parseFloat(price)
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Art Generator</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">ART Product Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Automatisch metaalprint producten aanmaken van albumhoezen via Discogs
        </p>
      </div>

      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="price">Standaard Prijs (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="49.95"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Deze prijs wordt gebruikt voor alle nieuwe ART producten
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Add Iconic Albums */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-vinyl-gold/10 to-vinyl-purple/10 border-2 border-vinyl-gold/30">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-vinyl-gold" />
          <h2 className="text-xl font-bold">⚡ Quick Add Iconische Albums</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Voeg bekende albums met 1 klik toe om de catalogus te vullen
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {iconicAlbums.map((album) => (
            <Button
              key={album.discogs_id}
              onClick={() => handleQuickAdd(album)}
              disabled={isPending}
              variant="outline"
              className="h-auto py-3 px-4 flex flex-col items-start text-left hover:bg-vinyl-gold/10 hover:border-vinyl-gold transition-all"
            >
              <span className="font-semibold text-sm">{album.artist}</span>
              <span className="text-xs text-muted-foreground line-clamp-1">{album.title}</span>
            </Button>
          ))}
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discogs-id">
            <LinkIcon className="h-4 w-4 mr-2" />
            Discogs ID
          </TabsTrigger>
          <TabsTrigger value="catalog">
            <Search className="h-4 w-4 mr-2" />
            Catalogusnummer
          </TabsTrigger>
          <TabsTrigger value="artist-title">
            <Search className="h-4 w-4 mr-2" />
            Artist + Titel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discogs-id" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="discogs-id">Discogs Release ID</Label>
                <Input
                  id="discogs-id"
                  value={discogsId}
                  onChange={(e) => setDiscogsId(e.target.value)}
                  placeholder="Bijv: 249504"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Bijvoorbeeld: voor https://www.discogs.com/release/249504, voer in: 249504
                </p>
              </div>
              
              <Button 
                onClick={handleDiscogsIdSearch}
                disabled={isPending || !discogsId}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bezig met genereren...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Maak ART Product
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="catalog">Catalogusnummer</Label>
                <Input
                  id="catalog"
                  value={catalogNumber}
                  onChange={(e) => setCatalogNumber(e.target.value)}
                  placeholder="Bijv: MOVLP123"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Het catalogusnummer zoals vermeld op de release
                </p>
              </div>
              
              <Button 
                onClick={handleCatalogSearch}
                disabled={isPending || !catalogNumber}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bezig met zoeken...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Zoek en Maak Product
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="artist-title" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="artist">Artist</Label>
                <Input
                  id="artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Bijv: Pink Floyd"
                />
              </div>
              
              <div>
                <Label htmlFor="title">Album Titel</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bijv: The Dark Side Of The Moon"
                />
              </div>
              
              <Button 
                onClick={handleArtistTitleSearch}
                disabled={isPending || !artist || !title}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bezig met zoeken...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Zoek en Maak Product
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-6 mt-6 bg-muted/50">
        <h3 className="font-semibold mb-2">💡 Hoe werkt het?</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Voer een Discogs ID, catalogusnummer of artist + titel in</li>
          <li>Systeem zoekt het album op via Discogs API</li>
          <li>Hoogwaardige albumhoes wordt automatisch gedownload</li>
          <li>Perplexity AI genereert een rijke productbeschrijving</li>
          <li>ART product wordt aangemaakt in de shop</li>
          <li>Product is direct beschikbaar voor verkoop</li>
        </ol>
      </Card>

      <div className="mt-6 flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/platform-products')}
          className="flex-1"
        >
          Terug naar Producten
        </Button>
      </div>
    </div>
  );
}
