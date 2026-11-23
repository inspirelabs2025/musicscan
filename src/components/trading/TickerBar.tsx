import { useMemo } from 'react';
import { itemLabel, money, seriesChange, type PriceSnapshot } from '@/lib/trading';
import { Change } from './SignalBadge';

interface Entry { release_id: number; artist: string | null; title: string | null; currency?: string | null }

/** Scrolling ticker with the biggest market movers among your records. */
export function TickerBar({ entries, snaps }: { entries: Entry[]; snaps: PriceSnapshot[] }) {
  const movers = useMemo(() => {
    const seen = new Set<number>();
    return entries.filter((e) => (seen.has(e.release_id) ? false : (seen.add(e.release_id), true))).map((e) => {
      const s = snaps.filter((x) => x.release_id === e.release_id && x.condition === 'all');
      const values = s.map((x) => (x.suggested_price ?? x.lowest_price) as number | null);
      return { ...e, change: seriesChange(values), last: values.filter((v) => v != null).slice(-1)[0] ?? null };
    }).filter((m) => m.last != null)
      .sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0)).slice(0, 14);
  }, [entries, snaps]);

  if (!movers.length) return null;
  const row = [...movers, ...movers];
  return (
    <div className="relative overflow-hidden rounded-lg border border-trade-grid bg-trade-panel py-2" aria-label="Koersbalk">
      <div className="flex w-max animate-[trading-ticker_60s_linear_infinite] gap-8 px-4 hover:[animation-play-state:paused]">
        {row.map((m, i) => (
          <span key={`${m.release_id}-${i}`} className="flex items-center gap-2 text-xs text-trade-panel-foreground whitespace-nowrap">
            <span className="font-semibold max-w-[220px] truncate">{itemLabel(m)}</span>
            <span className="tabular-nums text-trade-muted">{money(m.last, m.currency)}</span>
            <Change value={m.change} />
          </span>
        ))}
      </div>
    </div>
  );
}
