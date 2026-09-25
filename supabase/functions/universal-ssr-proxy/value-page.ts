/**
 * Waardepagina's — /waarde/{artiest}/{album} en de vertaalde varianten.
 *
 * Eén pagina per albumgroep, gevoed door de view public.value_pages.
 * De proxy injecteert hier niet alleen meta-tags maar ook echte body-inhoud,
 * zodat crawlers die geen JavaScript draaien (Bing, DuckDuckGo, de AI-bots)
 * de kop, het antwoord en de persingentabel gewoon kunnen lezen.
 *
 * Indexering is voorwaardelijk: zonder prijsvork staat het antwoord er niet,
 * en dan hoort de pagina ook niet in de index. Zie isIndexable().
 */

const BASE_URL = 'https://musicscans.com';

/** URL-segment per taal. Alleen talen waarvoor de teksten bestaan. */
export const VALUE_TYPES: Record<string, 'nl' | 'en'> = {
  waarde: 'nl',
  value: 'en',
};

export interface ValueRow {
  group_slug: string;
  artist_slug: string;
  album_slug: string;
  artist: string;
  album_title: string;
  version_count: number | null;
  country_count: number | null;
  pressings_by_country: Record<string, number> | null;
  format_counts: Record<string, number> | null;
  first_pressing: { year?: string; country?: string; label?: string; catno?: string; have?: number; want?: number } | null;
  example_pressing_by_locale: Record<string, { year?: string; country?: string; catno?: string; have?: number }> | null;
  reissue_years: number[] | null;
  artwork_url: string | null;
  story_url: string | null;
  price_range_min: number | string | null;
  price_range_max: number | string | null;
  price_median: number | string | null;
  price_observations: number | null;
  priced_at: string | null;
  db_pressings: number | null;
  total_scans: number | null;
}

const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Afkappen op een woordgrens; halve woorden in een snippet zien er slordig uit. */
const clip = (t: string, max = 155): string => {
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > 60 ? cut.slice(0, sp) : cut).replace(/[\s,.;:\u2013\u2014]+$/, '') + '\u2026';
};

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
};

/** Discogs levert maximaal 400 versies terug; 400 is dus "minstens 400". */
const versionsText = (v: number | null, locale: 'nl' | 'en'): string => {
  if (!v) return '';
  if (v >= 400) return locale === 'nl' ? 'ruim 400' : 'over 400';
  return String(v);
};

const money = (v: number, locale: 'nl' | 'en'): string =>
  locale === 'nl'
    ? '€' + v.toFixed(2).replace('.', ',').replace(/,00$/, ',–')
    : '€' + v.toFixed(2).replace(/\.00$/, '');

const dateText = (iso: string | null, locale: 'nl' | 'en'): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const valuePath = (row: ValueRow, locale: 'nl' | 'en'): string => {
  const seg = locale === 'nl' ? 'waarde' : 'value';
  return `${BASE_URL}/${seg}/${row.artist_slug}/${row.album_slug}`;
};

/** Wederzijdse hreflang: nl en en wijzen naar elkaar, en-versie is x-default. */
export const valueAlternates = (row: ValueRow) => [
  { hreflang: 'nl', href: valuePath(row, 'nl') },
  { hreflang: 'en', href: valuePath(row, 'en') },
  { hreflang: 'x-default', href: valuePath(row, 'en') },
];

/** Geen vork, geen antwoord, dus ook niet in de index. */
export const isIndexable = (row: ValueRow): boolean =>
  num(row.price_range_min) !== null && num(row.price_range_max) !== null;

// ---------------------------------------------------------------------------
// Teksten
// ---------------------------------------------------------------------------

const T = {
  nl: {
    h1: (a: string, t: string) => `Wat is ${t} van ${a} waard?`,
    metaTitle: (a: string, t: string) => `${t} – ${a}: waarde van de lp of cd | MusicScan`,
    priceLead: (lo: string, hi: string, med: string, n: number, d: string) =>
      (med ? `De meeste exemplaren gaan weg voor rond ${med}. ` : '') +
      `De vork loopt van ${lo} tot ${hi}` +
      (n ? `, gemeten over ${n} persingen` : '') +
      (d ? `, bijgewerkt op ${d}` : '') +
      `. Wat jouw exemplaar waard is hangt af van de persing en de conditie — dat verschil is groter dan het bedrag zelf.`,
    noPriceLead:
      'Voor deze uitgave stellen we de prijsvork nog samen uit meerdere bronnen. De persingen hieronder staan er al wel: die bepalen uiteindelijk het verschil.',
    spreadLead: (v: string, c: number) =>
      `Van dit album bestaan ${v} verschillende uitgaven, verdeeld over ${c} landen. Dat is precies waarom één prijs niet bestaat.`,
    exampleHead: 'Voorbeeldpersing',
    exampleWhy: 'De uitgave die de meeste verzamelaars bezitten',
    tableHead: 'Persingen in onze database',
    thYear: 'Jaar', thCountry: 'Land', thLabel: 'Label', thCat: 'Catalogusnummer', thFormat: 'Formaat',
    firstHead: 'Uit het jaar van verschijnen',
    firstLead: (y: string, c: string, l: string, n: string) =>
      `Van de uitgaven uit ${y} is dit degene die de meeste verzamelaars bezitten: ${n}, ${c}, op ${l}. Dat is niet per definitie de allereerste persing — die kan in een ander land zijn verschenen — maar het is wel de versie die je het vaakst tegenkomt.`,
    scarcityHead: 'Schaarste',
    scarcity: (have: number, want: number) =>
      `${have.toLocaleString('nl-NL')} verzamelaars hebben deze persing, ${want.toLocaleString('nl-NL')} zoeken hem. ` +
      (want > have ? 'Meer vraag dan aanbod: dat drukt de vork omhoog.' : 'Ruim aanbod, dus de vork blijft laag tenzij je exemplaar echt gaaf is.'),
    formatsHead: 'Op welke dragers',
    storyLink: 'Lees het verhaal achter deze plaat',
    ctaHead: 'Scan je eigen exemplaar',
    cta: 'Fotografeer het label of het catalogusnummer en MusicScan zoekt op welke persing je in handen hebt.',
    faq: (a: string, t: string, v: string) => [
      { q: `Hoeveel verschillende persingen van ${t} bestaan er?`, a: `${v} uitgaven staan geregistreerd, van de eerste persing tot de heruitgaven.` },
      { q: 'Waarom loopt de waarde zo uiteen?', a: 'Land van uitgave, persingsjaar, label en conditie bepalen samen de prijs. Een eerste persing in nette staat kan een veelvoud opbrengen van een latere heruitgave.' },
      { q: 'Hoe weet ik welke persing ik heb?', a: 'Kijk naar het catalogusnummer op het label of de rug van de hoes en vergelijk dat met de tabel hierboven.' },
    ],
  },
  en: {
    h1: (a: string, t: string) => `What is ${t} by ${a} worth?`,
    metaTitle: (a: string, t: string) => `${t} – ${a}: what the record is worth | MusicScan`,
    priceLead: (lo: string, hi: string, med: string, n: number, d: string) =>
      (med ? `Most copies change hands for around ${med}. ` : '') +
      `The range runs from ${lo} to ${hi}` +
      (n ? `, measured across ${n} pressings` : '') +
      (d ? `, updated ${d}` : '') +
      `. What your copy is worth depends on the pressing and its condition — that gap matters more than the figure itself.`,
    noPriceLead:
      'We are still compiling the price range for this release from several sources. The pressings below are already listed: they are what makes the difference.',
    spreadLead: (v: string, c: number) =>
      `This album exists in ${v} different editions across ${c} countries. That is exactly why a single price does not exist.`,
    exampleHead: 'Example pressing',
    exampleWhy: 'The edition most collectors own',
    tableHead: 'Pressings in our database',
    thYear: 'Year', thCountry: 'Country', thLabel: 'Label', thCat: 'Catalogue number', thFormat: 'Format',
    firstHead: 'From the year of release',
    firstLead: (y: string, c: string, l: string, n: string) =>
      `Of the editions from ${y}, this is the one most collectors own: ${n}, ${c}, on ${l}. It is not necessarily the very first pressing — that may have appeared in another country — but it is the version you will run into most often.`,
    scarcityHead: 'Scarcity',
    scarcity: (have: number, want: number) =>
      `${have.toLocaleString('en-GB')} collectors own this pressing, ${want.toLocaleString('en-GB')} are looking for it. ` +
      (want > have ? 'More demand than supply, which pushes the range up.' : 'Plenty of supply, so the range stays low unless your copy is exceptional.'),
    formatsHead: 'Formats',
    storyLink: 'Read the story behind this record',
    ctaHead: 'Scan your own copy',
    cta: 'Photograph the label or the catalogue number and MusicScan works out which pressing you are holding.',
    faq: (a: string, t: string, v: string) => [
      { q: `How many pressings of ${t} exist?`, a: `${v} editions are on record, from the first pressing through the reissues.` },
      { q: 'Why does the value vary so much?', a: 'Country of release, pressing year, label and condition together set the price. A first pressing in clean condition can fetch several times what a later reissue does.' },
      { q: 'How do I tell which pressing I have?', a: 'Check the catalogue number on the label or the spine of the sleeve and compare it with the table above.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

export const renderValueBody = (row: ValueRow, locale: 'nl' | 'en'): string => {
  const t = T[locale];
  const a = esc(row.artist);
  const title = esc(row.album_title);
  const lo = num(row.price_range_min);
  const hi = num(row.price_range_max);
  const versions = versionsText(row.version_count, locale);

  const parts: string[] = [];
  parts.push(`<h1>${esc(t.h1(row.artist, row.album_title))}</h1>`);

  if (lo !== null && hi !== null) {
    const med = num(row.price_median);
    parts.push(`<p>${esc(t.priceLead(money(lo, locale), money(hi, locale), med !== null ? money(med, locale) : '', row.price_observations || 0, dateText(row.priced_at, locale)))}</p>`);
  } else {
    parts.push(`<p>${esc(t.noPriceLead)}</p>`);
  }

  if (versions && row.country_count) {
    parts.push(`<p>${esc(t.spreadLead(versions, row.country_count))}</p>`);
  }

  const ex = row.example_pressing_by_locale?.[locale] || row.example_pressing_by_locale?.en;
  if (ex?.catno) {
    parts.push(
      `<section><h2>${esc(t.exampleHead)}</h2><p>${esc(t.exampleWhy)}: ` +
      `<strong>${esc(ex.catno)}</strong>` +
      (ex.country ? `, ${esc(ex.country)}` : '') +
      (ex.year && ex.year !== '0' ? `, ${esc(ex.year)}` : '') +
      `.</p></section>`
    );
  }

  const fp = row.first_pressing;
  const fpUsable = !!fp?.catno && !['none', 'None', '-', ''].includes(String(fp.catno));
  if (fpUsable && fp?.year && fp.country && fp.label) {
    parts.push(`<section><h2>${esc(t.firstHead)}</h2><p>${esc(t.firstLead(fp.year, fp.country, fp.label, fp.catno))}</p></section>`);
  }

  const rows = (row as any).pressing_rows as Array<Record<string, unknown>> | null;
  if (rows?.length) {
    const body = rows.map((p) =>
      `<tr><td>${esc(p.year)}</td><td>${esc(p.country)}</td><td>${esc(p.label)}</td><td>${esc(p.catno)}</td><td>${esc(p.format)}</td></tr>`
    ).join('');
    parts.push(
      `<section><h2>${esc(t.tableHead)}</h2><table><thead><tr>` +
      `<th>${esc(t.thYear)}</th><th>${esc(t.thCountry)}</th><th>${esc(t.thLabel)}</th>` +
      `<th>${esc(t.thCat)}</th><th>${esc(t.thFormat)}</th>` +
      `</tr></thead><tbody>${body}</tbody></table></section>`
    );
  }

  if (fp && typeof fp.have === 'number' && typeof fp.want === 'number') {
    parts.push(`<section><h2>${esc(t.scarcityHead)}</h2><p>${esc(t.scarcity(fp.have, fp.want))}</p></section>`);
  }

  if (row.format_counts && Object.keys(row.format_counts).length) {
    const list = Object.entries(row.format_counts)
      .sort((x, y) => (y[1] as number) - (x[1] as number))
      .map(([k, v]) => `<li>${esc(k)}: ${esc(v)}</li>`).join('');
    parts.push(`<section><h2>${esc(t.formatsHead)}</h2><ul>${list}</ul></section>`);
  }

  if (row.story_url) {
    parts.push(`<p><a href="${esc(row.story_url)}" rel="noopener">${esc(t.storyLink)}</a></p>`);
  }

  const faq = t.faq(row.artist, row.album_title, versions || '—');
  parts.push('<section><h2>FAQ</h2>' + faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('') + '</section>');

  parts.push(`<section><h2>${esc(t.ctaHead)}</h2><p>${esc(t.cta)}</p></section>`);

  // aria-hidden niet zetten: crawlers moeten dit juist lezen. React vervangt
  // de inhoud van #root zodra de app mount, dus de bezoeker ziet dit hooguit
  // een fractie van een seconde.
  return `<div data-ssr="waarde">${parts.join('')}</div>`;
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export const valueDescription = (row: ValueRow, locale: 'nl' | 'en'): string => {
  const lo = num(row.price_range_min);
  const hi = num(row.price_range_max);
  const versions = versionsText(row.version_count, locale);
  if (locale === 'nl') {
    const med = num(row.price_median);
    const head = lo !== null && hi !== null
      ? (med !== null
          ? `${row.album_title} van ${row.artist} gaat meestal weg voor rond ${money(med, 'nl')}, vork ${money(lo, 'nl')} tot ${money(hi, 'nl')}.`
          : `${row.album_title} van ${row.artist} gaat doorgaans voor ${money(lo, 'nl')} tot ${money(hi, 'nl')}.`)
      : `Wat is ${row.album_title} van ${row.artist} waard?`;
    return clip(`${head} ${versions ? `${versions} persingen` : 'Alle persingen'} op een rij, met catalogusnummers en conditie.`);
  }
  const med2 = num(row.price_median);
  const head = lo !== null && hi !== null
    ? (med2 !== null
        ? `${row.album_title} by ${row.artist} usually sells for around ${money(med2, 'en')}, range ${money(lo, 'en')} to ${money(hi, 'en')}.`
        : `${row.album_title} by ${row.artist} typically sells for ${money(lo, 'en')} to ${money(hi, 'en')}.`)
    : `What is ${row.album_title} by ${row.artist} worth?`;
  return clip(`${head} ${versions ? `${versions} pressings` : 'Every pressing'} listed, with catalogue numbers and condition.`);
};

export const valueJsonLd = (row: ValueRow, locale: 'nl' | 'en'): string => {
  const url = valuePath(row, locale);
  const t = T[locale];
  const faq = t.faq(row.artist, row.album_title, versionsText(row.version_count, locale) || '—');
  return JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'MusicAlbum',
      name: row.album_title,
      byArtist: { '@type': 'MusicGroup', name: row.artist },
      url,
      ...(row.artwork_url ? { image: row.artwork_url } : {}),
      ...(row.first_pressing?.year ? { datePublished: row.first_pressing.year } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]);
};

export const valueTitle = (row: ValueRow, locale: 'nl' | 'en'): string =>
  T[locale].metaTitle(row.artist, row.album_title);
