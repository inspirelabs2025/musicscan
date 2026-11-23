// Trading Desk shared types and helpers.
export type Signal = 'overpriced' | 'underpriced' | 'fair' | 'unknown';
export type AlertType =
  | 'overpriced' | 'underpriced' | 'market_listing' | 'wishlist_match' | 'wantlist_available' | 'discogs_news';

export const ALERT_TYPES: { type: AlertType; label: string; description: string }[] = [
  { type: 'overpriced', label: 'Te duur', description: 'Je vraagt duidelijk meer dan de markt' },
  { type: 'underpriced', label: 'Te goedkoop', description: 'Je laat geld liggen' },
  { type: 'market_listing', label: 'Nieuw op de markt', description: 'Een andere verkoper biedt jouw plaat aan' },
  { type: 'wishlist_match', label: 'Koper gevonden', description: 'Jouw plaat staat op iemands wantlist' },
  { type: 'wantlist_available', label: 'Gezocht en te koop', description: 'Een plaat van je wantlist is te koop' },
  { type: 'discogs_news', label: 'Discogs-nieuws', description: 'Nieuws en updates over Discogs' },
];

export interface InventoryItem {
  id: string;
  user_id: string;
  listing_id: number;
  release_id: number;
  artist: string | null;
  title: string | null;
  thumb: string | null;
  format: string | null;
  condition: string | null;
  sleeve_condition: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  listing_uri: string | null;
  market_price: number | null;
  lowest_price: number | null;
  num_for_sale: number | null;
  prev_num_for_sale: number | null;
  deviation_pct: number | null;
  signal: Signal;
  market_checked_at: string | null;
  last_synced_at: string | null;
}

export interface WantlistItem {
  id: string;
  release_id: number;
  artist: string | null;
  title: string | null;
  thumb: string | null;
  year: number | null;
  lowest_price: number | null;
  num_for_sale: number | null;
  prev_num_for_sale: number | null;
  currency: string | null;
  market_checked_at: string | null;
}

export interface TradingAlert {
  id: string;
  type: AlertType;
  title: string;
  body: string | null;
  link: string | null;
  release_id: number | null;
  related_user_id: string | null;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface PriceSnapshot {
  release_id: number;
  condition: string;
  suggested_price: number | null;
  lowest_price: number | null;
  num_for_sale: number | null;
  currency: string | null;
  captured_at: string;
}

export interface AutoPriceRule {
  id: string;
  inventory_item_id: string;
  enabled: boolean;
  strategy: 'undercut_lowest' | 'match_suggested' | 'market_offset';
  undercut_amount: number;
  offset_pct: number;
  min_price: number;
  max_price: number | null;
  last_applied_at: string | null;
}

export interface AlertPrefs {
  user_id: string;
  enabled_types: AlertType[];
  sound_enabled: boolean;
  push_enabled: boolean;
  threshold_pct: number;
  share_wantlist: boolean;
}

export const STRATEGIES: { value: AutoPriceRule['strategy']; label: string; hint: string }[] = [
  { value: 'undercut_lowest', label: 'Net onder de laagste', hint: 'Altijd de goedkoopste aanbieder, tot je minimum' },
  { value: 'match_suggested', label: 'Gelijk aan marktprijs', hint: 'Volg de Discogs-prijssuggestie voor jouw conditie' },
  { value: 'market_offset', label: 'Marktprijs ± %', hint: 'Bijvoorbeeld 5% onder de markt' },
];

export const money = (n: number | null | undefined, cur?: string | null) =>
  n == null ? '–' : new Intl.NumberFormat('nl-NL', { style: 'currency', currency: cur || 'EUR' }).format(Number(n));

export const pct = (n: number | null | undefined) =>
  n == null ? '–' : `${n > 0 ? '+' : ''}${Number(n).toFixed(1)}%`;

export const signalLabel: Record<Signal, string> = {
  overpriced: 'Te duur',
  underpriced: 'Te goedkoop',
  fair: 'Marktconform',
  unknown: 'Nog niet gecheckt',
};

export const itemLabel = (i: { artist?: string | null; title?: string | null }) =>
  [i.artist, i.title].filter(Boolean).join(' – ') || 'Onbekende release';

/** Change between first and last value in a series, in %. */
export function seriesChange(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => x != null && !Number.isNaN(Number(x))).map(Number);
  if (v.length < 2 || v[0] === 0) return null;
  return Math.round(((v[v.length - 1] - v[0]) / v[0]) * 1000) / 10;
}

/** Portfolio value per day: sum over items of that day's market price (last known). */
export function portfolioSeries(items: InventoryItem[], snaps: PriceSnapshot[]) {
  const byRelease = new Map<number, PriceSnapshot[]>();
  for (const s of snaps) {
    const arr = byRelease.get(s.release_id) ?? [];
    arr.push(s);
    byRelease.set(s.release_id, arr);
  }
  const days = [...new Set(snaps.map((s) => s.captured_at.slice(0, 10)))].sort();
  return days.map((day) => {
    let value = 0;
    let asking = 0;
    for (const it of items) {
      const series = (byRelease.get(it.release_id) ?? [])
        .filter((s) => s.captured_at.slice(0, 10) <= day && (s.condition === it.condition || s.condition === 'all'))
        .sort((a, b) => a.captured_at.localeCompare(b.captured_at));
      const exact = series.filter((s) => s.condition === it.condition);
      const last = (exact.length ? exact : series).at(-1);
      const price = last ? (last.suggested_price ?? last.lowest_price) : null;
      if (price != null) { value += Number(price); asking += Number(it.price ?? 0); }
    }
    return { day, value: Math.round(value * 100) / 100, asking: Math.round(asking * 100) / 100 };
  });
}
