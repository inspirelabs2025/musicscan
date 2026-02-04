
# Plan: Verbeterde Discogs Zoekstrategie

## Probleem Analyse

De huidige `ai-photo-analysis-v2` edge function heeft twee problemen:

1. **Geen format filtering** - Zoekt alle releases, niet specifiek CD's
2. **OCR-fouten in zoekquery** - "Exas" ipv "Texas" wordt gebruikt omdat de zoekopdracht direct de OCR-output neemt

De URL die je deelde laat zien hoe Discogs werkt:
```
https://www.discogs.com/master/572403-Ella-Fitzgerald-A-Portrait-Of-Ella-Fitzgerald?format=CD
```

## Oplossing

### Stap 1: Primaire Zoekstrategie Vereenvoudigen

De eerste zoekstrategie wordt: **Artiest + Titel + format=CD**

```
Huidige volgorde:
1. Barcode
2. Catalogusnummer  
3. Matrix nummer
4. Artist + Title (ZONDER format)
5. Label + Catno

Nieuwe volgorde:
1. Artist + Title + format=CD  ← NIEUW: Prioriteit #1
2. Barcode + format=CD
3. Catalogusnummer + format=CD
4. Matrix nummer
5. Fallback zonder format
```

### Stap 2: Format Parameter Toevoegen

De Discogs API search krijgt `&format=CD` parameter:

```typescript
// Voor CD scans
const searchUrl = `https://api.discogs.com/database/search?` +
  `q=${encodeURIComponent(`${artist} ${title}`)}&` +
  `type=release&` +
  `format=CD&` +     // ← NIEUW
  `per_page=20`;
```

### Stap 3: Artiestcorrectie via Discogs Resultaten

Als we een match vinden, gebruiken we de **Discogs artiestennaam** (niet de OCR):

```
OCR: "Exas - The Hush"
Discogs result: "Texas (2) - The Hush"
→ Gecorrigeerde artiest: "Texas"
```

Dit is al gedeeltelijk geïmplementeerd in de laatste update, maar de zoekquery gebruikt nog steeds de foute OCR-naam.

### Stap 4: Fuzzy Matching op Discogs Resultaten

Omdat OCR "Exas" kan produceren, maar Discogs "Texas" heeft:
- Zoek met originele OCR tekst
- Filter resultaten op 80%+ similarity met title
- Neem artiestnaam van Discogs result

## Technische Wijzigingen

### File: `supabase/functions/ai-photo-analysis-v2/index.ts`

```typescript
// Nieuwe primaire zoekstrategie
const searchStrategies = [
  // NIEUW: Strategy 1: Simple Artist + Title with format filter
  ...(analysisData.artist && analysisData.title ? [{
    query: `${analysisData.artist} ${analysisData.title}`,
    type: 'artist_title_format',
    format: 'CD'  // of 'Vinyl' afhankelijk van mediaType
  }] : []),
  
  // Strategy 2: Barcode with format
  ...(analysisData.barcode ? [{
    query: analysisData.barcode,
    type: 'barcode',
    format: 'CD'
  }] : []),
  
  // ... rest met format parameter
];

// Bij bouwen van URL
let searchUrl = `https://api.discogs.com/database/search?`;

if (type === 'barcode') {
  searchUrl += `barcode=${encodeURIComponent(query)}`;
} else if (type === 'catno') {
  searchUrl += `catno=${encodeURIComponent(query)}`;
} else {
  searchUrl += `q=${encodeURIComponent(query)}`;
}

searchUrl += `&type=release`;

// NIEUW: Format filter toevoegen
if (strategy.format) {
  searchUrl += `&format=${encodeURIComponent(strategy.format)}`;
}

searchUrl += `&per_page=20`;
```

### Resultaat Verwerking

Na een succesvolle zoekopdracht:
1. Parse "Texas (2) - The Hush" → artiest: "Texas", titel: "The Hush"
2. Verwijder numerieke suffixen zoals "(2)"
3. Gebruik deze gecorrigeerde waarden in het resultaat

## Voordelen

| Aspect | Huidig | Nieuw |
|--------|--------|-------|
| Format filtering | Geen | CD/Vinyl specifiek |
| OCR fouten | Propageren naar resultaat | Gecorrigeerd via Discogs |
| Zoekprecisie | Breed | Gericht op juiste format |
| Match kwaliteit | Kan LP teruggeven voor CD | Alleen CD resultaten |

## Edge Cases

- **Geen CD versie bestaat**: Fallback naar algemene zoekopdracht zonder format filter
- **OCR volledig fout**: Catalog number en barcode blijven als backup strategieën
- **Compilatie albums**: Title matching met fuzzy logic (80% threshold)
