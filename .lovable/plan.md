
# Plan: Verbeterde Discogs Zoekstrategie ✅ GEÏMPLEMENTEERD

## Status: Voltooid

De `ai-photo-analysis-v2` edge function is bijgewerkt met:

### Nieuwe Zoekstrategie (in volgorde)

1. **Artist + Title + format=CD/Vinyl** ← Primair (Discogs fuzzy matching corrigeert OCR-fouten)
2. **Barcode + format** ← Precise identifier
3. **Catalogusnummer + format** ← Label-specifiek
4. **Matrix nummer** ← Geen format (uniek per pressing)
5. **Label + Catno + format** ← Combinatie
6. **Fallback zonder format** ← Als CD/Vinyl versie niet bestaat
7. **Alternative search terms** ← Extra zoektermen

### Format Filtering

- CD scans krijgen `&format=CD` parameter
- Vinyl scans krijgen `&format=Vinyl` parameter
- Matrix zoekstrategie heeft GEEN format (uniek per pressing)
- Fallback strategieën hebben GEEN format voor bredere matching

### OCR Correctie via Discogs

De bestaande Discogs-parsing (regels 1358-1382) corrigeert automatisch:
- "Exas" → "Texas" (via Discogs resultaat)
- "Texas (2)" → "Texas" (verwijdert numerieke suffixen)
- Gebruikt Discogs artiestennaam boven OCR wanneer beschikbaar

### Technische Wijzigingen

**File:** `supabase/functions/ai-photo-analysis-v2/index.ts`

```typescript
// Nieuwe functie signature
async function searchDiscogsV2(analysisData: any, mediaType: 'vinyl' | 'cd' = 'cd')

// Format filter bepaald op basis van mediaType
const formatFilter = mediaType === 'vinyl' ? 'Vinyl' : 'CD';

// URL met format parameter
searchUrl += `&format=${encodeURIComponent(strategyFormat)}`;
```

## Verwachte Resultaten

| Test Case | Vóór | Na |
|-----------|------|-----|
| Texas - The Hush (CD) | "Exas" als artiest | "Texas" gecorrigeerd via Discogs |
| Format matching | Kon LP teruggeven | Alleen CD resultaten |
| OCR fouten | Propageren | Gecorrigeerd via Discogs fuzzy search |
