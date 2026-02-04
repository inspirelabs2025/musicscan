
# Plan: Fallback Discogs Search URL bij NO_EXACT_MATCH

## Probleem

Bij `NO_EXACT_MATCH` wordt `discogsUrl` op `null` gezet, waardoor:
- De "Bekijk op Discogs" knop niet getoond wordt
- Gebruikers niet handmatig kunnen zoeken op Discogs

## Oplossing

Genereer een **search URL** als fallback wanneer er geen exacte release match is.

**Discogs Search URL formaat:**
```
https://www.discogs.com/search/?q=Ella+Fitzgerald+Portrait+SUMCD+4164&type=release&format=CD
```

## Wijzigingen

### 1. Edge Function: `ai-photo-analysis-v2/index.ts`

**Toevoegen aan NO_EXACT_MATCH return (regel 1706-1729):**

```typescript
// Generate search URL for manual lookup
const searchQuery = [
  analysisData.artist,
  analysisData.title,
  analysisData.catalogNumber
].filter(Boolean).join(' ');

const discogsSearchUrl = searchQuery 
  ? `https://www.discogs.com/search/?q=${encodeURIComponent(searchQuery)}&type=release&format=${formatParam}`
  : null;

return {
  status: 'NO_EXACT_MATCH',
  // ... bestaande velden ...
  discogsUrl: null,              // Geen exacte release URL
  discogsSearchUrl: discogsSearchUrl,  // NIEUW: Fallback search URL
  // ...
};
```

### 2. Frontend: `AIScanV2.tsx`

**Wijzig de "Bekijk op Discogs" knop logica (regel 1189-1235):**

Van:
```typescript
{analysisResult.result.discogs_url && <div className="pt-4 space-y-3">
  // ... buttons ...
</div>}
```

Naar:
```typescript
{(analysisResult.result.discogs_url || analysisResult.result.discogs_search_url) && (
  <div className="pt-4 space-y-3">
    {/* Toon "Toevoegen" alleen bij exacte match */}
    {analysisResult.result.discogs_url && (
      <Button onClick={...}>
        Toevoegen aan Collectie
      </Button>
    )}
    
    {/* Discogs link - release of search URL */}
    <Button asChild variant="outline" className="w-full">
      <a href={analysisResult.result.discogs_url || analysisResult.result.discogs_search_url} 
         target="_blank" rel="noopener noreferrer">
        {analysisResult.result.discogs_url 
          ? "Bekijk op Discogs" 
          : "Zoek op Discogs"}
      </a>
    </Button>
  </div>
)}
```

### 3. Database Opslag

Update de database update om ook de search URL op te slaan:

```typescript
discogs_url: isExactMatch 
  ? (discogsResult.discogsUrl ?? null) 
  : (discogsResult.discogsSearchUrl ?? null),  // Sla search URL op als fallback
```

## Verwacht Resultaat

| Status | discogs_url | UI |
|--------|-------------|-----|
| EXACT_MATCH | `https://www.discogs.com/release/12345` | "Bekijk op Discogs" |
| NO_EXACT_MATCH | `https://www.discogs.com/search/?q=...` | "Zoek op Discogs" |

Voor de Ella Fitzgerald scan:
- URL: `https://www.discogs.com/search/?q=Ella%20Fitzgerald%20Portrait%20SUMCD%204164&type=release&format=CD`
- Knoptekst: "Zoek op Discogs"

## Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/ai-photo-analysis-v2/index.ts` | Genereer `discogsSearchUrl` bij NO_EXACT_MATCH |
| `src/pages/AIScanV2.tsx` | Toon search URL knop bij geen exacte match |
