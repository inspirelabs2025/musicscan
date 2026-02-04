

# Plan: Strikt 100% Matching Systeem (Geen Fallbacks)

## Kernprobleem

Het huidige systeem gebruikt "beste gok" fallback logica:
- Als geen exacte catno match → pak eerste zoekresultaat
- Als geen Discogs match → retourneer OCR data alsof het correct is
- Barcodes worden niet strikt geverifieerd

Dit resulteert in verkeerde releases zoals de Penny-versie (PYCD 130) terwijl je de Summit-versie (SUMCD 4164) scant.

## Nieuwe Filosofie

```text
┌─────────────────────────────────────────┐
│  SCAN INVOER                            │
│  - Artist: Ella Fitzgerald              │
│  - Title: A Portrait of Ella Fitzgerald │
│  - Catalog: SUMCD 4164                  │
│  - Barcode: 5027626416423               │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  STAP 1: ZOEK                           │
│  Artist + Title + Format=CD             │
│  → 50 resultaten                        │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  STAP 2: EXACTE MATCH VEREIST           │
│  Binnen resultaten zoeken naar:         │
│  - EXACT barcode: 5027626416423    OF   │
│  - EXACT catno: SUMCD 4164              │
│                                         │
│  ✅ Match gevonden → Release ID         │
│  ❌ Geen match → NO_EXACT_MATCH         │
└─────────────────────────────────────────┘
```

## Technische Wijzigingen

### 1. searchDiscogsV2 Herschrijven - Verwijder Alle Fallbacks

**Verwijderen (regels 1402-1418):**
```typescript
// VERWIJDEREN - Geen fallback naar eerste resultaat
if (!bestMatch) {
  bestMatch = data.results[0]; // ← WEG
  highestConfidence = 0.7;     // ← WEG
}
```

**Nieuwe logica:**
```typescript
// NIEUW - Alleen exacte match of niets
if (!catnoMatch && !barcodeMatch) {
  console.log('❌ NO_EXACT_MATCH: Geen exacte barcode/catno gevonden');
  return {
    status: 'NO_EXACT_MATCH',
    discogsId: null,
    reason: 'Geen release met exacte barcode of catalogusnummer gevonden',
    searchedBarcode: analysisData.barcode,
    searchedCatno: analysisData.catalogNumber,
    candidatesChecked: data.results.length
  };
}
```

### 2. Barcode Verificatie Toevoegen in Primaire Search

Momenteel wordt barcode alleen in fallback gecontroleerd. Dit moet in de primaire search:

```typescript
// Na Artist+Title+Format search
if (data.results && data.results.length > 0) {
  
  // PRIORITEIT 1: Exacte barcode match
  if (analysisData.barcode) {
    const extractedBarcode = analysisData.barcode.replace(/[^0-9]/g, '');
    
    for (const result of data.results.slice(0, 10)) {
      const releaseDetails = await fetchReleaseDetails(result.id);
      const barcodeMatch = releaseDetails?.identifiers?.find(id => 
        id.type === 'Barcode' && 
        id.value?.replace(/[^0-9]/g, '') === extractedBarcode
      );
      
      if (barcodeMatch) {
        console.log(`✅ EXACT BARCODE MATCH: ${result.id}`);
        return { status: 'EXACT_MATCH', ... };
      }
    }
  }
  
  // PRIORITEIT 2: Exacte catno match
  if (analysisData.catalogNumber) {
    const catnoMatch = data.results.find(r => 
      normalizedCatno(r.catno) === normalizedCatno(analysisData.catalogNumber)
    );
    
    if (catnoMatch) {
      console.log(`✅ EXACT CATNO MATCH: ${catnoMatch.id}`);
      return { status: 'EXACT_MATCH', ... };
    }
  }
  
  // GEEN FALLBACK - Expliciet geen match retourneren
  return { status: 'NO_EXACT_MATCH', ... };
}
```

### 3. Fallback Loop Verwijderen (regels 1426-1605)

De hele fallback sectie wordt vervangen door een directe barcode/catno lookup:

```typescript
// Als primaire search geen resultaten: directe identifier lookup
if (!bestMatch) {
  // Direct barcode search (zonder format filter - barcode is uniek)
  if (analysisData.barcode) {
    const barcodeResult = await searchByExactBarcode(analysisData.barcode);
    if (barcodeResult?.exactMatch) {
      return barcodeResult;
    }
  }
  
  // Direct catno + format search  
  if (analysisData.catalogNumber) {
    const catnoResult = await searchByExactCatno(
      analysisData.catalogNumber, 
      formatParam
    );
    if (catnoResult?.exactMatch) {
      return catnoResult;
    }
  }
  
  // GEEN verdere fallbacks
  return { status: 'NO_EXACT_MATCH', ... };
}
```

### 4. Return Type Uitbreiden

```typescript
interface DiscogsSearchResult {
  status: 'EXACT_MATCH' | 'NO_EXACT_MATCH' | 'ERROR';
  matchType?: 'barcode' | 'catno' | 'matrix';
  discogsId: number | null;
  discogsUrl: string | null;
  artist: string | null;
  title: string | null;
  // ... overige velden
  
  // Nieuwe velden voor debugging/UI
  searchedIdentifiers?: {
    barcode: string | null;
    catalogNumber: string | null;
    matrixNumber: string | null;
  };
  candidatesChecked?: number;
  reason?: string;
}
```

### 5. Frontend Aanpassen - NO_EXACT_MATCH Status

In `AIScanV2.tsx` moet de UI duidelijk tonen wanneer geen exacte match is gevonden:

```typescript
// Na Discogs search
if (discogsResult.status === 'NO_EXACT_MATCH') {
  // Toon duidelijke melding
  toast({
    title: "Geen exacte match gevonden",
    description: `Release met barcode ${discogsResult.searchedIdentifiers?.barcode} of catalogus ${discogsResult.searchedIdentifiers?.catalogNumber} niet in Discogs`,
    variant: "warning"
  });
  
  // Sla op met status 'no_match' in plaats van 'completed'
  await updateScanStatus(scanId, 'no_exact_match', discogsResult);
}
```

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/ai-photo-analysis-v2/index.ts` | searchDiscogsV2 herschrijven: verwijder fallbacks, alleen exacte matches |
| `src/pages/AIScanV2.tsx` | UI voor NO_EXACT_MATCH status |

## Verwacht Gedrag Na Implementatie

**Scenario: Ella Fitzgerald CD (SUMCD 4164)**

| Stap | Actie | Resultaat |
|------|-------|-----------|
| 1 | Zoek "Ella Fitzgerald A Portrait" + format=CD | 50 resultaten |
| 2 | Check barcode 5027626416423 in top 10 | ❌ Niet gevonden |
| 3 | Check catno SUMCD 4164 exact | ❌ Niet in Discogs |
| 4 | Retourneer | `status: 'NO_EXACT_MATCH'` |

**UI toont:** "Geen exacte match gevonden - deze release staat niet in Discogs"

Geen verkeerde releases meer. Alleen 100% zekerheid of eerlijk "niet gevonden".

