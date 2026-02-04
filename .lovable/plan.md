
# Plan: Strikte Barcode/Catno Verificatie met OCR Behoud

## Kernprobleem Bewezen

De database query bewijst:

| Wat | Waarde |
|-----|--------|
| OCR catalogusnummer | `SUMCD 4164` ✅ |
| Opgeslagen catalogusnummer | `PYCD 130` ❌ |
| OCR barcode | `5 027626 416423` ✅ |
| Discogs release | `2453993` (Penny versie) |

**Oorzaak**: De code overschrijft correcte OCR data met verkeerde Discogs metadata zonder verificatie.

## Oplossing Architectuur

```text
┌─────────────────────────────────────────┐
│  OCR EXTRACTIE                          │
│  barcode: 5027626416423                 │
│  catno: SUMCD 4164                      │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  DISCOGS SEARCH                         │
│  "Ella Fitzgerald Portrait" + CD        │
│  → 50 kandidaten                        │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  STRIKTE VERIFICATIE (NIEUW)            │
│                                         │
│  Voor elke kandidaat (max 10):          │
│  1. Haal release details op             │
│  2. Check: release.barcode === OCR?     │
│     OF: release.catno === OCR?          │
│                                         │
│  ✅ EXACT MATCH → Gebruik release       │
│  ❌ GEEN MATCH → NO_EXACT_MATCH         │
│                                         │
│  BELANGRIJK: Behoud OCR data!           │
│  NOOIT Discogs catno overschrijven      │
└─────────────────────────────────────────┘
```

## Technische Wijzigingen

### Bestand 1: `supabase/functions/ai-photo-analysis-v2/index.ts`

**Wijziging A - Barcode Verificatie Versterken (rond regel 1388-1433)**

De huidige barcode check loopt door top 10 resultaten maar vergelijkt alleen de barcode van de release details. Het probleem is dat de release gevonden wordt via artist+title maar de barcode komt niet overeen.

Toevoegen na de huidige barcode loop:
```typescript
// Als geen barcode match EN barcode was gescand → direct NO_EXACT_MATCH
if (analysisData.barcode && !bestMatch) {
  console.log(`❌ Gescande barcode ${analysisData.barcode} niet gevonden in top 10 kandidaten`);
  // Stop hier - ga NIET door naar catno matching want barcode is primair
}
```

**Wijziging B - Database Update: Behoud OCR Data (rond regel 342-368)**

HUIDIGE code overschrijft OCR met Discogs:
```typescript
catalog_number: discogsResult.catalogNumber ?? combinedData.catalogNumber ?? null,
```

NIEUWE code behoudt OCR als verificatie faalt:
```typescript
// Bij EXACT_MATCH: gebruik Discogs data (geverifieerd)
// Bij NO_EXACT_MATCH: behoud OCR data ALTIJD
catalog_number: discogsResult.status === 'EXACT_MATCH' 
  ? (discogsResult.catalogNumber ?? combinedData.catalogNumber) 
  : combinedData.catalogNumber,
```

**Wijziging C - Return Object Uitbreiden**

Toevoegen aan NO_EXACT_MATCH return (rond regel 1618-1632):
```typescript
return {
  status: 'NO_EXACT_MATCH',
  // ...bestaande velden...
  
  // NIEUW: Behoud originele OCR data expliciet
  ocrData: {
    barcode: analysisData.barcode,
    catalogNumber: analysisData.catalogNumber,
    artist: analysisData.artist,
    title: analysisData.title
  },
  verificationFailed: {
    scannedBarcode: analysisData.barcode,
    scannedCatno: analysisData.catalogNumber,
    candidatesWithBarcodes: checkedBarcodes, // array van gevonden barcodes
    mismatchReason: 'Geen kandidaat met exacte barcode of catalogusnummer'
  }
};
```

### Bestand 2: `src/pages/AIScanV2.tsx`

**UI Verbetering voor NO_EXACT_MATCH**

Toon duidelijk de OCR data en waarom geen match:
```typescript
{analysisResult?.status === 'NO_EXACT_MATCH' && (
  <Alert variant="warning">
    <AlertTitle>Geen Exacte Match in Discogs</AlertTitle>
    <AlertDescription>
      <p>Gescande gegevens (correct):</p>
      <ul>
        <li>Barcode: {analysisResult.ocrData?.barcode}</li>
        <li>Catalogus: {analysisResult.ocrData?.catalogNumber}</li>
      </ul>
      <p className="mt-2 text-sm">
        Deze release staat niet in Discogs of heeft andere barcodes geregistreerd.
      </p>
    </AlertDescription>
  </Alert>
)}
```

## Verwacht Gedrag Na Fix

### Scenario: Ella Fitzgerald CD (SUMCD 4164)

| Stap | Actie | Resultaat |
|------|-------|-----------|
| 1 | OCR extraheert | barcode: `5027626416423`, catno: `SUMCD 4164` |
| 2 | Discogs search | 50 kandidaten voor "Ella Fitzgerald Portrait" + CD |
| 3 | Barcode check top 10 | Geen match (Summit release niet in Discogs) |
| 4 | Return | `status: 'NO_EXACT_MATCH'` |
| 5 | Database opslaan | `catalog_number: 'SUMCD 4164'` (OCR behouden!) |
| 6 | UI toont | "Geen exacte match - OCR gegevens: SUMCD 4164" |

**Cruciaal verschil**: Het gescande catalogusnummer `SUMCD 4164` blijft behouden in de database, niet overschreven met `PYCD 130`.

## Samenvatting Wijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `ai-photo-analysis-v2/index.ts` | Strikte barcode verificatie, OCR data behoud, uitgebreide NO_EXACT_MATCH response |
| `AIScanV2.tsx` | UI voor OCR data weergave bij geen match |

## Kernregel

**"Bij geen exacte barcode/catno match: retourneer NO_EXACT_MATCH en behoud ALTIJD de originele OCR gegevens. Discogs metadata mag OCR nooit overschrijven zonder verificatie."**
