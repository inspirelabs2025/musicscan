
# Plan: Matrix → Discogs Lookup voor CD Matrix Enhancer

## ✅ GEÏMPLEMENTEERD

### Stap 1: Nieuwe Edge Function `matrix-discogs-lookup` ✅
**Bestand**: `supabase/functions/matrix-discogs-lookup/index.ts`

- Matrix-first zoekstrategie op Discogs
- IFPI codes als extra validatie
- Match scoring systeem met redenen
- Retourneert catalog number, artist, title, cover, etc.

### Stap 2: UI Uitbreiding in CDMatrixEnhancer ✅
**Bestand**: `src/pages/CDMatrixEnhancer.tsx`

- Nieuwe state: `discogsResult`, `isLookingUp`
- Auto-trigger na OCR success via `runDiscogsLookup()`
- Geïntegreerd in workflow

### Stap 3: Nieuw UI Component `MatrixDiscogsResult` ✅
**Bestand**: `src/components/matrix-enhancer/MatrixDiscogsResult.tsx`

- Cover image display
- Prominent catalog number
- Match confidence indicator
- Link naar Discogs
- Fallback candidates bij lage confidence

---

## Workflow

```text
Upload → Enhance → Review → OCR → [AUTO] Discogs Lookup → Complete
```

## Test

1. Ga naar `/cd-matrix-enhancer`
2. Upload een CD matrix foto
3. Na OCR zie je automatisch de Discogs lookup resultaten
4. Catalog number wordt prominent getoond
