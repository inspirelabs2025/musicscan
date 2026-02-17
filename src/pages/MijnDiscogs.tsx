import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Search, ExternalLink, Disc3, Heart, ShoppingBag, ChevronLeft, ChevronRight, Link, MousePointerClick, CheckCircle2, ShieldCheck } from "lucide-react";
import { useDiscogsConnection } from "@/hooks/useDiscogsConnection";
import {
  useDiscogsAccountData,
  DiscogsTarget,
  DiscogsCollectionItem,
  DiscogsWantlistItem,
  DiscogsInventoryItem,
} from "@/hooks/useDiscogsAccountData";
import SafeImage from "@/components/SafeImage";
import { useLanguage } from "@/contexts/LanguageContext";

const MijnDiscogs = () => {
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const t = tr.mijnDiscogsPage;
  const { isConnected, isLoading: connLoading } = useDiscogsConnection();
  const [activeTab, setActiveTab] = useState<DiscogsTarget>("collection");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useDiscogsAccountData(activeTab, page, isConnected);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as DiscogsTarget);
    setPage(1);
    setSearch("");
  };

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
    const steps = [
      { icon: Link, title: t.connectStep1Title, desc: t.connectStep1Desc },
      { icon: MousePointerClick, title: t.connectStep2Title, desc: t.connectStep2Desc },
      { icon: CheckCircle2, title: t.connectStep3Title, desc: t.connectStep3Desc },
    ];

    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Disc3 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">{t.connectTitle}</h1>
          <p className="text-muted-foreground text-lg">{t.connectSubtitle}</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="font-semibold">{step.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="text-center space-y-4">
          <Button size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/my-collection")}>
            <Disc3 className="w-5 h-5" />
            {t.connectButton}
          </Button>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t.connectNote}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">{t.title}</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="collection" className="gap-2">
            <Disc3 className="w-4 h-4" /> {t.collection}
          </TabsTrigger>
          <TabsTrigger value="wantlist" className="gap-2">
            <Heart className="w-4 h-4" /> {t.wantlist}
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <ShoppingBag className="w-4 h-4" /> {t.marketplace}
          </TabsTrigger>
        </TabsList>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <p>{t.errorFetching}: {(error as Error).message}</p>
          </div>
        ) : (
          <>
            <TabsContent value="collection" className="mt-0">
              <ItemGrid items={filteredItems as DiscogsCollectionItem[]} type="collection" noItemsText={t.noItems} sleeveLabel={t.sleeve} />
            </TabsContent>
            <TabsContent value="wantlist" className="mt-0">
              <ItemGrid items={filteredItems as DiscogsWantlistItem[]} type="wantlist" noItemsText={t.noItems} sleeveLabel={t.sleeve} />
            </TabsContent>
            <TabsContent value="inventory" className="mt-0">
              <ItemGrid items={filteredItems as DiscogsInventoryItem[]} type="inventory" noItemsText={t.noItems} sleeveLabel={t.sleeve} />
            </TabsContent>

            {data?.pagination && data.pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> {t.previous}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t.pageOf} {data.pagination.page} {t.of} {data.pagination.pages} ({data.pagination.items} {t.items})
                </span>
                <Button variant="outline" size="sm" disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)}>
                  {t.next} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
};

function ItemGrid({ items, type, noItemsText, sleeveLabel }: { items: any[]; type: DiscogsTarget; noItemsText: string; sleeveLabel: string }) {
  if (!items.length) {
    return <div className="text-center py-12 text-muted-foreground">{noItemsText}</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item: any, i: number) => (
        <ItemCard key={item.id || i} item={item} type={type} sleeveLabel={sleeveLabel} />
      ))}
    </div>
  );
}

function ItemCard({ item, type, sleeveLabel }: { item: any; type: DiscogsTarget; sleeveLabel: string }) {
  if (type === "inventory") return <InventoryCard item={item} sleeveLabel={sleeveLabel} />;

  const info = item.basic_information;
  if (!info) return null;

  const artists = (info.artists || []).map((a: any) => a.name).join(", ");
  const labels = (info.labels || []).map((l: any) => `${l.name} – ${l.catno}`).join(", ");
  const formats = (info.formats || []).map((f: any) => f.name).join(", ");
  const discogsUrl = `https://www.discogs.com/release/${info.id}`;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-muted">
        <SafeImage src={info.cover_image || info.thumb} alt={`${artists} - ${info.title}`} className="w-full h-full object-contain" />
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

function InventoryCard({ item, sleeveLabel }: { item: any; sleeveLabel: string }) {
  const rel = item.release || {};
  const discogsUrl = `https://www.discogs.com/sell/item/${item.id}`;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-muted">
        <SafeImage src={rel.thumbnail} alt={rel.description || rel.title} className="w-full h-full object-contain" />
      </div>
      <div className="p-3 space-y-1">
        <p className="font-semibold text-sm truncate">{rel.title || rel.description}</p>
        <p className="text-xs text-muted-foreground truncate">{rel.artist}</p>
        {rel.catalog_number && <p className="text-xs text-muted-foreground truncate">{rel.catalog_number}</p>}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">{item.price?.currency} {item.price?.value?.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{item.condition}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{item.sleeve_condition && `${sleeveLabel}: ${item.sleeve_condition}`}</span>
          <a href={discogsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </Card>
  );
}

export default MijnDiscogs;
