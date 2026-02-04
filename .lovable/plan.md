
# Fix Plan: Catalogusnummer Validatie & IFPI Extractie

## Probleem Samenvatting

1. **Foutief catalogusnummer**: OCR leest "SGL 034-02" van CD-disc en labelt dit als catalog number, terwijl catalog numbers op de **back cover/inlay** staan
2. **Geen format validatie**: Elke string wordt geaccepteerd als catalog number
3. **IFPI niet meegenomen**: IFPI codes worden wel gezocht maar niet betrouwbaar geëxtraheerd

---

## Oplossing: 3-Staps Aanpassing

### Stap 1: Verbeter PASS 1 Prompt (Locatie-specifieke instructies)

**Bestand**: `supabase/functions/analyze-cd-images/index.ts`

Pas de prompt aan met expliciete locatie-instructies:

```
CATALOG NUMBER RULES (KRITISCH):
- Catalog numbers staan ALLEEN op BACK COVER of INLAY CARD
- Catalog numbers staan NOOIT op de CD disc zelf!
- Format voorbeelden: "CDP 7 46208 2", "826 732-2", "MOVLP123"
- Als je geen back cover ziet, return catalog_number: null

CD DISC BEVAT ALLEEN:
- Matrix/mastering codes
- IFPI codes
- Label naam (soms)
- Productie-info
```

### Stap 2: Catalog Number Validatie Toevoegen

**Bestand**: `supabase/functions/analyze-cd-images/index.ts`

Voeg een validatiefunctie toe die checkt:
- Lengte (typisch 5-15 karakters)
- Format patroon (combinatie letters/cijfers/spaties/koppeltekens)
- GEEN matrix-achtige patronen (geen IFPI, geen lange numerieke strings)

```typescript
function validateCatalogNumber(catno: string | null): string | null {
  if (!catno) return null;
  
  // Reject matrix-like patterns
  if (/^[A-Z]{2,4}\d{6,}/.test(catno)) return null;  // CPG1996002...
  if (/IFPI/i.test(catno)) return null;
  if (catno.length > 20) return null;
  
  // Accept valid catalog patterns
  if (/^[A-Z0-9][\w\s\-\.]+$/i.test(catno)) return catno;
  
  return null;
}
```

### Stap 3: Prioriteit Omdraaien + Dual Validation

**Bestand**: `supabase/functions/analyze-cd-images/index.ts` (regel 534)

Wijzig de logica zodat:
1. Discogs catalog number prioriteit heeft (betrouwbaarder)
2. OCR catalog alleen gebruikt wordt als validatie
3. Bij conflict: Discogs wint + warning in notes

```typescript
// NIEUW: Discogs heeft prioriteit, OCR valideert
const finalCatalog = discogsData?.catalog_number 
  || validateCatalogNumber(ocrResult.catalog_number) 
  || null;
```

### Stap 4: IFPI Extractie Versterken

**Bestand**: `supabase/functions/analyze-cd-images/index.ts`

Voeg regex fallback toe na PASS 1:

```typescript
function extractIfpiFromOcrNotes(notes: string): { mastering: string | null, mould: string | null } {
  const masteringMatch = notes.match(/IFPI\s*L[A-Z]?\d{2,4}/gi);
  const mouldMatch = notes.match(/IFPI\s*[A-Z0-9]{4}(?!\d)/gi);
  
  return {
    mastering: masteringMatch?.[0]?.toUpperCase() || null,
    mould: mouldMatch?.find(m => !m.match(/IFPI\s*L/i))?.toUpperCase() || null
  };
}
```

---

## Technisch Overzicht

| Wijziging | Bestand | Regels |
|-----------|---------|--------|
| Locatie-instructies in prompt | `analyze-cd-images/index.ts` | 44-50 |
| `validateCatalogNumber()` functie | `analyze-cd-images/index.ts` | nieuw |
| Prioriteit omdraaien | `analyze-cd-images/index.ts` | 534 |
| IFPI regex fallback | `analyze-cd-images/index.ts` | nieuw |
| Edge function deploy | - | - |

---

## Verwacht Resultaat

Na implementatie:
- "SGL 034-02" wordt **niet** als catalog number geaccepteerd (matrix-patroon)
- Discogs catalog number heeft prioriteit
- IFPI codes worden via regex fallback alsnog gevonden
- Dual validation geeft feedback in `ocr_notes`
