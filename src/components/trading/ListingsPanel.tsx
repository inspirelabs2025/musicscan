import { useMemo, useState } from 'react';
import { Bot, LineChart as LineIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  itemLabel, money, seriesChange, type AutoPriceRule, type InventoryItem, type PriceSnapshot, type Signal,
} from '@/lib/trading';
import { Change, SignalBadge } from './SignalBadge';
import { Sparkline } from './TradingCharts';
import { AutoPriceRuleDialog } from './AutoPriceRuleDialog';

const FILTERS: { key: 'all' | Signal; label: string }[] = [
  { key: 'all', label: 'Alles' },
  { key: 'overpriced', label: 'Te duur' },
  { key: 'underpriced', label: 'Te goedkoop' },
  { key: 'fair', label: 'Marktconform' },
  { key: 'unknown', label: 'Nog niet gecheckt' },
];

export function ListingsPanel({ items, snaps, rules, onOpen }: {
  items: InventoryItem[]; snaps: PriceSnapshot[]; rules: AutoPriceRule[]; onOpen: (i: InventoryItem) => void;
}) {
  const [filter, setFilter] = useState<'all' | Signal>('all');
  const [q, setQ] = useState('');
  const [ruleFor, setRuleFor] = useState<InventoryItem | null>(null);
  const ruleByItem = useMemo(() => new Map(rules.map((r) => [r.inventory_item_id, r])), [rules]);

  const rows = useMemo(() => items
    .filter((i) => filter === 'all' || i.signal === filter)
    .filter((i) => !q || itemLabel(i).toLowerCase().includes(q.toLowerCase()))
    .map((i) => {
      const s = snaps.filter((x) => x.release_id === i.release_id && x.condition === i.condition);
      const values = s.map((x) => Number(x.suggested_price ?? x.lowest_price)).filter((v) => !Number.isNaN(v));
      return { ...i, spark: values, change: seriesChange(values) };
    }), [items, snaps, filter, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const i of items) c[i.signal] = (c[i.signal] ?? 0) + 1;
    return c;
  }, [items]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filter === f.key ? 'border-vinyl-gold bg-vinyl-gold/15 text-vinyl-gold' : 'border-trade-grid text-trade-muted hover:text-trade-panel-foreground',
            )}
          >
            {f.label} <span className="tabular-nums opacity-70">{counts[f.key] ?? 0}</span>
          </button>
        ))}
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek artiest of titel"
          className="ml-auto h-8 w-full sm:w-56 border-trade-grid bg-transparent text-trade-panel-foreground placeholder:text-trade-muted"
        />
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-trade-muted">Geen platen in deze selectie.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-trade-grid text-left text-[11px] uppercase tracking-wide text-trade-muted">
                <th className="py-2 pr-3 font-medium">Plaat</th>
                <th className="py-2 px-3 font-medium text-right">Jouw prijs</th>
                <th className="py-2 px-3 font-medium text-right">Markt</th>
                <th className="py-2 px-3 font-medium text-right hidden md:table-cell">Laagste</th>
                <th className="py-2 px-3 font-medium hidden lg:table-cell">30 dagen</th>
                <th className="py-2 px-3 font-medium">Signaal</th>
                <th className="py-2 pl-3 font-medium text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => {
                const rule = ruleByItem.get(i.id);
                return (
                  <tr key={i.id} className="border-b border-trade-grid/60 hover:bg-trade-grid/30">
                    <td className="py-2 pr-3">
                      <button className="flex items-center gap-2 text-left" onClick={() => onOpen(i)}>
                        {i.thumb ? <img src={i.thumb} alt="" className="h-9 w-9 rounded object-cover" loading="lazy" /> : <div className="h-9 w-9 rounded bg-trade-grid" />}
                        <span className="min-w-0">
                          <span className="block max-w-[220px] truncate font-medium text-trade-panel-foreground">{itemLabel(i)}</span>
                          <span className="block text-xs text-trade-muted">{i.condition ?? '–'}{i.num_for_sale != null && ` · ${i.num_for_sale} te koop`}</span>
                        </span>
                      </button>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-semibold text-trade-panel-foreground">{money(i.price, i.currency)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-trade-panel-foreground">{money(i.market_price, i.currency)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-trade-muted hidden md:table-cell">{money(i.lowest_price, i.currency)}</td>
                    <td className="py-2 px-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2"><Sparkline values={i.spark} /><Change value={i.change} /></div>
                    </td>
                    <td className="py-2 px-3"><SignalBadge signal={i.signal} deviation={i.deviation_pct} /></td>
                    <td className="py-2 pl-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-trade-muted hover:text-trade-panel-foreground" onClick={() => onOpen(i)} aria-label="Prijsgeschiedenis">
                          <LineIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className={cn('h-8 gap-1 text-xs', rule?.enabled ? 'text-trade-up' : 'text-trade-muted hover:text-trade-panel-foreground')}
                          onClick={() => setRuleFor(i)}
                        >
                          <Bot className="h-4 w-4" />{rule?.enabled ? 'Auto aan' : 'Auto'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {ruleFor && <AutoPriceRuleDialog item={ruleFor} rule={ruleByItem.get(ruleFor.id)} onClose={() => setRuleFor(null)} />}
    </div>
  );
}
