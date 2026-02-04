
# Plan: Strikte Format Filtering voor Matrix Discogs Lookup

## Probleem
De `matrix-discogs-lookup` edge function ontvangt geen `mediaType` parameter en zoekt altijd met hardcoded `format=CD`. Hierdoor:
- Kan de functie niet weten of het een CD of Vinyl scan is
- Kan de Discogs API filter omzeild worden (die niet 100% waterdicht is)
- Worden soms verkeerde formaten geretourneerd (LP in plaats van CD)

## Oplossing

### 1. Edge Function Aanpassen (`supabase/functions/matrix-discogs-lookup/index.ts`)

**Nieuwe input parameter:**
```typescript
const { matrixNumber, ifpiMastering, ifpiMould, mediaType = 'cd' } = await req.json();
```

**Nieuwe Vinyl format filter:**
```typescript
function isVinylFormat(formats: string[]): boolean {
  const vinylKeywords = ['Vinyl', 'LP', '12"', '7"', '10"', 'Album', 'EP', 'Single'];
  const cdKeywords = ['CD', 'SACD', 'CDr', 'HDCD'];
  
  const formatStr = formats.join(' ').toUpperCase();
  
  // Reject als het CD keywords bevat
  for (const cd of cdKeywords) {
    if (formatStr.includes(cd.toUpperCase())) return false;
  }
  
  // Accept als het vinyl keywords bevat
  return vinylKeywords.some(v => formatStr.includes(v.toUpperCase()));
}
```

**Dynamische Discogs API query:**
```typescript
async function searchDiscogs(query: string, token: string, mediaType: 'cd' | 'vinyl') {
  const formatParam = mediaType === 'vinyl' ? 'Vinyl' : 'CD';
  const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&format=${formatParam}&per_page=25`;
  
  // Filter resultaten STRIKT op basis van mediaType
  const filteredResults = results.filter((r) => {
    if (mediaType === 'cd') return isCDFormat(r.format);
    return isVinylFormat(r.format);
  });
}
```

**Response met format indicator:**
```typescript
const result: LookupResult = {
  // ...bestaande velden...
  format: mediaType === 'vinyl' ? 'Vinyl' : 'CD', // Nieuw veld
};
```

### 2. Callers Aanpassen

**useParallelMatrixProcessing.ts:**
```typescript
const processMatrixPhotoInBackground = useCallback(async (
  file: File,
  options: { 
    skipDetection?: boolean; 
    confidenceThreshold?: number;
    mediaType?: 'cd' | 'vinyl';  // Nieuwe optie
  } = {}
) => {
  // ...
  const { data: discogsData } = await supabase.functions.invoke('matrix-discogs-lookup', {
    body: {
      matrixNumber: matrixText,
      ifpiMastering,
      ifpiMould,
      mediaType: options.mediaType || 'cd'  // Doorsturen
    }
  });
});
```

**CDMatrixEnhancer.tsx:**
Voeg mediaType selectie toe (of default naar 'cd' aangezien het CD Matrix Enhancer heet).

**AIScanV2.tsx:**
Bij aanroepen van parallel processing, stuur het geselecteerde mediaType mee.

### 3. UI Feedback (MatrixDiscogsResult.tsx)

Toon het gedetecteerde format in de resultaten:
```tsx
<Badge variant="outline" className="bg-primary/10">
  <Disc className="h-3 w-3 mr-1" />
  {result.format || 'CD'}
</Badge>
```

## Technische Details

| Aspect | Wijziging |
|--------|-----------|
| Edge Function | Nieuwe `mediaType` parameter, `isVinylFormat()` functie, dynamische API query |
| Hook | `mediaType` option in `processMatrixPhotoInBackground()` |
| CDMatrixEnhancer | Default `mediaType: 'cd'` bij aanroep |
| AIScanV2 | Pass `mediaType` van scan state naar parallel processing |
| UI Component | Toon format badge in resultaat |

## Bestanden te Wijzigen
1. `supabase/functions/matrix-discogs-lookup/index.ts` - Edge function met mediaType support
2. `src/hooks/useParallelMatrixProcessing.ts` - MediaType option toevoegen
3. `src/pages/CDMatrixEnhancer.tsx` - MediaType meesturen (default cd)
4. `src/pages/AIScanV2.tsx` - MediaType doorsturen naar parallel processing
5. `src/components/matrix-enhancer/MatrixDiscogsResult.tsx` - Format badge tonen

## Verwacht Resultaat
- CD scans retourneren ALLEEN CD releases
- Vinyl scans retourneren ALLEEN Vinyl releases
- Format wordt getoond in de UI voor bevestiging
- Geen cross-format matches meer mogelijk
