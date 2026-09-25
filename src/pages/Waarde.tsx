import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera } from 'lucide-react';
import { ValuePageLinks } from '@/components/ValuePageLinks';
import { INDEXABLE_VALUE_LOCALES } from '@/lib/indexable';
import { JsonLd } from '@/components/SEO/JsonLd';
import { SITE_URL } from '@/config/site';

type Locale = 'nl' | 'en';

interface ValueRow {
  group_slug: string;
  artist_slug: string;
  album_slug: string;
  artist: string;
  album_title: string;
  version_count: number | null;
  country_count: number | null;
  format_counts: Record<string, number> | null;
  first_pressing: { year?: string; country?: string; label?: string; catno?: string; have?: number; want?: number } | null;
  example_pressing_by_locale: Record<string, { year?: string; country?: string; catno?: string }> | null;
  artwork_url: string | null;
  story_url: string | null;
  price_range_min: number | string | null;
  price_range_max: number | string | null;
  group_slug: string;
  price_median: number | string | null;
  price_observations: number | null;
  priced_at: string | null;
  pressing_rows: Array<{ year?: number; country?: string; label?: string; catno?: string; format?: string }> | null;
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
};

/** Discogs levert maximaal 400 versies; 400 betekent dus "minstens 400". */
const versionsText = (v: number | null, loc: Locale) =>
  !v ? '' : v >= 400 ? (loc === 'nl' ? 'ruim 400' : 'over 400') : String(v);

const money = (v: number, loc: Locale) =>
  loc === 'nl'
    ? '€' + v.toFixed(2).replace('.', ',').replace(/,00$/, ',–')
    : '€' + v.toFixed(2).replace(/\.00$/, '');

const dateText = (iso: string | null, loc: Locale) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(loc === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const COPY = {
  nl: {
    h1: (a: string, t: string) => `Wat is ${t} van ${a} waard?`,
    priceLabel: 'Meestal rond',
    rangeLabel: 'Vork',
    priceNote: (d: string, n: number) => `gemeten over ${n} persingen${d ? `, bijgewerkt op ${d}` : ''}`,
    noPrice: 'De prijsvork voor dit album stellen we nog samen uit meerdere bronnen. De persingen hieronder staan er al wel: die bepalen uiteindelijk het verschil.',
    lead: (lo: string, hi: string) => `Wat jouw exemplaar waard is hangt af van de persing en de conditie — dat verschil is groter dan het bedrag zelf. De vork van ${lo} tot ${hi} is precies dat verschil.`,
    spread: (v: string, c: number) => `Van dit album bestaan ${v} verschillende uitgaven, verdeeld over ${c} landen. Dat is precies waarom één prijs niet bestaat.`,
    exampleHead: 'Voorbeeldpersing',
    exampleWhy: 'De uitgave die de meeste verzamelaars bezitten',
    firstHead: 'Uit het jaar van verschijnen',
    firstLead: (y: string, c: string, l: string, n: string) =>
      `Van de uitgaven uit ${y} is dit degene die de meeste verzamelaars bezitten: ${n}, ${c}, op ${l}. Dat is niet per definitie de allereerste persing — die kan in een ander land zijn verschenen — maar het is wel de versie die je het vaakst tegenkomt.`,
    tableHead: 'Persingen in onze database',
    th: ['Jaar', 'Land', 'Label', 'Catalogusnummer', 'Formaat'],
    scarcityHead: 'Schaarste',
    scarcity: (h: number, w: number) =>
      `${h.toLocaleString('nl-NL')} verzamelaars hebben deze persing, ${w.toLocaleString('nl-NL')} zoeken hem. ` +
      (w > h ? 'Meer vraag dan aanbod: dat drukt de vork omhoog.' : 'Ruim aanbod, dus de vork blijft laag tenzij je exemplaar echt gaaf is.'),
    formatsHead: 'Op welke dragers',
    story: 'Lees het verhaal achter deze plaat',
    ctaHead: 'Scan je eigen exemplaar',
    cta: 'Fotografeer het label of het catalogusnummer en MusicScan zoekt op welke persing je in handen hebt.',
    ctaBtn: 'Start scannen',
    notFound: 'Deze waardepagina bestaat nog niet.',
    back: 'Terug naar de homepage',
  },
  en: {
    h1: (a: string, t: string) => `What is ${t} by ${a} worth?`,
    priceLabel: 'Usually around',
    rangeLabel: 'Range',
    priceNote: (d: string, n: number) => `measured across ${n} pressings${d ? `, updated ${d}` : ''}`,
    noPrice: 'We are still compiling the price range for this album from several sources. The pressings below are already listed: they are what makes the difference.',
    lead: (lo: string, hi: string) => `What your copy is worth depends on the pressing and its condition — that gap matters more than the figure itself. The range from ${lo} to ${hi} is exactly that gap.`,
    spread: (v: string, c: number) => `This album exists in ${v} different editions across ${c} countries. That is exactly why a single price does not exist.`,
    exampleHead: 'Example pressing',
    exampleWhy: 'The edition most collectors own',
    firstHead: 'From the year of release',
    firstLead: (y: string, c: string, l: string, n: string) =>
      `Of the editions from ${y}, this is the one most collectors own: ${n}, ${c}, on ${l}. It is not necessarily the very first pressing — that may have appeared in another country — but it is the version you will run into most often.`,
    tableHead: 'Pressings in our database',
    th: ['Year', 'Country', 'Label', 'Catalogue number', 'Format'],
    scarcityHead: 'Scarcity',
    scarcity: (h: number, w: number) =>
      `${h.toLocaleString('en-GB')} collectors own this pressing, ${w.toLocaleString('en-GB')} are looking for it. ` +
      (w > h ? 'More demand than supply, which pushes the range up.' : 'Plenty of supply, so the range stays low unless your copy is exceptional.'),
    formatsHead: 'Formats',
    story: 'Read the story behind this record',
    ctaHead: 'Scan your own copy',
    cta: 'Photograph the label or the catalogue number and MusicScan works out which pressing you are holding.',
    ctaBtn: 'Start scanning',
    notFound: 'This value page does not exist yet.',
    back: 'Back to the homepage',
  },
} as const;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-8">
    <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-primary mb-2">{title}</h2>
    {children}
  </section>
);

const Waarde: React.FC = () => {
  const { artistSlug, albumSlug } = useParams<{ artistSlug: string; albumSlug: string }>();
  const { pathname } = useLocation();
  const locale: Locale = /^\/(en\/)?value\//.test(pathname) ? 'en' : 'nl';
  const t = COPY[locale];

  const { data: row, isLoading } = useQuery({
    queryKey: ['value-page', artistSlug, albumSlug],
    enabled: !!artistSlug && !!albumSlug,
    queryFn: async () => {
      const { data } = await supabase
        .from('value_pages' as any)
        .select('*')
        .eq('group_slug', `${artistSlug}-${albumSlug}`)
        .maybeSingle();
      return (data as unknown as ValueRow) || null;
    },
  });

  const lo = num(row?.price_range_min);
  const hi = num(row?.price_range_max);
  const med = num(row?.price_median);
  const hasPrice = lo !== null && hi !== null;
  const versions = versionsText(row?.version_count ?? null, locale);

  useSEO({
    title: row
      ? locale === 'nl'
        ? `${row.album_title} – ${row.artist}: waarde van de lp of cd | MusicScan`
        : `${row.album_title} – ${row.artist}: what the record is worth | MusicScan`
      : undefined,
    description: row
      ? hasPrice
        ? t.lead(money(lo!, locale), money(hi!, locale)).slice(0, 158)
        : t.h1(row.artist, row.album_title).slice(0, 158)
      : undefined,
    image: row?.artwork_url || undefined,
    // Geen vork betekent geen antwoord op de vraag in de H1; dan hoort de
    // pagina niet in de index. En zolang alleen Nederlands geïndexeerd wordt,
    // staat de Engelse variant er ook buiten. Dit spiegelt isIndexable() in
    // de SSR-proxy; die twee mogen nooit uiteenlopen.
    noindex: !hasPrice || !INDEXABLE_VALUE_LOCALES.includes(locale),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">{t.notFound}</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">{t.back}</Link>
      </div>
    );
  }

  // Welke hub boven dit album hangt, afgeleid uit de dragers in de data.
  const fc = row.format_counts ?? {};
  const hub: 'lp' | 'cd' = Number(fc['CD'] ?? 0) > Number(fc['Vinyl'] ?? 0) ? 'cd' : 'lp';
  const hubLabel = hub === 'cd' ? 'Wat is je cd waard' : 'Wat is je lp waard';

  const ex = row.example_pressing_by_locale?.[locale] || row.example_pressing_by_locale?.en;
  const fp = row.first_pressing;
  const fpUsable = !!fp?.catno && !['none', 'None', '-', ''].includes(String(fp.catno));
  const rows = row.pressing_rows || [];

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MusicScan', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: hubLabel, item: `${SITE_URL}/waarde/${hub}` },
      { '@type': 'ListItem', position: 3, name: row.album_title },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {locale === 'nl' ? <JsonLd data={breadcrumb} /> : null}

      {locale === 'nl' ? (
        <nav aria-label="Kruimelpad" className="mb-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">MusicScan</Link>
          <span className="mx-1.5">&rsaquo;</span>
          <Link to={`/waarde/${hub}`} className="hover:underline">{hubLabel}</Link>
          <span className="mx-1.5">&rsaquo;</span>
          <span className="text-foreground">{row.album_title}</span>
        </nav>
      ) : null}

      <h1 className="text-3xl font-bold leading-tight text-balance">{t.h1(row.artist, row.album_title)}</h1>

      {hasPrice ? (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {med !== null ? t.priceLabel : t.rangeLabel}
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums">
            {med !== null ? money(med, locale) : `${money(lo!, locale)} – ${money(hi!, locale)}`}
          </p>
          {med !== null ? (
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {t.rangeLabel} {money(lo!, locale)} – {money(hi!, locale)}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {t.priceNote(dateText(row.priced_at, locale), row.price_observations || rows.length)}
          </p>
          <p className="mt-3 text-sm">{t.lead(money(lo!, locale), money(hi!, locale))}</p>
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">{t.noPrice}</p>
      )}

      {versions && row.country_count ? (
        <p className="mt-5 text-[15px] leading-relaxed">{t.spread(versions, row.country_count)}</p>
      ) : null}

      {ex?.catno ? (
        <Section title={t.exampleHead}>
          <p className="text-[15px]">
            {t.exampleWhy}: <strong>{ex.catno}</strong>
            {ex.country ? `, ${ex.country}` : ''}
            {ex.year && ex.year !== '0' ? `, ${ex.year}` : ''}.
          </p>
        </Section>
      ) : null}

      {fpUsable && fp?.year && fp.country && fp.label ? (
        <Section title={t.firstHead}>
          <p className="text-[15px] leading-relaxed">{t.firstLead(fp.year, fp.country, fp.label, String(fp.catno))}</p>
        </Section>
      ) : null}

      {rows.length ? (
        <Section title={t.tableHead}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {t.th.map((h) => (
                    <th key={h} className="border-b px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={`${p.catno}-${p.country}-${i}`}>
                    <td className="border-b px-2 py-2 tabular-nums">{p.year}</td>
                    <td className="border-b px-2 py-2">{p.country}</td>
                    <td className="border-b px-2 py-2">{p.label}</td>
                    <td className="border-b px-2 py-2 font-mono text-[13px]">{p.catno}</td>
                    <td className="border-b px-2 py-2">{p.format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {fp && typeof fp.have === 'number' && typeof fp.want === 'number' ? (
        <Section title={t.scarcityHead}>
          <p className="text-[15px] leading-relaxed">{t.scarcity(fp.have, fp.want)}</p>
        </Section>
      ) : null}

      {row.format_counts && Object.keys(row.format_counts).length ? (
        <Section title={t.formatsHead}>
          <ul className="flex flex-wrap gap-2">
            {Object.entries(row.format_counts)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <li key={k} className="rounded-full border px-3 py-1 text-sm">
                  {k} <span className="tabular-nums text-muted-foreground">{v}</span>
                </li>
              ))}
          </ul>
        </Section>
      ) : null}

      {row.story_url ? (
        <p className="mt-8">
          <a href={row.story_url} rel="noopener" className="text-primary underline">{t.story}</a>
        </p>
      ) : null}

      {locale === 'nl' ? (
        <Section title="Andere albums">
          <ValuePageLinks limit={6} />
        </Section>
      ) : null}

      <Section title={t.ctaHead}>
        <p className="text-[15px]">{t.cta}</p>
        <Link
          to="/"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          {t.ctaBtn}
        </Link>
      </Section>
    </div>
  );
};

export default Waarde;
