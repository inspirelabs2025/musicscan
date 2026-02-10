
## Discogs Release Verificatie & Data Enrichment

### Probleem
Na het scannen van foto's krijgen we een Discogs Release ID, maar we verifi_ren niet of die match klopt door de daadwerkelijke release-pagina te controleren. We slaan ook niet alle beschikbare data op.

### Oplossing: Twee-staps verificatie funnel

```text
STAP 1: Foto Scan (bestaand)
  Foto's --> AI Extractie --> Discogs Search API --> Release ID kandidaat
                                                          |
                                                          v
STAP 2: Release Page Verificatie (NIEUW)
  Discogs /releases/{id} API --> Gestructureerde data ophalen
    - Matrix varianten vergelijken met OCR extractie
    - Barcode lijst vergelijken
    - Catalog number bevestigen
    - Alle metadata opslaan voor toekomstige lookups
                                                          |
                                                          v
  Bevestigd? --> Enriched data opslaan in releases tabel
  Niet bevestigd? --> Status "needs_review", volgende kandidaat proberen
```

### Wat wordt gebouwd

**1. Nieuwe edge function: `verify-and-enrich-release`**

Wordt aangeroepen na een succesvolle match in de scan pipeline. Doet het volgende:
- Haalt de volledige release op via Discogs API (`/releases/{id}`)
- Extraheert alle gestructureerde data: tracklist, credits, companies, matrix varianten, barcodes, labels, formats
- **Verificatie**: vergelijkt de gescande identifiers (matrix, barcode, catno) met de data op de release-pagina
- Bij bevestiging: slaat enriched data op en koppelt de scan
- Bij mismatch: markeert als "needs_review"

**2. Database uitbreiding: `release_enrichments` tabel**

Nieuwe tabel voor alle Discogs-data die niet in de huidige `releases` tabel past:
- `release_id` (FK naar releases)
- `discogs_id` (integer)
- `tracklist` (jsonb) - volledige tracklist met duur
- `credits` (jsonb) - alle credits/rollen
- `companies` (jsonb) - pressed by, manufactured by, etc.
- `matrix_variants` (jsonb) - alle bekende matrix varianten
- `barcodes` (text[]) - alle bekende barcodes
- `identifiers` (jsonb) - IFPI, rights society, label code, etc.
- `notes` (text) - Discogs release notes
- `community_have` (integer), `community_want` (integer)
- `community_rating` (numeric)
- `pricing_lowest` (numeric), `pricing_median` (numeric), `pricing_highest` (numeric)
- `enriched_at` (timestamptz)

**3. Integratie in bestaande pipelines**

Beide pipelines (`ai-photo-analysis-v2` en `cd-scan-pipeline`) worden uitgebreid:
- Na een succesvolle match (status `verified`, `locked`, of `single_match`) wordt automatisch `verify-and-enrich-release` aangeroepen
- De enrichment data wordt ook gebruikt om de `releases` tabel bij te werken met ontbrekende velden (artwork_url, genre, style, master_id)

**4. Eigen database als eerste lookup**

Voor de Discogs API wordt aangeroepen, checkt het systeem eerst:
- `releases` tabel op bekende barcodes/catno's via `release_enrichments.barcodes` en `release_enrichments.matrix_variants`
- Bij een hit in onze eigen database: directe match zonder API call, met alle enriched data al beschikbaar
- Dit bespaart API calls en versnelt herhaalde scans van dezelfde releases

### Technisch detail

**Verificatie logica in `verify-and-enrich-release`:**

```text
1. Fetch /releases/{discogs_id} van Discogs API
2. Extract: identifiers[], companies[], tracklist[], extraartists[]
3. Vergelijk:
   a. Barcode uit scan IN release.identifiers[type=Barcode]? --> +bevestiging
   b. Catno uit scan IN release.labels[].catno? --> +bevestiging  
   c. Matrix uit scan SUBSET VAN release.identifiers[type=Matrix]? --> +bevestiging
4. Score: 2+ bevestigingen = "verified", 1 = "likely", 0 = "needs_review"
5. Sla ALLE data op in release_enrichments
6. Update releases tabel met ontbrekende velden
```

**Eigen database lookup (pre-Discogs):**

```text
1. Barcode zoeken in release_enrichments.barcodes (array contains)
2. Catno zoeken in releases.catalog_number (exact match)
3. Matrix tokens zoeken in release_enrichments.matrix_variants (jsonb contains)
4. Bij match: skip Discogs API, gebruik opgeslagen data
```

### Stappen

1. Database migratie: `release_enrichments` tabel aanmaken met indexen
2. Edge function `verify-and-enrich-release` bouwen
3. `cd-scan-pipeline` uitbreiden met verificatie-aanroep na match
4. `ai-photo-analysis-v2` uitbreiden met verificatie-aanroep na match
5. Eigen database lookup toevoegen als eerste stap in beide pipelines (voor Discogs API)
