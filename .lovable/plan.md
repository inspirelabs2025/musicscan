
# Plan: Matrix → Discogs Lookup voor CD Matrix Enhancer

## Huidige Situatie

| Component | Functie | Discogs? |
|-----------|---------|----------|
| `matrix-ocr` | OCR: afbeelding → tekst (matrix/IFPI) | ❌ Nee |
| `analyze-cd-images` | Multi-foto CD analyse | ✅ Ja, maar vereist 4 foto's |
| `CDMatrixEnhancer` | Upload → Enhance → OCR | ❌ Nee |

**Probleem**: Na OCR in de Matrix Enhancer heb je alleen ruwe tekst, geen catalogusnummer of metadata.

---

## Oplossing: Nieuwe Edge Function + UI Integratie

### Stap 1: Nieuwe Edge Function `matrix-discogs-lookup`

**Bestand**: `supabase/functions/matrix-discogs-lookup/index.ts`

Dedicated lookup functie die:
- Alleen matrix number als input accepteert (optioneel: IFPI codes)
- Zoekt op Discogs met matrix-first strategie
- Retourneert volledige metadata inclusief catalog number

```typescript
// Input
{
  matrixNumber: "CPG1996002 50610344 02",
  ifpiMastering: "IFPI L028",  // optioneel
  ifpiMould: "IFPI 94A1"       // optioneel
}

// Output
{
  success: true,
  discogs_id: 2610353,
  discogs_url: "https://www.discogs.com/release/2610353",
  artist: "Texas",
  title: "Greatest Hits",
  catalog_number: "538 194-2",  // <-- Dit willen we!
  label: "Mercury",
  year: 2000,
  country: "Europe",
  cover_image: "https://...",
  match_confidence: 0.85,
  match_reasons: ["matrix_primary", "ifpi_validated"]
}
```

### Stap 2: UI Uitbreiding in CDMatrixEnhancer

**Bestand**: `src/pages/CDMatrixEnhancer.tsx`

Na de OCR stap, automatisch Discogs lookup triggeren:

1. **Nieuwe state**: `discogsResult`, `isLookingUp`
2. **Na OCR success**: automatisch `matrix-discogs-lookup` aanroepen met gevonden matrix
3. **Nieuw component**: `MatrixDiscogsResult` - toont gevonden release info

Workflow wordt:
```text
Upload → Enhance → Review → OCR → [NEW] Discogs Lookup → Complete
```

### Stap 3: Nieuw UI Component `MatrixDiscogsResult`

**Bestand**: `src/components/matrix-enhancer/MatrixDiscogsResult.tsx`

Toont:
- Cover image
- Artist / Title
- **Catalog Number** (prominent)
- Label / Year / Country
- Match confidence indicator
- Link naar Discogs

---

## Technische Details

### Edge Function Logica (hergebruik van analyze-cd-images)

```typescript
// matrix-discogs-lookup/index.ts

async function searchByMatrix(matrixNumber: string): Promise<DiscogsResult> {
  // 1. Clean matrix for search
  const cleanMatrix = matrixNumber.replace(/[#*~]/g, '').trim();
  
  // 2. Search Discogs: /database/search?q={matrix}&type=release&format=CD
  const searchResults = await discogsSearch(cleanMatrix);
  
  // 3. For each result, fetch /releases/{id} for full details
  for (const result of searchResults.slice(0, 5)) {
    const release = await fetchRelease(result.id);
    
    // 4. Validate: does release.identifiers contain our matrix?
    const hasMatrixMatch = release.identifiers.some(id => 
      id.type === 'Matrix / Runout' && 
      id.value.includes(cleanMatrix.slice(0, 8))
    );
    
    if (hasMatrixMatch) {
      return {
        catalog_number: release.labels[0].catno,  // <-- HIER!
        artist: release.artists_sort,
        title: release.title,
        // ...rest
      };
    }
  }
}
```

### CDMatrixEnhancer Flow Aanpassing

```typescript
// Na OCR success (regel 182)
const handleRunOCR = async () => {
  // ... bestaande OCR logica ...
  
  // NEW: Auto-trigger Discogs lookup als matrix gevonden
  const matrixSegment = ocrResult.segments.find(s => s.type === 'matrix');
  if (matrixSegment?.text) {
    setIsLookingUp(true);
    const { data } = await supabase.functions.invoke('matrix-discogs-lookup', {
      body: { 
        matrixNumber: matrixSegment.text,
        ifpiMastering: ifpiSegments.find(s => s.text.includes('L'))?.text,
        ifpiMould: ifpiSegments.find(s => !s.text.includes('L'))?.text,
      }
    });
    setDiscogsResult(data);
    setIsLookingUp(false);
  }
};
```

---

## Bestanden te Wijzigen

| Bestand | Actie |
|---------|-------|
| `supabase/functions/matrix-discogs-lookup/index.ts` | **Nieuw** - Discogs lookup edge function |
| `src/pages/CDMatrixEnhancer.tsx` | Uitbreiden met Discogs lookup na OCR |
| `src/components/matrix-enhancer/MatrixDiscogsResult.tsx` | **Nieuw** - UI component voor resultaat |
| `src/components/matrix-enhancer/index.ts` | Export toevoegen |

---

## Verwacht Resultaat

Na implementatie:
1. Upload 1 matrix foto
2. OCR extraheert: `CPG1996002 50610344 02`
3. Discogs lookup vindt: Release 2610353
4. Toont: **Texas - Greatest Hits** | Catalog: **538 194-2** | Mercury 2000

Zodra dit betrouwbaar werkt → integreren in multi-foto scanner.
