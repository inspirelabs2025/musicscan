import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, Bell, Bot, Handshake, ListChecks, RefreshCw, Settings2, Star, Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAlertPrefs, useAutoPriceRules, useDiscogsLinked, usePriceSnapshots, useRefreshTrading,
  useTradingAlerts, useTradingInventory, useTradingWantlist, useTradingCollection,
} from '@/hooks/useTradingDesk';
import { money, portfolioSeries, seriesChange, type InventoryItem, type WantlistItem } from '@/lib/trading';
import { PortfolioChart } from '@/components/trading/TradingCharts';
import { TickerBar } from '@/components/trading/TickerBar';
import { ListingsPanel } from '@/components/trading/ListingsPanel';
import { CollectionPanel } from '@/components/trading/CollectionPanel';
import { WantlistPanel } from '@/components/trading/WantlistPanel';
import { MatchesPanel } from '@/components/trading/MatchesPanel';
import { AutoPricePanel } from '@/components/trading/AutoPricePanel';
import { AlertsFeed, AlertSettings } from '@/components/trading/AlertsPanel';
import { PriceHistoryDialog } from '@/components/trading/PriceHistoryDialog';
import { Change } from '@/components/trading/SignalBadge';

const TABS = ['listings', 'wantlist', 'collection', 'matches', 'auto', 'alerts', 'settings'] as const;
type Tab = typeof TABS[number];

function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-trade-grid bg-trade-panel p-3">
      <div className="text-[11px] uppercase tracking-wide text-trade-muted">{label}</div>
      <div className={`mt-0.5 text-xl font-bold tabular-nums ${tone ?? 'text-trade-panel-foreground'}`}>{value}</div>
      {sub && <div className="text-xs text-trade-muted">{sub}</div>}
    </div>
  );
}

export default function TradingDesk() {
  useSEO({ title: 'Trading Desk | MusicScan', description: 'Volg de marktwaarde van je Discogs-listings en wantlist, krijg prijsalerts en vind kopers.', noindex: true });
  const { user, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as Tab) ? params.get('tab') : 'listings') as Tab;
  const setTab = (t: string) => setParams((p) => { p.set('tab', t); return p; }, { replace: true });

  const linked = useDiscogsLinked();
  const inv = useTradingInventory();
  const want = useTradingWantlist();
  const coll = useTradingCollection();
  const alerts = useTradingAlerts();
  const prefs = useAlertPrefs();
  const rules = useAutoPriceRules();
  const refresh = useRefreshTrading();
  const [open, setOpen] = useState<(InventoryItem & { kind?: 'inv' }) | (WantlistItem & { kind: 'want' }) | null>(null);

  const items = inv.data ?? [];
  const wants = want.data ?? [];
  const collection = coll.data ?? [];
  const releaseIds = useMemo(() => [...new Set([...items, ...wants, ...collection].map((i) => i.release_id))], [items, wants, collection]);
  const snaps = usePriceSnapshots(releaseIds);
  const series = useMemo(() => portfolioSeries(items, snaps.data ?? []), [items, snaps.data]);

  const totals = useMemo(() => {
    const cur = items.find((i) => i.currency)?.currency ?? 'EUR';
    const asking = items.reduce((s, i) => s + Number(i.price ?? 0), 0);
    const market = items.reduce((s, i) => s + Number(i.market_price ?? 0), 0);
    return {
      cur, asking, market,
      over: items.filter((i) => i.signal === 'overpriced').length,
      under: items.filter((i) => i.signal === 'underpriced').length,
      change: seriesChange(series.map((s) => s.value)),
      lastCheck: items.map((i) => i.market_checked_at).filter(Boolean).sort().slice(-1)[0],
    };
  }, [items, series]);
  const unread = (alerts.data ?? []).filter((a) => !a.is_read).length;
  const matchCount = (alerts.data ?? []).filter((a) => a.related_user_id && (a.type === 'wishlist_match' || a.type === 'wantlist_available')).length;

  const doRefresh = async () => {
    try {
      const r = await refresh.mutateAsync();
      toast.success('Bijgewerkt', { description: `${r.sync?.perUser?.[0]?.inventory ?? 0} listings, ${r.sync?.perUser?.[0]?.wantlist ?? 0} wantlist-platen, ${r.market?.checked ?? 0} prijzen gecheckt` });
    } catch (e) { toast.error('Bijwerken lukte niet', { description: (e as Error).message }); }
  };

  if (!loading && !user) {
    return (
      <main className="container max-w-2xl pt-10 pb-16 text-center space-y-4">
        <h1 className="text-3xl font-bold">Trading Desk</h1>
        <p className="text-muted-foreground">Log in om de marktwaarde van je Discogs-listings en wantlist te volgen.</p>
        <Button asChild><Link to="/auth">Inloggen</Link></Button>
      </main>
    );
  }

  const notLinked = linked.isFetched && !linked.data;

  return (
    <main className="-mt-4 min-h-screen bg-trade-panel pt-4 text-trade-panel-foreground">
      <div className="container max-w-7xl space-y-4 py-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-vinyl-gold"><Activity className="h-4 w-4" />Trading Desk</div>
            <h1 className="text-2xl font-bold sm:text-3xl">Jouw platen op de markt</h1>
            <p className="text-sm text-trade-muted">
              {linked.data ? <>Discogs: <b className="text-trade-panel-foreground">{linked.data}</b></> : 'Discogs niet gekoppeld'}
              {totals.lastCheck && <> · laatste marktcheck {new Date(totals.lastCheck).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</>}
              {' '}· automatisch elk uur bijgewerkt
            </p>
          </div>
          <Button onClick={doRefresh} disabled={refresh.isPending || notLinked} className="bg-vinyl-gold text-vinyl-black hover:bg-vinyl-gold/90">
            <RefreshCw className={`mr-2 h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} />{refresh.isPending ? 'Bezig…' : 'Nu bijwerken'}
          </Button>
        </header>

        {notLinked && (
          <div className="rounded-lg border border-vinyl-gold/40 bg-vinyl-gold/10 p-4 text-sm">
            Koppel eerst je Discogs-account. Daarna halen we je listings en wantlist automatisch op.{' '}
            <Link to="/mijn-discogs" className="font-semibold text-vinyl-gold underline">Discogs koppelen</Link>
          </div>
        )}

        <TickerBar entries={[...items, ...wants]} snaps={snaps.data ?? []} />

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Marktwaarde" value={money(totals.market, totals.cur)} sub={<Change value={totals.change} />} />
          <Stat label="Jouw vraagprijs" value={money(totals.asking, totals.cur)} sub={`${items.length} listings`} />
          <Stat label="Te duur" value={totals.over} tone="text-trade-down" sub="boven de markt" />
          <Stat label="Te goedkoop" value={totals.under} tone="text-vinyl-gold" sub="onder de markt" />
          <Stat label="Matches" value={matchCount} tone="text-trade-up" sub={`${wants.length} op je wantlist`} />
        </section>

        <section className="rounded-lg border border-trade-grid p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-trade-muted">
            <span className="font-semibold uppercase tracking-wide">Waarde van je listings · 30 dagen</span>
            <span><span className="mr-1 inline-block h-0.5 w-4 bg-vinyl-gold align-middle" />jouw vraagprijs</span>
          </div>
          {snaps.isLoading ? <Skeleton className="h-64 w-full bg-trade-grid" /> : <PortfolioChart data={series} currency={totals.cur} />}
        </section>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-trade-grid/40 p-1">
            <TabsTrigger value="listings"><ListChecks className="mr-1 h-4 w-4" />Inventory</TabsTrigger>
            <TabsTrigger value="wantlist"><Star className="mr-1 h-4 w-4" />Wantlist</TabsTrigger>
            <TabsTrigger value="collection"><Disc3 className="mr-1 h-4 w-4" />Collectie</TabsTrigger>
            <TabsTrigger value="matches"><Handshake className="mr-1 h-4 w-4" />Matches{matchCount > 0 && <span className="ml-1 rounded bg-trade-up px-1 text-[10px] text-trade-panel">{matchCount}</span>}</TabsTrigger>
            <TabsTrigger value="auto"><Bot className="mr-1 h-4 w-4" />Auto-prijs</TabsTrigger>
            <TabsTrigger value="alerts"><Bell className="mr-1 h-4 w-4" />Meldingen{unread > 0 && <span className="ml-1 rounded bg-vinyl-gold px-1 text-[10px] text-vinyl-black">{unread}</span>}</TabsTrigger>
            <TabsTrigger value="settings"><Settings2 className="mr-1 h-4 w-4" />Instellingen</TabsTrigger>
          </TabsList>
          <div className="mt-3 rounded-lg border border-trade-grid p-3">
            <TabsContent value="listings" className="mt-0">
              {inv.isLoading ? <Skeleton className="h-48 w-full bg-trade-grid" /> : items.length === 0 ? (
                <p className="py-10 text-center text-sm text-trade-muted">Je hebt nog geen platen te koop op Discogs, of ze zijn nog niet opgehaald. Klik op “Nu bijwerken”.</p>
              ) : <ListingsPanel items={items} snaps={snaps.data ?? []} rules={rules.data ?? []} onOpen={(i) => setOpen(i)} />}
            </TabsContent>
            <TabsContent value="wantlist" className="mt-0">
              {want.isLoading ? <Skeleton className="h-48 w-full bg-trade-grid" /> : <WantlistPanel items={wants} snaps={snaps.data ?? []} onOpen={(w) => setOpen({ ...w, kind: 'want' })} />}
            </TabsContent>
            <TabsContent value="collection" className="mt-0">
              {coll.isLoading ? <Skeleton className="h-48 w-full bg-trade-grid" /> : <CollectionPanel items={collection} snaps={snaps.data ?? []}
                onOpen={(c) => setOpen({ id: c.id, kind: 'want', release_id: c.release_id, artist: c.artist, title: c.title, thumb: c.thumb, lowest_price: c.lowest_price, currency: 'EUR', num_for_sale: null } as unknown as WantlistItem & { kind: 'want' })} />}
            </TabsContent>
            <TabsContent value="matches" className="mt-0"><MatchesPanel alerts={alerts.data ?? []} /></TabsContent>
            <TabsContent value="auto" className="mt-0"><AutoPricePanel rules={rules.data ?? []} items={items} /></TabsContent>
            <TabsContent value="alerts" className="mt-0"><AlertsFeed alerts={alerts.data ?? []} /></TabsContent>
            <TabsContent value="settings" className="mt-0">{prefs.data ? <AlertSettings prefs={prefs.data} /> : <Skeleton className="h-48 w-full bg-trade-grid" />}</TabsContent>
          </div>
        </Tabs>
      </div>
      {open && <PriceHistoryDialog item={open} snaps={snaps.data ?? []} onOpenChange={(o) => !o && setOpen(null)} />}
    </main>
  );
}
