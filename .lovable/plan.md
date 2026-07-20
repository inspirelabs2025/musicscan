# /singles/ SEO-analyse (alleen bevindingen, geen wijzigingen)

## 1. Databron
- Route `/singles/:slug` en overzicht `/singles` worden gevoed door één tabel: **`music_stories`** met filter `is_published = true AND single_name IS NOT NULL`.
- Volume:
  - Totaal rijen in `music_stories`: **1.780**
  - Gepubliceerd: **1.780** (100%)
  - Met `single_name`: **1.780** → alle rijen zijn "singles"
- Sitemap-generator (`supabase/functions/generate-static-sitemaps/index.ts`) publiceert deze **allemaal** in `sitemap-singles.xml` (+ image-sitemap), en de overzichtspagina `/singles` staat als daily changefreq in `sitemap-static`.

## 2. Content-lengte
- Gemiddelde `story_content`: **~6.085 tekens** (~900-1.000 woorden).
- Gemiddelde `meta_description`: 140 tekens.
- Rijen met `< 500` of `< 1500` tekens body: **0**.
- Conclusie: de pagina's zijn niet "leeg" of formeel dun in bytes. Het dun/duplicaat-signaal van Google zit dus niet in ontbrekende tekst maar in **redundantie tussen pagina's** (zelfde artiest/song, near-duplicate verhalen) en in **onderwerpen die geen zoekwaarde hebben** (release-varianten, tour-datums, interviews).

## 3. Duplicaat- / varianten-patronen
Duidelijke clustering rond een handvol artiesten:

| Artiest | Aantal /singles/ pagina's |
|---|---|
| AC/DC | 106 |
| Metallica | 55 |
| Coldplay | 27 |
| Queen | 23 |
| Adele | 20 |
| Ed Sheeran | 18 |
| Taylor Swift | 17 |
| Michael Jackson | 16 |
| Pink Floyd | 15 |
| André Hazes | 15 |
| Art Tatum | 15 |

- **60 artiesten hebben > 5 singles-pagina's, samen goed voor 739 URLs (~42% van alle /singles/).**
- Binnen die clusters staan opvallend veel "geen-echte-single" items — herkomst is duidelijk Discogs release-listings, niet redactionele songverhalen:
  - Metallica live-shows: `metallica-m72-atlanta-ga-june-3-2025`, `metallica-charlotte-north-carolina-may-31-2025`, `metallica-helsinki-finland-june-7-2024`, `metallica-m72-toronto-ontario-april-24-2025` én `-april-26-2025`, enz. → per stad/datum een eigen pagina met bijna identiek verhaal.
  - AC/DC release-varianten: `ac-dc-bbc-rock-hour-446-version-b`, `ac-dc-coffret-3-disques`, `ac-dc-box-set`, `ac-dc-12-of-the-best`, `ac-dc-a-gold-record-presentation`, `ac-dc-interview`, `ac-dc-alles-oder-light`, plus dubbele releases van dezelfde song (`ac-dc-thunderstruck` × 2, `ac-dc-highway-to-hell` × 2).
- Exacte artist+single_name duplicaten: ~20 paren (Thunderstruck, Highway To Hell, Master Of Puppets, Wish You Were Here, Yellow, Here Comes The Sun, Shallow, Beggin', …). Klein in absolute aantallen, maar 100% duplicaat-signaal.
- Slug-patronen die live/tour/variant-content aanduiden (`-m72-`, `-worldwired-`, `-tour-`, `-live-in-`, `-concert-`): **23 rijen**.
- Titel-woordenlijst (`interview|bbc|box set|coffret|greatest hits|in concert|live|tour|m72|version|special|inédit|promo|edit|remix|acoustic|demo|sampler|compilation|anthology|collection|fan can`): **88 rijen**.

## 4. Sitemaps
Ja, alle 1.780 URLs staan momenteel in:
- `sitemap-singles.xml` (loc's)
- `sitemap-images-singles.xml` (met `artwork_url`)
- Overzicht `/singles` in `sitemap-static.xml`, priority 0.8, `changefreq=daily`.

De sitemap-generator kent geen enkele filter op single-type/kwaliteit — alles wat `is_published AND single_name IS NOT NULL` is, gaat mee.

---

## Opties (nog niet uitvoeren)

### Optie A — Chirurgisch: variant/live/duplicaat op noindex + uit sitemap
Wat: filter in `useSEO` (NewsPost-achtige aanpak) + in `generate-static-sitemaps`:
- slug/single_name matcht live/tour/variant regex (`m72|worldwired|tour|live in|in concert|bbc rock hour|box set|coffret|interview|fan can|greatest hits|compilation|anthology|version|special|promo|sampler`)
- én exacte `(artist, single_name)` duplicaten: houd de langste/oudste, rest op noindex.

Impact: **~100-130 URLs** op noindex, rest blijft indexeerbaar.
Risico: laag. Raakt alleen zichtbare rommel. Lost het volume-probleem maar deels op — de "grote bron" in GSC is waarschijnlijk breder dan alleen deze 100.

### Optie B — Structureel: alleen "sterke" singles indexeerbaar, rest canonicaliseren naar artiest-pagina
Wat:
- Definieer "sterk" = single_name zonder variant-keywords, unieke `(artist, single_name)`-combinatie, en minimaal een drempel qua unieke inhoud (bv. views > 0 óf artiest heeft `artist_stories` pagina → dan is de artiest-URL een echte alternatief).
- "Zwak" (alle rest, geschat **300-500 URLs** — vooral de 739 in de grote clusters minus de canonieke hits per artiest) krijgt `<link rel="canonical">` naar `/artists/<slug>` als die bestaat, anders noindex.
- Sitemap bevat alleen "sterke" singles.

Impact: ~300-500 URLs verdwijnen effectief uit de index, ~1.300-1.500 blijven over.
Risico: middel. Canonical naar een niet-identieke pagina is een hint, niet gegarandeerd. Vereist dat `artist_stories` bestaat voor die artiest (op te lossen via join, geen technische blocker).

### Optie C — Bron aanpakken: cluster per artiest tot 1 "singles van X"-pagina
Wat: vervang losse /singles/-pagina's van grote artiesten door één overzicht `/artists/<slug>/singles` (of sectie op de bestaande artiest-pagina) met alle single_name's als lijst. Individuele /singles/ URLs blijven als "detail" bestaan maar krijgen noindex tenzij ze een unieke chart-hit zijn (bv. staat in `top2000_songs` of heeft eigen wiki-vermelding).
Impact: ruimste opschoning — potentieel **~1.000+ URLs** de-indexed, ~500-700 sterke hits blijven.
Risico: hoog-middel. Meest werk (nieuwe route + UI), en je verliest long-tail zoekverkeer op onbekende titels waar je nu misschien wel op scoort. Wel het meest overtuigende signaal richting Google dat /singles/ kwaliteit heeft.

---

## Advies voor keuze
Ik zou beginnen met **A** deze week (snel, laag risico, wint ~130 URLs terug) en daarna meten in GSC. Als "crawled – not indexed" op /singles/ maar beperkt daalt, doorschakelen naar **B**. **C** alleen als A+B onvoldoende blijken, want het is een structurele UX-ingreep.

Zeg welke optie (of combinatie) je wilt, dan werk ik die uit als concreet plan.
