import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Dezelfde volgorde, afronding en zusterkeuze als de voorgerenderde HTML.
import { hubForRow, pickSiblings, roundMedian } from '../../supabase/functions/universal-ssr-proxy/value-page';

interface Row {
  artist_slug: string;
  album_slug: string;
  artist: string;
  album_title: string;
  price_range_min: number | string | null;
  price_range_max: number | string | null;
  price_median: number | string | null;
  format_counts: Record<string, number> | null;
}

const toNum = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
};
const eur = (v: unknown) => {
  const n = toNum(v);
  return n !== null ? '€' + n.toFixed(2).replace('.', ',').replace(/,00$/, ',–') : null;
};

/**
 * De interne links naar de waardepagina's. Zonder deze lijst zijn die pagina's
 * wezen: een sitemap is een hint, geen link, en een nieuw domein krijgt geen
 * crawlbudget voor URL's waar niets naartoe wijst.
 */
export const ValuePageLinks: React.FC<{
  limit?: number;
  heading?: string;
  /** Album waarvan dit de zusterlinks zijn: dan de volgende `limit` in ronde volgorde. */
  around?: { artist_slug: string; album_slug: string };
  /** Alleen de albums onder deze hub (lp of cd), zoals de voorgerenderde hub. */
  hub?: 'lp' | 'cd';
}> = ({ limit = 24, heading, around, hub }) => {
  const { data: all } = useQuery({
    queryKey: ['value-page-links'],
    queryFn: async () => {
      const { data } = await supabase
        .from('value_pages' as any)
        .select('artist_slug, album_slug, artist, album_title, price_range_min, price_range_max, price_median, format_counts')
        .not('price_range_min', 'is', null)
        .not('price_range_max', 'is', null)
        .limit(1000);
      return (data as unknown as Row[]) ?? [];
    },
  });

  const pool = all ? (hub ? all.filter((r) => hubForRow(r as any) === hub) : all) : [];
  const data = pickSiblings(pool, around ?? null, limit);
  if (!data.length) return null;

  return (
    <section className="mt-12">
      {heading ? <h2 className="text-2xl font-bold mb-5">{heading}</h2> : null}
      <ul className="grid gap-2 sm:grid-cols-2">
        {data.map((r) => {
          const m = toNum(r.price_median);
          const med = m !== null ? eur(roundMedian(m, toNum(r.price_range_min), toNum(r.price_range_max))) : null;
          const lo = eur(r.price_range_min);
          const hi = eur(r.price_range_max);
          return (
            <li key={`${r.artist_slug}-${r.album_slug}`}>
              <Link
                to={`/waarde/${r.artist_slug}/${r.album_slug}`}
                className="flex items-baseline justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.album_title}</span>
                  <span className="block truncate text-sm text-muted-foreground">{r.artist}</span>
                </span>
                <span className="shrink-0 text-right text-sm tabular-nums">
                  {med ? <span className="font-semibold">{med}</span> : null}
                  {lo && hi ? (
                    <span className="block text-xs text-muted-foreground">
                      {lo}&nbsp;&ndash;&nbsp;{hi}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ValuePageLinks;
