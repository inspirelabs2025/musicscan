
# Fix: Discogs Resultaten Behouden bij Navigatie

## Probleem Analyse

**Huidige data flow:**
```text
Matrix Enhancer                 sessionStorage              V2 Scanner
─────────────────              ───────────────             ──────────────
✅ OCR: CPG1996002        →    matrix: "CPG1996..."   →    Laadt matrix
✅ Discogs: Alcione            ifpiCodes: [...]            Laadt foto
   - Discogs ID: 26103535      photo: base64               
   - Catalog: 0340-2           ❌ GEEN discogs data!  →    Start NIEUWE analyse
                                                           → Vindt andere match!
```

**Probleem**: De Discogs match (artist, title, discogs_id, catalog_number) wordt NIET opgeslagen in sessionStorage.

---

## Oplossing: Discogs Data Doorgeven

### Stap 1: CDMatrixEnhancer - Discogs resultaten opslaan

Wijzig de "Doorgaan met Scannen" knop (regel 520-526):

```typescript
// NIEUW: Voeg Discogs data toe aan sessionStorage
sessionStorage.setItem('matrixEnhancerData', JSON.stringify({
  matrix: matrixCode,
  ifpiCodes: ifpiCodes,
  allSegments: ocrResult.segments,
  photo: originalImage,
  timestamp: Date.now(),
  // TOEVOEGEN: Discogs match data
  discogsMatch: discogsResult?.success ? {
    discogs_id: discogsResult.discogs_id,
    discogs_url: discogsResult.discogs_url,
    artist: discogsResult.artist,
    title: discogsResult.title,
    catalog_number: discogsResult.catalog_number,
    label: discogsResult.label,
    year: discogsResult.year,
    country: discogsResult.country,
    genre: discogsResult.genre,
    cover_image: discogsResult.cover_image,
    match_confidence: discogsResult.match_confidence,
  } : null,
}));
```

### Stap 2: AIScanV2 - Discogs data laden en direct tonen

Wijzig de useEffect (regel 106-152):

```typescript
useEffect(() => {
  if (fromEnhancer) {
    try {
      const storedData = sessionStorage.getItem('matrixEnhancerData');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          // Bestaande code...
          setPrefilledMatrix(data.matrix);
          setFromMatrixEnhancer(true);
          
          // NIEUW: Als er een Discogs match is, direct tonen
          if (data.discogsMatch) {
            setAnalysisResult({
              scanId: `enhancer-${Date.now()}`,
              result: {
                discogs_id: data.discogsMatch.discogs_id,
                discogs_url: data.discogsMatch.discogs_url,
                artist: data.discogsMatch.artist,
                title: data.discogsMatch.title,
                label: data.discogsMatch.label,
                catalog_number: data.discogsMatch.catalog_number,
                year: data.discogsMatch.year,
                confidence_score: data.discogsMatch.match_confidence,
                ai_description: `Matrix match via CD Matrix Enhancer`,
                matrix_number: data.matrix,
                country: data.discogsMatch.country,
                genre: data.discogsMatch.genre,
              },
              version: 'enhancer-v1'
            });
            // Skip verification - already verified in enhancer
            setVerificationStep('verified');
            setVerifiedMatrixNumber(data.matrix);
          }
          // ... rest van bestaande code
        }
      }
    } catch (e) {
      console.error('Failed to load matrix enhancer data:', e);
    }
  }
}, [fromEnhancer]);
```

### Stap 3: Optioneel - "Nieuwe Analyse" knop

Als de gebruiker toch een nieuwe analyse wil starten:

```typescript
// In de result sectie, voeg toe:
{fromMatrixEnhancer && (
  <Button variant="outline" onClick={() => {
    setFromMatrixEnhancer(false);
    setAnalysisResult(null);
  }}>
    Nieuwe V2 Analyse Starten
  </Button>
)}
```

---

## Technisch Overzicht

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/CDMatrixEnhancer.tsx` | Voeg `discogsMatch` toe aan sessionStorage |
| `src/pages/AIScanV2.tsx` | Laad en toon Discogs data direct zonder nieuwe analyse |

---

## Verwacht Resultaat

Na implementatie:
1. Matrix Enhancer vindt: **Alcione - Novelas** (Discogs ID 26103535)
2. Gebruiker klikt "Doorgaan met Scannen"
3. V2 toont direct: **Alcione - Novelas** met 86% vertrouwen
4. Geen nieuwe analyse nodig - resultaat blijft behouden
5. Optie om toch nieuwe analyse te starten indien gewenst
