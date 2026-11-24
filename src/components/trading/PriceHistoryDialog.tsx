import { ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { itemLabel, money, type InventoryItem, type PriceSnapshot, type WantlistItem } from '@/lib/trading';
import { PriceHistoryChart, QuoteChart } from './TradingCharts';
import { SignalBadge } from './SignalBadge';

type Item = (InventoryItem & { kind?: 'inv' }) | (WantlistItem & { kind: 'want' });

export function PriceHistoryDialog({ item, snaps, onOpenChange }: {
  item: Item | null; snaps: PriceSnapshot[]; onOpenChange: (o: boolean) => void;
}) {
  if (!item) return null;
  const inv = item.kind !== 'want' ? (item as InventoryItem) : null;
  const releaseSnaps = snaps.filter((s) => s.release_id === item.release_id);
  const stats = [
    { href: undefined as string | undefined, label: 'Jouw prijs', value: inv ? money(inv.price, inv.currency) : '–' },
    { label: 'Marktprijs', value: inv ? money(inv.market_price, inv.currency) : '–' },
    { label: 'Laagste nu', value: money(item.lowest_price, item.currency) },
    { label: 'Te koop', value: item.num_for_sale ?? '–', href: `https://www.discogs.com/sell/release/${item.release_id}?sort=price%2Casc` },
  ];
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-trade-panel text-trade-panel-foreground border-trade-grid">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {item.thumb && <img src={item.thumb} alt="" className="h-14 w-14 rounded object-cover" />}
            <div className="min-w-0">
              <DialogTitle className="text-trade-panel-foreground truncate">{itemLabel(item)}</DialogTitle>
              <DialogDescription className="text-trade-muted">
                {inv?.condition ?? 'Alle condities'} · Release {item.release_id}
              </DialogDescription>
              {inv && <div className="mt-1"><SignalBadge signal={inv.signal} deviation={inv.deviation_pct} /></div>}
            </div>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stats.map((s) => {
            const body = (<>
              <div className="text-[11px] uppercase tracking-wide text-trade-muted">{s.label}{s.href && <ExternalLink className="inline h-3 w-3 ml-1" />}</div>
              <div className="text-base font-semibold tabular-nums">{s.value}</div>
            </>);
            return s.href
              ? <a key={s.label} href={s.href} target="_blank" rel="noreferrer" title="Bekijk verkopers van dit item op Discogs" className="rounded-md border border-trade-grid p-2 hover:border-vinyl-gold transition-colors">{body}</a>
              : <div key={s.label} className="rounded-md border border-trade-grid p-2">{body}</div>;
          })}
        </div>
        <QuoteChart releaseId={item.release_id} snaps={releaseSnaps} condition={inv?.condition} myPrice={inv?.price} currency={item.currency} />
        <PriceHistoryChart snaps={releaseSnaps} condition={inv?.condition} myPrice={inv?.price} currency={item.currency} />
        <div className="flex flex-wrap gap-3 text-xs text-trade-muted">
          <span><span className="inline-block h-2 w-3 rounded-sm bg-trade-up mr-1" />Marktprijs</span>
          <span><span className="inline-block h-2 w-3 rounded-sm bg-trade-down mr-1" />Laagste prijs</span>
          <span><span className="inline-block h-2 w-3 rounded-sm bg-vinyl-gold mr-1" />Jouw prijs</span>
          <span><span className="inline-block h-2 w-3 rounded-sm bg-trade-grid mr-1" />Aantal te koop</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {inv?.listing_uri && (
            <Button asChild variant="outline" size="sm" className="border-trade-grid bg-transparent text-trade-panel-foreground hover:bg-trade-grid hover:text-trade-panel-foreground"><a href={inv.listing_uri} target="_blank" rel="noreferrer">Jouw listing <ExternalLink className="h-3 w-3 ml-1" /></a></Button>
          )}
          <Button asChild size="sm" variant="outline" className="border-trade-grid bg-transparent text-trade-panel-foreground hover:bg-trade-grid hover:text-trade-panel-foreground"><a href={`https://www.discogs.com/release/${item.release_id}`} target="_blank" rel="noreferrer">Bekijk de markt <ExternalLink className="h-3 w-3 ml-1" /></a></Button>
          <Button asChild size="lg" className="rounded-full px-8 bg-vinyl-gold text-background hover:bg-vinyl-gold/90 font-bold"><a href={`https://www.discogs.com/sell/release/${item.release_id}?sort=price%2Casc`} target="_blank" rel="noreferrer">Koop nu {item.lowest_price != null ? `· ${money(item.lowest_price, item.currency)}` : ''}</a></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
