
# Plan: Barcode-First Discogs Match Strategie

## Probleem Analyse

De huidige `searchDiscogsV2` functie in `ai-photo-analysis-v2` heeft de verkeerde prioriteitsvolgorde:
- **Nu**: Artist+Title eerst → kan OCR-fouten propageren ("Exas" ipv "Texas")
- **Gewenst**: Barcode eerst → uniek per pressing, geen OCR-ambiguïteit

### Bewezen Route naar Correcte Release
```
Scan → Barcode: 5027626416423
     → Discogs Search → Release ID: 4381440
     → Matrix verificatie: SUMCD 4164 01 ✓
     → Resultaat: Ella Fitzgerald - Portrait (Summit, UK, 1998)
```

## Oplossing: Nieuwe Zoekprioriteit

### Stap 1: Herordening Zoekstrategieën

```
NIEUWE VOLGORDE:
1. Barcode + format=CD         ← PRIMAIR (100% uniek)
2. Matrix nummer               ← DOORSLAGGEVEND (pressing-specifiek)
3. Catalog number + format     ← VALIDATIE
4. Label + Catno + format      ← COMBINATIE
5. Artist + Title + format     ← FALLBACK (laagste prioriteit)
6. General fallback            ← Zonder format filter
```

### Stap 2: Confidence Scoring Aanpassen

| Signaal | Huidige Score | Nieuwe Score |
|---------|---------------|--------------|
| Barcode exact match | +0.20 | **+0.50** (primair) |
| Matrix exact match | +0.25 | **+0.40** (doorslaggevend) |
| Catno exact match | - | **+0.25** |
| Label exact match | - | **+0.15** |
| Year exact match | - | **+0.10** |
| Country exact match | - | **+0.10** |
| Title fuzzy match | hoog | **+0.05** (laag) |

### Stap 3: Multi-Signal Verificatie

Na een barcode-match, valideren met secundaire signalen:
```typescript
// Voorbeeld: Release 4381440 gevonden via barcode
const verification = {
  barcode: '5027626416423' === discogsRelease.barcode,      // ✓
  matrix: 'SUMCD 4164 01'.includes(discogsRelease.matrix),  // ✓
  catno: 'SUMCD 4164' === discogsRelease.catno,             // ✓
  label: 'Summit' === discogsRelease.label,                  // ✓
  year: 1998 === discogsRelease.year,                        // ✓
  country: 'UK' === discogsRelease.country                   // ✓
};
// Score: 150/150 → Automatisch accepteren
```

### Stap 4: Early Exit Logic

```typescript
// Stop zoeken zodra barcode exact match + matrix verificatie
if (barcodeExactMatch && matrixVerified) {
  console.log('🎯 Barcode + Matrix verified match - 100% confidence');
  return bestMatch; // Geen verdere zoekstrategieën nodig
}
```

## Technische Wijzigingen

### File: `supabase/functions/ai-photo-analysis-v2/index.ts`

**Wijziging 1**: Zoekstrategie volgorde aanpassen (regel ~1179-1221)

```typescript
const searchStrategies = [
  // NIEUW: Strategy 1 - Barcode (PRIMAIR - uniek per pressing)
  ...(analysisData.barcode ? [{
    query: analysisData.barcode,
    type: 'barcode',
    format: formatFilter,
    priority: 'primary'
  }] : []),
  
  // Strategy 2 - Matrix (DOORSLAGGEVEND)
  ...(analysisData.matrixNumber ? [{ 
    query: analysisData.matrixNumber, 
    type: 'matrix', 
    format: null,
    priority: 'critical'
  }] : []),
  
  // Strategy 3 - Catalog number
  ...(analysisData.catalogNumber ? [{
    query: analysisData.catalogNumber,
    type: 'catno',
    format: formatFilter,
    priority: 'high'
  }] : []),
  
  // Strategy 4 - Label + Catno
  ...(analysisData.label && analysisData.catalogNumber ? [{
    query: `${analysisData.label} ${analysisData.catalogNumber}`,
    type: 'label_catno',
    format: formatFilter,
    priority: 'medium'
  }] : []),
  
  // Strategy 5 - Artist + Title (FALLBACK - laagste prioriteit)
  ...(analysisData.artist && analysisData.title ? [{
    query: `${analysisData.artist} ${analysisData.title}`,
    type: 'artist_title_format',
    format: formatFilter,
    priority: 'low'
  }] : []),
  
  // Strategy 6 - General fallback
  ...(analysisData.artist && analysisData.title ? [{
    query: `${analysisData.artist} ${analysisData.title}`,
    type: 'general_fallback',
    format: null,
    priority: 'fallback'
  }] : [])
];
```

**Wijziging 2**: Verbeterde confidence scoring (regel ~1346-1361)

```typescript
// Nieuwe confidence berekening gebaseerd op gebruiker's schema
let confidence = 0;
let totalPossibleScore = 150;

// Primary signals (highest weight)
if (searchMetadata.technicalMatches.barcode) {
  confidence += 50;  // Was: 0.2 → Nu: 50/150
  console.log('📈 Barcode match: +50 points');
}

if (matrixMatch) {
  confidence += 40;  // Was: 0.25 → Nu: 40/150
  console.log('📈 Matrix match: +40 points');
}

// Validation signals
if (catnoMatch) {
  confidence += 25;
  console.log('📈 Catalog number match: +25 points');
}

if (labelMatch) {
  confidence += 15;
  console.log('📈 Label match: +15 points');
}

if (yearMatch) {
  confidence += 10;
  console.log('📈 Year match: +10 points');
}

if (countryMatch) {
  confidence += 10;
  console.log('📈 Country match: +10 points');
}

// Normalize to 0-1 scale
const normalizedConfidence = confidence / totalPossibleScore;
```

**Wijziging 3**: Early exit bij barcode + matrix match

```typescript
// Aggressive early exit for verified matches
if (searchMetadata.technicalMatches.barcode && matrixMatch) {
  console.log('🎯 VERIFIED MATCH: Barcode + Matrix confirmed');
  console.log(`   Release: ${bestMatch.title} (ID: ${bestMatch.id})`);
  searchMetadata.verificationLevel = 'LOCKED';
  break; // Stop alle verdere zoekstrategieën
}
```

## Resultaat na Implementatie

Voor de Ella Fitzgerald scan:
```
INPUT:
- Barcode: 5027626416423
- Matrix: SUMCD 4164 01
- Catno: SUMCD 4164
- Label: Summit

VERWACHTE OUTPUT:
- Discogs ID: 4381440
- Artist: Ella Fitzgerald
- Title: Portrait
- Label: Summit
- Year: 1998
- Country: UK
- Confidence: 150/150 (100%)
- Verification: LOCKED (Barcode + Matrix)
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Barcode niet in Discogs | Fallback naar Matrix → Catno → Title |
| OCR fout in barcode | Matrix als backup verificatie |
| Meerdere pressings met zelfde barcode | Matrix disambiguatie |
| Geen match gevonden | "Release niet gevonden" met handmatige invoer optie |
