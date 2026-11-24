import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { money, type PriceSnapshot } from '@/lib/trading';

export interface ChangeSource { key: string; release_id: number; label: string; thumb: string | null; source: string; baseline?: number | null; currency?: string | null }
export interface PriceChange extends ChangeSource { from: number; to: number; pct: number }

/** Compares the earliest known price (oldest snapshot, or the price at scan) with the latest market snapshot. */
export function computePriceChanges(items: ChangeSource[], snaps: PriceSnapshot[], minPct = 1): PriceChange[] {
  const byRelease = new Map<number, number[]>();
  for (const s of snaps) {
    const v = Number(s.lowest_price);
    if (s.condition !== 'all' || !(v > 0)) continue;
    (byRelease.get(s.release_id) ?? byRelease.set(s.release_id, []).get(s.release_id)!).push(v);
  }
  const out: PriceChange[] = [];
  const seen = new Set<number>();
  for (const it of items) {
    if (seen.has(it.release_id)) continue;
    const vals = byRelease.get(it.release_id) ?? [];
    if (!vals.length) continue;
    const to = vals[vals.length - 1];
    const from = it.baseline && it.baseline > 0 ? Number(it.baseline) : vals.length > 1 ? vals[0] : null;
    if (!from) continue;
    const pct = ((to - from) / from) * 100;
    if (Math.abs(pct) < minPct) continue;
    seen.add(it.release_id);
    out.push({ ...it, from, to, pct });
  }
  return out;
}

function Row({ c, onOpen }: { c: PriceChange; onOpen: (c: PriceChange) => void }) {
  const up = c.pct > 0;
  return (
    <button onClick={() => onOpen(c)} className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-trade-grid/30">
      {c.thumb ? <img src={c.thumb} alt="" className="h-10 w-10 rounded object-cover" loading="lazy" /> : <div className="h-10 w-10 rounded bg-trade-grid" />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-trade-panel-foreground">{c.label}</div>
        <div className="text-xs text-trade-muted tabular-nums">{c.source} · {money(c.from, c.currency ?? 'EUR')} → {money(c.to, c.currency ?? 'EUR')}</div>
      </div>
      <div className={`text-right text-sm font-semibold tabular-nums ${up ? 'text-trade-up' : 'text-trade-down'}`}>
        {up ? '+' : ''}{c.pct.toFixed(1)}%
        <div className="text-xs font-normal">{up ? '+' : ''}{money(c.to - c.from, c.currency ?? 'EUR')}</div>
      </div>
    </button>
  );
}

export function PriceChangesPanel({ changes, onOpen }: { changes: PriceChange[]; onOpen: (c: PriceChange) => void }) {
  const up = changes.filter((c) => c.pct > 0).sort((a, b) => b.pct - a.pct);
  const down = changes.filter((c) => c.pct < 0).sort((a, b) => a.pct - b.pct);
  const net = changes.reduce((s, c) => s + (c.to - c.from), 0);
  if (!changes.length) return <p className="py-10 text-center text-sm text-trade-muted">Nog geen prijswijzigingen gemeten. Prijzen worden automatisch bijgehouden; na een paar metingen verschijnen ze hier.</p>;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-trade-grid p-3"><div className="text-[11px] uppercase text-trade-muted">Duurder</div><div className="text-xl font-bold text-trade-up tabular-nums">{up.length}</div></div>
        <div className="rounded-lg border border-trade-grid p-3"><div className="text-[11px] uppercase text-trade-muted">Goedkoper</div><div className="text-xl font-bold text-trade-down tabular-nums">{down.length}</div></div>
        <div className="rounded-lg border border-trade-grid p-3"><div className="text-[11px] uppercase text-trade-muted">Netto verschil</div><div className={`text-xl font-bold tabular-nums ${net >= 0 ? 'text-trade-up' : 'text-trade-down'}`}>{net >= 0 ? '+' : ''}{money(net, 'EUR')}</div></div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[{ t: 'Duurder geworden', list: up, Icon: ArrowUpRight, tone: 'text-trade-up' }, { t: 'Goedkoper geworden', list: down, Icon: ArrowDownRight, tone: 'text-trade-down' }].map(({ t, list, Icon, tone }) => (
          <section key={t} className="rounded-lg border border-trade-grid p-2">
            <h3 className={`mb-1 flex items-center gap-1 px-2 text-sm font-semibold ${tone}`}><Icon className="h-4 w-4" />{t} ({list.length})</h3>
            {list.length ? list.map((c) => <Row key={c.key} c={c} onOpen={onOpen} />) : <p className="p-2 text-xs text-trade-muted">Geen.</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
