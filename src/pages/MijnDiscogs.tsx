import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, ExternalLink, Disc3, Heart, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { useDiscogsConnection } from "@/hooks/useDiscogsConnection";
import {
  useDiscogsAccountData,
  DiscogsTarget,
  DiscogsCollectionItem,
  DiscogsWantlistItem,
  DiscogsInventoryItem,
} from "@/hooks/useDiscogsAccountData";
import SafeImage from "@/components/SafeImage";

const MijnDiscogs = () => {
  const navigate = useNavigate();
  const { isConnected, isLoading: connLoading } = useDiscogsConnection();
  const [activeTab, setActiveTab] = useState<DiscogsTarget>("collection");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useDiscogsAccountData(activeTab, page, isConnected);

  // Reset page when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as DiscogsTarget);
    setPage(1);
    setSearch("");
  };

  // Client-side search filter
  const filteredItems = useMemo(() => {
    if (!data?.items || !search.trim()) return data?.items || [];
    const q = search.toLowerCase();
    return data.items.filter((item: any) => {
      const info = item.basic_information || item.release || {};
      const title = (info.title || "").toLowerCase();
      const artists = (info.artists || []).map((a: any) => a.name.toLowerCase()).join(" ");
      const artist = (info.artist || "").toLowerCase();
      return title.includes(q) || artists.includes(q) || artist.includes(q);
    });
  }, [data?.items, search]);

  if (connLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Disc3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Discogs Account</h1>
        <p className="text-muted-foreground mb-6">
          Koppel eerst je Discogs account om je collectie, wantlist en marketplace te bekijken.
        </p>
        <Button onClick={() => navigate("/my-collection")}>Ga naar Mijn Collectie</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Mijn Discogs</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="collection" className="gap-2">
            <Disc3 className="w-4 h-4" /> Collectie
          </TabsTrigger>
          <TabsTrigger value="wantlist" className="gap-2">
            <Heart className="w-4 h-4" /> Wantlist
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <ShoppingBag className="w-4 h-4" /> Marketplace
          </TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op artiest of titel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Shared content area */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <p>Fout bij ophalen: {(error as Error).message}</p>
          </div>
        ) : (
          <>
            <TabsContent value="collection" className="mt-0">
              <ItemGrid items={filteredItems as DiscogsCollectionItem[]} type="collection" />
            </TabsContent>
            <TabsContent value="wantlist" className="mt-0">
              <ItemGrid items={filteredItems as DiscogsWantlistItem[]} type="wantlist" />
            </TabsContent>
            <TabsContent value="inventory" className="mt-0">
              <ItemGrid items={filteredItems as DiscogsInventoryItem[]} type="inventory" />
            </TabsContent>

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Vorige
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {data.pagination.page} van {data.pagination.pages} ({data.pagination.items} items)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Volgende <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
};

// Grid component for all item types
function ItemGrid({ items, type }: { items: any[]; type: DiscogsTarget }) {
  if (!items.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Geen items gevonden.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item: any, i: number) => (
        <ItemCard key={item.id || i} item={item} type={type} />
      ))}
    </div>
  );
}

function ItemCard({ item, type }: { item: any; type: DiscogsTarget }) {
  if (type === "inventory") {
    return <InventoryCard item={item} />;
  }

  const info = item.basic_information;
  if (!info) return null;

  const artists = (info.artists || []).map((a: any) => a.name).join(", ");
  const labels = (info.labels || []).map((l: any) => `${l.name} – ${l.catno}`).join(", ");
  const formats = (info.formats || []).map((f: any) => f.name).join(", ");
  const discogsUrl = `https://www.discogs.com/release/${info.id}`;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-muted">
        <SafeImage
          src={info.cover_image || info.thumb}
          alt={`${artists} - ${info.title}`}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-3 space-y-1">
        <p className="font-semibold text-sm truncate">{info.title}</p>
        <p className="text-xs text-muted-foreground truncate">{artists}</p>
        {labels && <p className="text-xs text-muted-foreground truncate">{labels}</p>}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{info.year || "–"} · {formats}</span>
          <a href={discogsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </Card>
  );
}

function InventoryCard({ item }: { item: any }) {
  const rel = item.release || {};
  const discogsUrl = `https://www.discogs.com/sell/item/${item.id}`;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-muted">
        <SafeImage
          src={rel.thumbnail}
          alt={rel.description || rel.title}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-3 space-y-1">
        <p className="font-semibold text-sm truncate">{rel.title || rel.description}</p>
        <p className="text-xs text-muted-foreground truncate">{rel.artist}</p>
        {rel.catalog_number && (
          <p className="text-xs text-muted-foreground truncate">{rel.catalog_number}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">
            {item.price?.currency} {item.price?.value?.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">{item.condition}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{item.sleeve_condition && `Sleeve: ${item.sleeve_condition}`}</span>
          <a href={discogsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </Card>
  );
}

export default MijnDiscogs;
