import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { money } from '@/lib/trading';

/** Trading-app style order ticket. Discogs does not allow third-party checkout, so "Koop nu" hands off to the cheapest Discogs listing. */
export function BuyTicket({ releaseId, price, currency, forSale, condition }: {
  releaseId: number; price: number | null | undefined; currency: string | null | undefined; forSale?: number | null; condition?: string | null;
}) {
  const cur = currency ?? 'EUR';
  const sellersUrl = `https://www.discogs.com/sell/release/${releaseId}?sort=price%2Casc`;
  const rows: [string, React.ReactNode][] = [
    ['Prijs', price != null ? money(price, cur) : 'Onbekend'],
    ['Verkoper', <a key="s" href={sellersUrl} target="_blank" rel="noreferrer" className="underline decoration-trade-grid hover:text-vinyl-gold">Goedkoopste op Discogs{forSale ? ` (${forSale} aanbieders)` : ''}</a>],
    ['Conditie', condition ?? 'Alle condities'],
    ['Aantal', '1'],
  ];
  return (
    <div className="rounded-lg border border-vinyl-gold/40 bg-trade-grid/20 p-3">
      <div className="mb-2 text-sm font-semibold text-trade-panel-foreground">Kooporder</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <dl className="space-y-1 text-sm">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-2"><dt className="text-trade-muted">{k}</dt><dd className="text-right tabular-nums">{v}</dd></div>)}
        </dl>
        <div className="space-y-1 rounded-md border border-trade-grid p-2 text-sm">
          <div className="text-[11px] uppercase tracking-wide text-trade-muted">Afrekening</div>
          <div className="flex justify-between"><span className="text-trade-muted">Subtotaal</span><span className="tabular-nums">{price != null ? money(price, cur) : '–'}</span></div>
          <div className="flex justify-between"><span className="text-trade-muted">Verzending</span><span>Door verkoper bepaald</span></div>
          <div className="flex justify-between border-t border-trade-grid pt-1 font-semibold"><span>Totaal vanaf</span><span className="tabular-nums">{price != null ? money(price, cur) : '–'}</span></div>
        </div>
      </div>
      <div className="sticky bottom-0 -mx-3 -mb-3 mt-3 flex flex-col-reverse items-stretch gap-2 rounded-b-lg bg-trade-panel/95 p-3 backdrop-blur sm:static sm:m-0 sm:flex-row sm:items-center sm:justify-between sm:bg-transparent sm:p-0">
        <span className="flex items-center gap-1 text-xs text-trade-muted"><ShieldCheck className="h-3.5 w-3.5" />Je rekent veilig af bij Discogs.</span>
        <Button asChild size="lg" className="h-12 w-full rounded-full px-8 sm:h-11 sm:w-auto bg-vinyl-gold text-background hover:bg-vinyl-gold/90 font-bold">
          <a href={sellersUrl} target="_blank" rel="noreferrer">Koop nu {price != null ? `· ${money(price, cur)}` : ''}<ExternalLink className="ml-1 h-4 w-4" /></a>
        </Button>
      </div>
    </div>
  );
}
