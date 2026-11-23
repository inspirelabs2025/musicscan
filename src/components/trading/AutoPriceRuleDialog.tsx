import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STRATEGIES, itemLabel, money, type AutoPriceRule, type InventoryItem } from '@/lib/trading';
import { useSaveAutoPriceRule } from '@/hooks/useTradingDesk';

export function AutoPriceRuleDialog({ item, rule, onClose }: { item: InventoryItem; rule?: AutoPriceRule; onClose: () => void }) {
  const save = useSaveAutoPriceRule();
  const suggestedMin = item.price ? Math.round(item.price * 0.7 * 100) / 100 : 5;
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [strategy, setStrategy] = useState<AutoPriceRule['strategy']>(rule?.strategy ?? 'undercut_lowest');
  const [undercut, setUndercut] = useState(String(rule?.undercut_amount ?? 0.5));
  const [offset, setOffset] = useState(String(rule?.offset_pct ?? -5));
  const [minPrice, setMinPrice] = useState(String(rule?.min_price ?? suggestedMin));
  const [maxPrice, setMaxPrice] = useState(rule?.max_price != null ? String(rule.max_price) : '');

  useEffect(() => { if (strategy !== 'market_offset' && offset === '') setOffset('0'); }, [strategy, offset]);

  const submit = async () => {
    try {
      await save.mutateAsync({
        inventory_item_id: item.id,
        enabled,
        strategy,
        undercut_amount: Number(undercut.replace(',', '.')) || 0,
        offset_pct: Number(offset.replace(',', '.')) || 0,
        min_price: Number(minPrice.replace(',', '.')),
        max_price: maxPrice.trim() ? Number(maxPrice.replace(',', '.')) : null,
      });
      toast.success(enabled ? 'Automatisch prijzen staat aan' : 'Automatisch prijzen staat uit');
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Automatisch prijzen</DialogTitle>
          <DialogDescription>
            {itemLabel(item)} · nu {money(item.price, item.currency)} · markt {money(item.market_price, item.currency)} · laagste {money(item.lowest_price, item.currency)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="ap-enabled">Aan</Label>
            <Switch id="ap-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="space-y-1.5">
            <Label>Strategie</Label>
            <Select value={strategy} onValueChange={(v) => setStrategy(v as AutoPriceRule['strategy'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STRATEGIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{STRATEGIES.find((s) => s.value === strategy)?.hint}</p>
          </div>
          {strategy === 'undercut_lowest' && (
            <div className="space-y-1.5">
              <Label htmlFor="ap-undercut">Zoveel onder de laagste ({item.currency ?? 'EUR'})</Label>
              <Input id="ap-undercut" inputMode="decimal" value={undercut} onChange={(e) => setUndercut(e.target.value)} />
            </div>
          )}
          {strategy === 'market_offset' && (
            <div className="space-y-1.5">
              <Label htmlFor="ap-offset">Afwijking van de marktprijs (%)</Label>
              <Input id="ap-offset" inputMode="decimal" value={offset} onChange={(e) => setOffset(e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ap-min">Minimumprijs</Label>
              <Input id="ap-min" inputMode="decimal" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-max">Maximumprijs (optioneel)</Label>
              <Input id="ap-max" inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            We passen de prijs op Discogs hooguit eens per 6 uur aan en gaan nooit onder je minimumprijs. Elke wijziging zie je terug in het logboek en kun je terugdraaien.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={submit} disabled={save.isPending}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
