
# Fix: Pricing Extraction - Alleen Statistics Sectie

## Probleem

De huidige pricing scrapers pakken prijzen van de **hele Discogs pagina** — inclusief marketplace listings, shipping kosten, en andere €-bedragen. Dit levert opgeblazen/incorrecte prijzen op.

Voorbeeld Blondie - Blondies Hits (release 5171206):
- Discogs Statistics: Low €2.00 / Median €3.99 / High €6.39
- MusicScan resultaat: €3.50 / €4.69 / €7.52 (fout - bevat marketplace listings)

## Oplossing

Alle drie de pricing-functies aanpassen zodat ze **uitsluitend** de Statistics-sectie lezen. De Statistics-sectie bevat historische verkoopprijzen en is de meest betrouwbare bron.

## Wijzigingen

### 1. `ai-photo-analysis-v2/index.ts` (scan-time pricing)

**Verwijderen:**
- JSON-LD offers parsing (dit zijn marketplace-prijzen, niet statistics)
- "Last resort" fallback die willekeurige €-bedragen pakt
- Brede patronen zoals `class="price"`, `data-price`, `from €X`

**Behouden/verbeteren:**
- Alleen Statistics-sectie patronen: `Low:` / `Median:` / `High:` en `Lowest:` / `Median:` / `Highest:`
- Eerst de Statistics-sectie isoleren uit de HTML (zoek het blok rond "Statistics" heading), dan pas regexen toepassen
- Fallback naar Discogs API `lowest_price` (dit is wel betrouwbaar)

### 2. `collect-price-history/index.ts` (dagelijkse cron)

**Volledig vervangen:** `parsePriceDataFromHTML()` functie die nu alle €/$-bedragen op de pagina pakt met:
- Gerichte Statistics-sectie extractie (dezelfde patronen als punt 1)
- Geen brede currency-regex meer

### 3. `test-catalog-search/index.ts` (catalog search pricing)

Deze heeft al betere patronen (Lowest/Low labels) maar mist de Statistics-sectie isolatie. Toevoegen:
- HTML-sectie isolatie voor de Statistics-blok voordat patronen worden toegepast

### 4. Gedeelde helper functie

Nieuwe gedeelde functie `extractStatisticsPricing(html)` die:
1. De Statistics-sectie isoleert uit de HTML (zoek naar "Statistics" heading en pak het omringende blok)
2. Binnen dat blok zoekt naar Low/Lowest, Median, High/Highest labels
3. Alleen prijzen uit dat blok returnt
4. Als de sectie niet gevonden wordt: return null (geen fallback naar willekeurige pagina-prijzen)

## Technisch Detail

```text
Nieuwe extractie-logica:

1. Isoleer Statistics sectie
   HTML -> zoek "Statistics" heading -> pak 500 chars erna

2. Parse alleen binnen die sectie:
   /Low(?:est)?:\s*[€$£]?\s*([\d.,]+)/i
   /Median:\s*[€$£]?\s*([\d.,]+)/i
   /High(?:est)?:\s*[€$£]?\s*([\d.,]+)/i

3. Als Statistics sectie niet gevonden:
   -> return null (NIET terugvallen op brede regex)
   -> Discogs API lowest_price als enige fallback
```

## Volgorde van implementatie

1. Maak gedeelde helper `extractStatisticsPricing()` aan
2. Update `ai-photo-analysis-v2` - verwijder JSON-LD en brede fallbacks, gebruik helper
3. Update `collect-price-history` - vervang `parsePriceDataFromHTML()` door helper
4. Update `test-catalog-search` - voeg sectie-isolatie toe via helper
5. Deploy alle drie de functies
6. Test met Blondie release 5171206 (verwacht: €2.00 / €3.99 / €6.39)
