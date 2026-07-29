# Strategiewijziging MusicScan → musicscans.com

Analyse op basis van `src/router.tsx`, `supabase/functions/generate-static-sitemaps/index.ts`, `src/hooks/useSEO.ts`, `public/sitemap.xml`, `public/robots.txt` en live tellingen uit de database.

## 1. Route-inventaris (nu indexeerbaar)

Statische sitemap (`sitemap-static.xml`) bevat nu 34 URL's; daarnaast 34 dynamische sitemapbestanden. Gemeten aantallen:

| Type | Route | Aantal URLs |
|---|---|---|
| Blog/plaat-verhalen | `/plaat-verhaal/:slug`, `/muziek-verhaal/:slug` | 8.060 gepubliceerd |
| Singles | `/singles/:slug` | 1.780 (86 al noindex) |
| Artiestverhalen | `/artists/:slug` | 239 |
| Nieuws | `/nieuws/:slug` | 212 (timestamp-slugs al noindex) |
| Producten (posters/canvas/shirts/metal) | `/product/:slug` + shopoverzichten | 11.042 (detailpagina's 301 naar /art-shop via `_redirects`) |
| New releases | `/new-release/:slug` | 108 |
| Anekdotes | `/anekdotes/:slug` | 32 |
| Muziekgeschiedenis | `/vandaag-in-de-muziekgeschiedenis` + events | 30 events |
| Overige hubs | `/nederland`, `/frankrijk`, `/dance-house`, `/filmmuziek`, `/kerst`, `/top-2000-analyse`, `/podcasts*`, `/tijdmachine*`, `/studio-stories*`, `/artist-spotlight*`, `/fan-wall*`, `/photo/:id`, `/reviews*`, `/quizzen` | enkele honderden + fanwall/foto-sitemaps |
| Statisch/functioneel | `/`, `/scanner`, `/pricing`, `/over-ons`, `/privacy`, `/voorwaarden`, `/auth`, `/retourbeleid` | 8 |

Totaal indexeerbaar nu: grofweg 22.000+ URL's, waarvan <10 aansluiten op de nieuwe propositie.

Let op: `/scanner` staat wel in de statische sitemap maar bestaat **niet** als route in `src/router.tsx` (de scanroutes zijn `/scan`, `/unified-scanner`, `/quick-price-check`) — dat is nu een dode sitemap-URL.

## 2. Behouden vs noindex

### Blijft indexeerbaar (kern scan + waarde), per taal
- `/` homepage — scan + waarde propositie
- Scanpagina (nieuwe SEO-landingspagina, bv. `/scan-je-platen`) — "scan je LP/CD/vinyl"
- Waardepagina (nieuw, bv. `/waarde-van-je-platen`) — "ontdek de waarde", gekoppeld aan `/quick-price-check`
- How-it-works / uitleg (kan sectie of eigen pagina zijn)
- `/pricing` (credits/prijzen)
- App-downloadpagina (nieuw, bv. `/app`)
- `/over-ons`, `/privacy`, `/voorwaarden` (index, lage prioriteit — vertrouwenssignalen)

Dat is ca. 8 pagina's × 4 talen = ~32 indexeerbare URL's.

### Naar noindex + uit alle sitemaps
Alles wat content/catalogus is: plaat-verhaal + muziek-verhaal (8.060), singles (1.780), artists (239), nieuws (212), producten en shopoverzichten (11.042), new releases (108), anekdotes (32), muziekgeschiedenis (30), plus quizzen, podcasts, tijdmachine, studio-stories, artist-spotlights, fan-wall, foto's, land-/genrehubs, top-2000, kerst, reviews, forum/social.

Pagina's blijven gewoon bereikbaar voor gebruikers; alleen `robots: noindex, follow` + weg uit sitemaps.

### Twijfelgevallen (expliciet)
- `/quizzen`: kan verkeer + engagement geven, maar past niet bij scan+waarde. Voorstel: noindex.
- `/nederland`, `/frankrijk`, `/dance-house`: hebben potentieel autoriteit; voorstel noindex, later heroverwegen.
- `/artists` overzicht: kan later dienen als "waarde per artiest"-hub; nu noindex.
- `/auth` staat nu in de sitemap terwijl robots.txt hem blokkeert — tegenstrijdig, weghalen.

## 3. Meertalige SEO (NL/EN/DE/FR)

Bestaande situatie:
- i18n bestaat, maar alleen NL/EN: `src/i18n/translations.ts` (5.728 regels), `type Language = 'nl' | 'en'`, `LanguageContext` met localStorage + browserdetectie. Er is **geen** taal in de URL.
- hreflang is nu kapot: `src/hooks/useSEO.ts` en `universal-ssr-proxy` schrijven `<link rel="alternate" n="nl">` in plaats van `hreflang="nl"`. Zoekmachines zien dus geen hreflang.

Voorstel:
- URL-prefix per taal voor uitsluitend de kernpagina's: `/nl/...`, `/en/...`, `/de/...`, `/fr/...`, met `/` → NL (of x-default). Prefix alleen invoeren voor de kernset, niet voor de hele (nu noindex) contentberg.
- `Language` uitbreiden naar `'nl' | 'en' | 'de' | 'fr'`; alleen de kernpagina-keys vertalen naar DE/FR (niet de 5.700 regels).
- hreflang-bug fixen (`n=` → `hreflang=`) en per kernpagina 4 alternates + `x-default` uitschrijven, zelfrefererende canonical per taalvariant.
- Vertaalde title/description/OG per taal per kernpagina, via `useSEO` met taalbewuste defaults.

Geraakte bestanden: `src/i18n/translations.ts`, `src/contexts/LanguageContext.tsx`, `src/router.tsx`, `src/hooks/useSEO.ts`, `src/components/SEO/GlobalCanonical.tsx`, `index.html`, `supabase/functions/generate-static-sitemaps/index.ts`, `supabase/functions/universal-ssr-proxy/index.ts`, `public/robots.txt`, `public/sitemap.xml`.

Belangrijke beperking: dit is een client-side SPA. Google verwerkt de door JS gezette hreflang/canonical wel, maar voor zekerheid horen de kernpagina's ook in de SSR-proxy (`universal-ssr-proxy`) te zitten, die nu alleen contentroutes afhandelt.

## 4. App- en weblinks

Huidige links zijn inconsistent: `AppInstallBanner.tsx` wijst naar package `com.musicscan.app`, terwijl de echte Android-package `com.inspirelabs.musicscan` is (zie `GuestScanSignupDialog.tsx` en `android/app/build.gradle`).

Voorstel:
- Eén constantenbestand met `PLAY_STORE_URL` (live), `APP_STORE_URL` (placeholder/verborgen tot live) en de webversie-URL.
- Plaatsing: header-CTA, homepage-hero, nieuwe `/app`-pagina, footer, scan- en waardepagina, plus `GuestScanSignupDialog`.
- SoftwareApplication JSON-LD op de app-pagina met Play Store-link, later uitgebreid met iOS.

## 5. Domeinomslag naar musicscans.com

Kernbestanden die de hardcoded `www.musicscan.app` bevatten (het patroon komt in ~160 bestanden voor; deze zijn SEO-kritisch):
- `index.html` — canonical, og:url, og:image, twitter:image
- `src/lib/utils.ts` — `normalizeFullUrl()` met `canonicalOrigin` en host-regex (centrale plek)
- `src/components/SEO/GlobalCanonical.tsx` — hardcoded canonical-origin
- `src/components/SEO/*` — StructuredData, BreadcrumbSchema, PodcastStructuredData, PosterStructuredData
- `public/robots.txt`, `public/sitemap.xml`, `public/manifest.json`, `public/llms-full.txt`
- `src/utils/sitemap.ts`, `src/components/Footer.tsx`, `src/components/ShareButtons.tsx`
- Edge functions: `generate-static-sitemaps`, `universal-ssr-proxy`, `sitemap-proxy`, `generate-llm-sitemap`, `generate-photo-sitemap`, `generate-podcast-sitemap`, `llm-content`, `serve-llms-txt`, `indexnow-*`, `gsc-sitemap-submit`, `google-sitemap-ping`, `canonical-checker`, `blog-meta-proxy`, plus e-mail/social-functies met linkopbouw
- `public/_redirects` — proxy-rewrites blijven functioneel, maar de content-routes kunnen grotendeels vervallen als die noindex worden
- `capacitor.config.ts`, `android/app/build.gradle` — app-server/deeplinkhost

Aanpak: één gedeelde `SITE_URL`-constante frontend + één `_shared/site.ts` voor edge functions, zodat er nog maar twee plekken zijn om te wisselen. Geen redirects vanaf musicscan.app, conform je keuze (dat betekent: bestaande rankings verdwijnen — bewust geaccepteerd).

## Uitvoeringsvolgorde

1. Domeinconstante centraliseren (frontend + edge shared) en alles op `https://musicscans.com` zetten.
2. hreflang-bug fixen (`n=` → `hreflang=`) in `useSEO` en SSR-proxy.
3. Kernpagina's bouwen/aanscherpen: home, scanpagina, waardepagina, app-pagina, pricing.
4. Sitemaps herbouwen: statische sitemap terugbrengen tot alleen de kernset (× 4 talen), alle content-sitemaps uit `sitemap-index.xml` en `public/sitemap.xml`.
5. Noindex globaal: alle niet-kernroutes `noindex, follow` via een centrale routelijst in `useSEO` + SSR-proxy.
6. i18n uitbreiden naar DE/FR voor de kernset, taalprefix-routes en hreflang-set van 4 + x-default.
7. App-links consolideren (juiste Play Store-package, iOS placeholder) en overal plaatsen.
8. robots.txt herschrijven, sitemap opnieuw indienen in Search Console op het nieuwe domein, IndexNow-queue leegmaken/opnieuw richten.
