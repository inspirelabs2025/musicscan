import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Row {
  artist_slug: string;
  album_slug: string;
  artist: string;
  album_title: string;
  price_range_min: number | string | null;
  price_range_max: number | string | null;
  price_median: number | string | null;
}

const eur = (v: unknown) => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? '€' + n.toFixed(2).replace('.', ',').replace(/,00$/, ',–') : null;
};

/**
 * De interne links naar de waardepagina's. Zonder deze lijst zijn die pagina's
 * wezen: een sitemap is een hint, geen link, en een nieuw domein krijgt geen
 * crawlbudget voor URL's waar niets naartoe wijst.
 */
export const ValuePageLinks: React.FC<{ limit?: number; heading?: string }> = ({
  limit = 24,
  heading,
}) => {
  const { data } = useQuery({
    queryKey: ['value-page-links', limit],
    queryFn: async () => {
      const { data } = await supabase
        .from('value_pages' as any)
        .select('artist_slug, album_slug, artist, album_title, price_range_min, price_range_max, price_median')
        .not('price_range_min', 'is', null)
        .order('artist', { ascending: true })
        .limit(limit);
      return (data as unknown as Row[]) ?? [];
    },
  });

  if (!data?.length) return null;

  return (
    <section className="mt-12">
      {heading ? <h2 className="text-2xl font-bold mb-5">{heading}</h2> : null}
      <ul className="grid gap-2 sm:grid-cols-2">
        {data.map((r) => {
          const med = eur(r.price_median);
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
