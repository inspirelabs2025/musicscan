
# Plan: Media-Specifieke Zoekstrategie

## Probleem

De huidige implementatie past dezelfde barcode-first strategie toe op zowel CD als Vinyl. Dit is incorrect:
- **CD's**: Vrijwel altijd een barcode (sinds jaren '80)
- **Vinyl**: Oudere platen hebben vaak géén barcode, matrix in runout groove is de primaire identifier

## Oplossing: Gescheiden Zoekprioriteiten

### CD Zoekstrategie (huidige - behouden)
```
1. Barcode + format=CD        ← PRIMAIR (100% uniek)
2. Matrix nummer              ← KRITISCH (pressing-specifiek)
3. Catalog number + format    ← HOOG
4. Label + Catno + format     ← MEDIUM
5. Artist + Title + format    ← LAAG/FALLBACK
```

### Vinyl Zoekstrategie (NIEUW)
```
1. Matrix nummer              ← PRIMAIR (altijd aanwezig in runout)
2. Catalog number + format    ← HOOG
3. Label + Catno + format     ← MEDIUM
4. Artist + Title + format    ← MEDIUM
5. Barcode + format=Vinyl     ← FALLBACK (alleen moderne vinyl)
```

## Technische Wijzigingen

### File: `supabase/functions/ai-photo-analysis-v2/index.ts`

**Wijziging 1**: Conditionele strategie-volgorde op basis van mediaType

```typescript
// Bepaal zoekstrategieën op basis van mediaType
const searchStrategies: Array<{ query: string; type: string; format?: string | null; priority: string }> = mediaType === 'cd' 
  ? [
      // CD: Barcode-first strategie
      ...(analysisData.barcode ? [{
        query: analysisData.barcode,
        type: 'barcode',
        format: formatFilter,
        priority: 'primary'
      }] : []),
      ...(analysisData.matrixNumber ? [{ 
        query: analysisData.matrixNumber, 
        type: 'matrix', 
        format: null,
        priority: 'critical'
      }] : []),
      // ... rest CD strategieën
    ]
  : [
      // VINYL: Matrix-first strategie
      ...(analysisData.matrixNumber ? [{ 
        query: analysisData.matrixNumber, 
        type: 'matrix', 
        format: null,
        priority: 'primary'  // Matrix is primair voor vinyl
      }] : []),
      ...(analysisData.catalogNumber ? [{
        query: analysisData.catalogNumber,
        type: 'catno',
        format: formatFilter,
        priority: 'high'
      }] : []),
      ...(analysisData.label && analysisData.catalogNumber ? [{
        query: `${analysisData.label} ${analysisData.catalogNumber}`,
        type: 'label_catno',
        format: formatFilter,
        priority: 'medium'
      }] : []),
      ...(analysisData.artist && analysisData.title ? [{
        query: `${analysisData.artist} ${analysisData.title}`,
        type: 'artist_title_format',
        format: formatFilter,
        priority: 'medium'
      }] : []),
      // Barcode als fallback voor moderne vinyl
      ...(analysisData.barcode ? [{
        query: analysisData.barcode,
        type: 'barcode',
        format: formatFilter,
        priority: 'fallback'  // Alleen modern vinyl heeft barcode
      }] : []),
    ];
```

**Wijziging 2**: Aangepaste confidence scoring per mediaType

```typescript
// Vinyl: Matrix heeft hoogste gewicht
if (mediaType === 'vinyl') {
  if (matrixMatch) confidence += 50;       // Was: 40 → Nu: 50 (primair)
  if (searchMetadata.technicalMatches.barcode) confidence += 20;  // Was: 50 → Nu: 20 (optioneel)
} else {
  // CD: Barcode heeft hoogste gewicht
  if (searchMetadata.technicalMatches.barcode) confidence += 50;
  if (matrixMatch) confidence += 40;
}
```

**Wijziging 3**: Aangepaste early exit logic

```typescript
// CD: Barcode + Matrix = LOCKED
if (mediaType === 'cd' && searchMetadata.technicalMatches.barcode && matrixMatch) {
  console.log('🎯 CD VERIFIED: Barcode + Matrix confirmed');
  searchMetadata.verificationLevel = 'LOCKED';
  break;
}

// Vinyl: Matrix + Catno = LOCKED (barcode niet vereist)
if (mediaType === 'vinyl' && matrixMatch && catnoMatch) {
  console.log('🎯 VINYL VERIFIED: Matrix + Catalog confirmed');
  searchMetadata.verificationLevel = 'LOCKED';
  break;
}
```

## Resultaat

| Media | Primaire Identifier | Verificatie Criteria |
|-------|---------------------|---------------------|
| CD | Barcode (100% uniek) | Barcode + Matrix = LOCKED |
| Vinyl | Matrix (runout groove) | Matrix + Catno = LOCKED |

## Logging Verbetering

```typescript
console.log(`🎵 Search strategy mode: ${mediaType === 'cd' ? 'BARCODE-FIRST' : 'MATRIX-FIRST'}`);
```
