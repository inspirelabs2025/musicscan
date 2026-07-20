# Plan B (voorbereiding, NIET activeren): canonicaliseer "zwakke" singles naar artist-pagina

Vervolgstap bovenop Optie A. Doel: URLs die te dun/duplicaat-achtig zijn maar geen exacte match hebben op de A-regels, laten wegwijzen naar de sterke artist-pagina i.p.v. slechts te noindexen. Dit consolideert linkwaarde.

## Definitie "sterk" vs "zwak" single

Een single is **sterk** (blijft indexeerbaar, eigen canonical) als ALLE volgende gelden:
- `is_published = true` en `single_name IS NOT NULL`
- Niet gemarkeerd door Optie A (geen variant-keyword, geen ISO-datum in slug, canonical duplicate of enige rij van zijn (artist, single_name) groep)
- `length(story_content) >= 2500` **EN** `word_count >= 350` (of `word_count IS NULL` én `length(story_content) >= 3500`)
- `views_count >= 25` **OF** `year` gevuld **OF** `label` gevuld (signalen dat het geen "generieke" AI-generatie is)
- Geen "featuring"/"remix"-clutter in `single_name` (`/(feat\.|featuring|remix|edit|mix)/i` → automatisch zwak)

Alles wat niet aan bovenstaande voldoet = **zwak**.

## Doel-canonical

Voor elke zwakke single bepalen we in volgorde:
1. Bestaat er een rij in `artist_stories` waar `is_published = true` en (case-insensitive) `artist_name = single.artist`? → canonical = `/artists/<artist_stories.slug>` (én noindex op de single).
2. Anders: alleen `noindex, follow` (geen canonical-swap), zodat we geen canonical naar een niet-bestaande pagina zetten.

Nooit een canonical laten wijzen naar een andere `/singles/`-URL.

## Verwachte impact bovenop A

Snelle raming uit huidige data (1780 published singles, 86 al door A gedekt):
- Rijen met `word_count < 350` of `length(story_content) < 2500`: ~500–700 (schatting; nog exact meten vóór activatie).
- Rijen met `views_count = 0` en zonder `year`/`label`: overlap groot met bovenstaande.
- Verwachte extra noindex-set B: **~400–600 URLs** (na aftrek van overlap met A).
- Van die B-set heeft ruwweg 60–75% een bestaande `artist_stories`-rij en krijgt dus een echte canonical naar `/artists/<slug>`; de rest krijgt puur noindex.

Exacte getallen leveren we met een read-only SQL-run vlak vóór activatie (zodat drempels 2500 / 350 / 25 desgewenst nog bijgesteld kunnen worden).

## Bestanden die veranderen bij activatie

1. `supabase/functions/_shared/thin-singles.ts`
   - Nieuwe helper `classifyWeakSingle(row, opts)` die de bovenstaande criteria toepast en `{ noindex: boolean, canonical: string | null }` teruggeeft.
   - `opts.hasArtistStory: (artist: string) => boolean` zodat de caller de artist-story lookup injecteert (edge vs. client).

2. `src/lib/thinSingles.ts`
   - Client-twin van dezelfde helper (zonder DB-calls; caller injecteert lookup).

3. `src/pages/SingleDetail.tsx`
   - Na fetch: extra query `artist_stories` op `artist_name ILIKE row.artist` om `hasArtistStory`/`artistSlug` te bepalen.
   - `useSEO({ noindex, canonicalUrl })` — bij zwak+artist gebruikt canonical = `https://www.musicscan.app/artists/<artistSlug>`.

4. `supabase/functions/universal-ssr-proxy/index.ts` (`case 'singles'`)
   - Zelfde `hasArtistStory` lookup via `sb.from('artist_stories')`.
   - `meta.noindex` en `meta.url` (canonical) aanpassen; ook `og:url` volgt `meta.url`.

5. `supabase/functions/generate-static-sitemaps/index.ts`
   - `filteredSingles` uitbreiden: verwijder ook alle "zwak"-rijen uit `sitemap-singles.xml` én `sitemap-images-singles.xml`.
   - Batch-lookup van gepubliceerde `artist_stories.artist_name` (één query, in-memory Set) om de sitemap-filter snel te houden.

6. Nieuwe telemetrie/log: aantal singles → `weak_with_canonical`, `weak_noindex_only`, `strong_kept`.

## Rollout-veiligheden

- Feature-flag env var `THIN_SINGLES_MODE = "off" | "sitemap_only" | "full"`:
  - `off`: alleen A actief (huidige state na deze deploy).
  - `sitemap_only`: B alleen uit sitemap houden, nog geen noindex/canonical injectie (veilige dry-run in GSC).
  - `full`: noindex + canonical actief.
- Eén dashboard-query om te tellen hoeveel URLs per modus geraakt worden vóór flag-flip.

## Nog te bevestigen vóór activatie

- Definitieve drempels (2500 chars / 350 words / 25 views) — of alternatieven op basis van de precieze verdeling.
- Case-sensitivity van `artist_name` in `artist_stories` vs `artist` in `music_stories` (mogelijk normalisatiefunctie nodig).
- Of we ook singles met `word_count IS NULL AND length(story_content) < 3500` willen dekken of die als grijs gebied laten staan.
