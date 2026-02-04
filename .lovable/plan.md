
# Plan: Hiërarchische Discogs Zoekstrategie

## Huidige Situatie
De `ai-photo-analysis-v2` edge function zoekt nu gefragmenteerd:
- Barcode search (zonder format filter)
- Catno search (zonder format filter)  
- Artist+Title search (zonder format filter)

Hierdoor kan een LP release "winnen" bij een CD scan omdat format niet wordt meegenomen.

## Nieuwe Aanpak
Een **hiërarchische zoekstrategie** die de Discogs structuur volgt:

```text
┌─────────────────────────────────────┐
│  STAP 1: Artist + Title + Format    │
│  "Ella Fitzgerald A Portrait..."    │
│  + format=CD                        │
│  → Master release met CD versions   │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  STAP 2: Filter op Catalogusnummer  │
│  Zoek binnen resultaten naar        │
│  catno="SMD 847"                    │
│  → Exacte release match             │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│  STAP 3: Barcode/Matrix Verificatie │
│  Bevestig match met technische      │
│  identifiers (bonus, geen filter)   │
└─────────────────────────────────────┘
```

## Technische Wijzigingen

### 1. MediaType Parameter Toevoegen
De edge function moet `mediaType` ontvangen vanuit de frontend:

```typescript
// Request body uitbreiden
const { images, mediaType = 'cd' } = await req.json();
```

### 2. Nieuwe Zoekfunctie: `searchDiscogsHierarchical`

```typescript
async function searchDiscogsHierarchical(
  artist: string,
  title: string,
  catalogNumber: string | null,
  barcode: string | null,
  mediaType: 'cd' | 'vinyl',
  token: string
): Promise<DiscogsResult | null> {
  
  // STAP 1: Artist + Title + Format
  const formatParam = mediaType === 'cd' ? 'CD' : 'Vinyl';
  const searchUrl = `https://api.discogs.com/database/search?` +
    `q=${encodeURIComponent(`${artist} ${title}`)}&` +
    `type=release&` +
    `format=${formatParam}&` +
    `per_page=50`;
  
  const response = await fetch(searchUrl, { headers });
  const data = await response.json();
  
  // STAP 2: Filter op Catalogusnummer binnen resultaten
  if (catalogNumber && data.results) {
    const catnoMatch = data.results.find(r => {
      // Fetch release details en check catno
      return r.catno?.toUpperCase() === catalogNumber.toUpperCase();
    });
    if (catnoMatch) return catnoMatch;
  }
  
  // STAP 3: Barcode verificatie als fallback
  if (barcode && data.results) {
    // Zoek binnen gefilterde resultaten naar barcode match
  }
  
  return data.results?.[0] || null;
}
```

### 3. Search Strategies Herschrijven

Van:
```typescript
const searchStrategies = [
  { query: barcode, type: 'barcode' },      // Geen format
  { query: catalogNumber, type: 'catno' },  // Geen format
  { query: `${artist} ${title}`, type: 'general' }  // Geen format
]
```

Naar:
```typescript
// Primaire strategie: Hiërarchisch met format
const primaryResult = await searchDiscogsHierarchical(
  artist, title, catalogNumber, barcode, mediaType, token
);

// Fallback strategieën (alleen als primair faalt)
const fallbackStrategies = [
  { query: `${artist} ${title}`, type: 'general', format: mediaType },
  { query: catalogNumber, type: 'catno', format: mediaType }
];
```

### 4. Frontend Aanpassing

In `AIScanV2.tsx`, stuur `mediaType` mee met de API call:

```typescript
const { data: analysisResult } = await supabase.functions.invoke(
  'ai-photo-analysis-v2',
  {
    body: {
      images: imageUrls,
      mediaType: state.mediaType  // 'cd' of 'vinyl'
    }
  }
);
```

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/ai-photo-analysis-v2/index.ts` | Nieuwe `searchDiscogsHierarchical` functie, format parameter in alle searches |
| `src/pages/AIScanV2.tsx` | `mediaType` meesturen naar edge function |

## Verwacht Resultaat

Bij scan van de Ella Fitzgerald CD:
1. Zoek: "Ella Fitzgerald A Portrait of Ella Fitzgerald" + format=CD
2. Filter: Resultaten met catno "SMD 847"
3. Match: Release 4381440 (de correcte CD)

LP releases worden nooit meer geretourneerd bij een CD scan.
