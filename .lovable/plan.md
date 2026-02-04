
# Plan: Fix Matrix Enhancer Data Merge

## Probleem Analyse

De Matrix Enhancer vindt de correcte Discogs release maar deze data wordt genegeerd door de ai-photo-analysis-v2 edge function door twee bugs:

1. **Te hoge confidence drempel**: `matchConfidence > 0.7` blokkeert data met 0.6 confidence
2. **searchDiscogsV2 negeert enhancedDiscogsMatch**: De functie checkt nooit voor pre-gevonden Discogs data

## Oplossing

### Fix 1: Verlaag Confidence Threshold

In `ai-photo-analysis-v2/index.ts` lijn 284:

```typescript
// OUD: > 0.7 (te strikt)
if (enhancedMatrixData.discogsId && enhancedMatrixData.matchConfidence && enhancedMatrixData.matchConfidence > 0.7)

// NIEUW: >= 0.5 (realistischer)
if (enhancedMatrixData.discogsId && enhancedMatrixData.matchConfidence && enhancedMatrixData.matchConfidence >= 0.5)
```

### Fix 2: Gebruik enhancedDiscogsMatch in searchDiscogsV2

Begin van `searchDiscogsV2` functie moet checken voor pre-gevonden match:

```typescript
async function searchDiscogsV2(analysisData: any) {
  try {
    console.log('🔍 Searching Discogs V2 with matrix/IFPI verification...')
    
    // NIEUW: Check for pre-found enhanced Discogs match from Matrix Enhancer
    if (analysisData.enhancedDiscogsMatch?.discogsId) {
      const enhanced = analysisData.enhancedDiscogsMatch;
      console.log(`🎯 Using pre-found Discogs match from Matrix Enhancer: ${enhanced.discogsId} (confidence: ${enhanced.confidence})`);
      
      return {
        discogsId: enhanced.discogsId,
        discogsUrl: enhanced.discogsUrl || `https://www.discogs.com/release/${enhanced.discogsId}`,
        artist: enhanced.artist || analysisData.artist,
        title: enhanced.title || analysisData.title,
        label: enhanced.label || analysisData.label,
        catalogNumber: enhanced.catalogNumber || analysisData.catalogNumber,
        year: enhanced.year || analysisData.year,
        country: enhanced.country || analysisData.country,
        genre: enhanced.genre || analysisData.genre,
        confidence: enhanced.confidence || 0.8,
        matrixVerified: true,
        searchMetadata: {
          strategies: [],
          totalSearches: 0,
          bestStrategy: 'enhanced_matrix_lookup',
          matrixVerified: true,
          technicalMatches: { matrix: true }
        }
      };
    }
    
    // ... bestaande search logica ...
```

## Data Flow Na Fix

```text
Upload 4 foto's
     │
     ├─ Matrix Enhancer (parallel)
     │  └─ matrix-discogs-lookup
     │     └─ discogsId: 1755390 (confidence: 0.6)
     │
     ├─ ai-photo-analysis-v2
     │  ├─ enhancedMatrixData ontvangen ✅
     │  ├─ matchConfidence >= 0.5 ? JA ✅
     │  ├─ enhancedDiscogsMatch aangemaakt ✅
     │  └─ searchDiscogsV2()
     │     └─ "Using pre-found Discogs match: 1755390" ✅
     │
     └─ Final Result:
        discogs_id: 1755390 ✅ (Matrix Enhancer match)
        artist: "Various" ✅
        title: "Ready Steady Boogaloo!" ✅
```

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/ai-photo-analysis-v2/index.ts` | 1. Verlaag threshold van > 0.7 naar >= 0.5 |
| | 2. Voeg enhancedDiscogsMatch check toe aan begin searchDiscogsV2 |

## Fallback Gedrag

Als `enhancedDiscogsMatch` niet beschikbaar is (geen matrix foto, lage confidence, of matrix-discogs-lookup faalde), blijft de normale search flow werken zoals voorheen.

## Risico Analyse

- **Laag risico**: Fallback naar bestaande logica blijft intact
- **Voordeel**: Matrix Enhancer matches worden nu daadwerkelijk gebruikt
- **Edge case**: Bij conflict tussen matrix-match en hoes-OCR wint matrix (correct gedrag)
