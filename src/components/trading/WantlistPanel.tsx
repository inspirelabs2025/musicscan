import { ExternalLink } from 'lucide-react';
import { itemLabel, money, seriesChange, type PriceSnapshot, type WantlistItem } from '@/lib/trading';
import { Change } from './SignalBadge';
import { Sparkline } from './TradingCharts';

export function WantlistPanel({ items, snaps, onOpen }: { items: WantlistItem[]; snaps: PriceSnapshot[]; onOpen: (i: WantlistItem) => void }) {
  if (!items.length) return <p className="py-10 text-center text-sm text-trade-muted">Je Discogs-wantlist is leeg of nog niet opgehaald.</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((w) => {
        const values = snaps.filter((s) => s.release_id === w.release_id && s.condition === 'all')
          .map((s) => Number(s.lowest_price)).filter((v) => !Number.isNaN(v) && v > 0);
        const available = (w.num_for_sale ?? 0) > 0;
        return (
          <div key={w.id} className="flex items-center gap-3 rounded-lg border border-trade-grid p-3">
            <button onClick={() => onOpen(w)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              {w.thumb ? <img src={w.thumb} alt="" className="h-12 w-12 rounded object-cover" loading="lazy" /> : <div className="h-12 w-12 rounded bg-trade-grid" />}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-trade-panel-foreground">{itemLabel(w)}</div>
                <div className="text-xs text-trade-muted">
                  {available ? <span className="text-trade-up font-medium">{w.num_for_sale} te koop</span> : 'Niet te koop'}
                  {w.lowest_price != null && <> · vanaf <span className="tabular-nums">{money(w.lowest_price, w.currency)}</span></>}
                </div>
                <div className="mt-1 flex items-center gap-2"><Sparkline values={values} /><Change value={seriesChange(values)} /></div>
              </div>
            </button>
            {available && (
              <a href={`https://www.discogs.com/sell/release/${w.release_id}`} target="_blank" rel="noreferrer"
                className="shrink-0 rounded-md border border-trade-grid p-2 text-trade-muted hover:text-trade-panel-foreground" aria-label="Bekijk aanbod op Discogs">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
