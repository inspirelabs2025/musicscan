import { toast } from 'sonner';
import { Eye, Play, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAutoPriceAction, usePriceAdjustments, useSaveAutoPriceRule } from '@/hooks/useTradingDesk';
import { STRATEGIES, itemLabel, money, type AutoPriceRule, type InventoryItem } from '@/lib/trading';

export function AutoPricePanel({ rules, items }: { rules: AutoPriceRule[]; items: InventoryItem[] }) {
  const action = useAutoPriceAction();
  const save = useSaveAutoPriceRule();
  const { data: log = [] } = usePriceAdjustments();
  const [preview, setPreview] = useState<any[] | null>(null);
  const byId = new Map(items.map((i) => [i.id, i]));
  const active = rules.filter((r) => r.enabled).length;

  const run = async (kind: 'preview' | 'apply_now') => {
    try {
      const res = await action.mutateAsync({ action: kind });
      if (kind === 'preview') setPreview(res.results ?? []);
      else {
        const applied = (res.results ?? []).filter((r: any) => r.applied).length;
        toast.success(applied ? `${applied} prijs(en) aangepast op Discogs` : 'Geen aanpassingen nodig');
        setPreview(null);
      }
    } catch (e) { toast.error((e as Error).message); }
  };

  const revert = async (id: string) => {
    try { await action.mutateAsync({ action: 'revert', logId: id }); toast.success('Oude prijs teruggezet'); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-trade-muted">
          {active ? `${active} plaat/platen worden elk uur automatisch geprijsd.` : 'Nog geen automatische prijzen. Zet het aan per plaat via "Auto" in je listings.'}
        </p>
        <Button size="sm" variant="outline" className="border-trade-grid bg-transparent text-trade-panel-foreground hover:bg-trade-grid hover:text-trade-panel-foreground" onClick={() => run('preview')} disabled={!active || action.isPending}><Eye className="mr-1 h-4 w-4" />Bekijk voorstel</Button>
        <Button size="sm" onClick={() => run('apply_now')} disabled={!active || action.isPending}><Play className="mr-1 h-4 w-4" />Nu toepassen</Button>
      </div>

      {preview && (
        <div className="rounded-lg border border-vinyl-gold/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-vinyl-gold">Voorstel (nog niets gewijzigd)</div>
          {preview.length === 0 ? <p className="text-sm text-trade-muted">Niets te doen.</p> : (
            <ul className="space-y-1 text-sm">
              {preview.map((r, i) => (
                <li key={i} className="flex justify-between gap-3 text-trade-panel-foreground">
                  <span className="truncate">{r.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {r.skipped ? <span className="text-trade-muted">{r.skipped}</span> : <>{money(r.old_price)} → <b className="text-trade-up">{money(r.new_price)}</b></>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {rules.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-trade-muted">Regels</h3>
          {rules.map((r) => {
            const it = byId.get(r.inventory_item_id);
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-trade-grid p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-trade-panel-foreground">{it ? itemLabel(it) : 'Listing niet meer te koop'}</div>
                  <div className="text-xs text-trade-muted">
                    {STRATEGIES.find((s) => s.value === r.strategy)?.label} · min {money(r.min_price, it?.currency)}{r.max_price != null && ` · max ${money(r.max_price, it?.currency)}`}
                    {r.last_applied_at && ` · laatst ${new Date(r.last_applied_at).toLocaleString('nl-NL')}`}
                  </div>
                </div>
                <Switch
                  checked={r.enabled}
                  aria-label="Automatisch prijzen aan of uit"
                  onCheckedChange={(v) => save.mutate({ ...r, enabled: v }, { onError: (e) => toast.error((e as Error).message) })}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-trade-muted">Logboek</h3>
        {log.length === 0 ? <p className="text-sm text-trade-muted">Nog geen prijswijzigingen.</p> : (
          <ul className="divide-y divide-trade-grid rounded-lg border border-trade-grid">
            {log.map((l: any) => {
              const it = byId.get(l.inventory_item_id);
              return (
                <li key={l.id} className="flex items-center gap-3 p-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-trade-panel-foreground">{it ? itemLabel(it) : `Listing ${l.listing_id}`}</span>
                  <span className="tabular-nums text-trade-muted">{money(l.old_price)} → {money(l.new_price)}</span>
                  <span className={l.status === 'applied' ? 'text-xs text-trade-up' : l.status === 'failed' ? 'text-xs text-trade-down' : 'text-xs text-trade-muted'}>
                    {l.status === 'applied' ? 'Doorgevoerd' : l.status === 'failed' ? 'Mislukt' : 'Teruggedraaid'}
                  </span>
                  {l.status === 'applied' && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => revert(l.id)} aria-label="Terugdraaien"><Undo2 className="h-4 w-4" /></Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
