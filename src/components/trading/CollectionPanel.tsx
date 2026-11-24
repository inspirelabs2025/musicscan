import { money, seriesChange, type PriceSnapshot } from '@/lib/trading';
import type { CollectionItem } from '@/hooks/useTradingDesk';
import { Change } from './SignalBadge';
import { Sparkline } from './TradingCharts';

export function CollectionPanel({ items, snaps, onOpen }: { items: CollectionItem[]; snaps: PriceSnapshot[]; onOpen: (i: CollectionItem) => void }) {
  if (!items.length) return <p className="py-10 text-center text-sm text-trade-muted">Nog geen gescande platen met een Discogs-koppeling in je collectie.</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((c) => {
        const values = snaps.filter((s) => s.release_id === c.release_id && s.condition === 'all')
          .map((s) => Number(s.lowest_price)).filter((v) => !Number.isNaN(v) && v > 0);
        return (
          <button key={c.kind + c.id} onClick={() => onOpen(c)} className="flex items-center gap-3 rounded-lg border border-trade-grid p-3 text-left hover:bg-trade-grid/30">
            {c.thumb ? <img src={c.thumb} alt="" className="h-12 w-12 rounded object-cover" loading="lazy" /> : <div className="h-12 w-12 rounded bg-trade-grid" />}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-trade-panel-foreground">{[c.artist, c.title].filter(Boolean).join(' – ') || `Release ${c.release_id}`}</div>
              <div className="text-xs text-trade-muted">
                {c.kind === 'cd' ? 'CD' : 'Vinyl'}{c.value != null && <> · waarde <span className="tabular-nums">{money(c.value, 'EUR')}</span></>}
              </div>
              <div className="mt-1 flex items-center gap-2"><Sparkline values={values} /><Change value={seriesChange(values)} /></div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
