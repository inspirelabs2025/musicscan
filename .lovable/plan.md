
# Plan: IFPI Codes Toevoegen aan CD Matrix Enhancer Flow

## Huidige Situatie
De `matrix-ocr` Edge Function detecteert al meerdere code-types in het `segments` array:
- **catalog**: Catalogusnummer (lange numerieke reeks)
- **ifpi**: IFPI codes (bijv. "IFPI L028", "IFPI 0110")
- **matrix**: Andere matrix codes

Echter, alleen `cleanText` (meestal alleen de matrix) wordt doorgegeven aan de AIScanV2 scanner.

## Wijzigingen

### 1. CDMatrixEnhancer.tsx - Data Overdracht Uitbreiden
**Huidige code (regel 396-402):**
```typescript
sessionStorage.setItem('matrixEnhancerData', JSON.stringify({
  matrix: matrixCode,
  photo: originalImage,
  timestamp: Date.now(),
}));
```

**Nieuwe code:**
```typescript
// Extract IFPI codes from segments
const ifpiCodes = ocrResult.segments
  .filter(s => s.type === 'ifpi')
  .map(s => s.text);

// Extract catalog/matrix codes
const catalogCode = ocrResult.segments
  .find(s => s.type === 'catalog')?.text || ocrResult.cleanText;

sessionStorage.setItem('matrixEnhancerData', JSON.stringify({
  matrix: catalogCode,
  ifpiCodes: ifpiCodes,
  allSegments: ocrResult.segments,
  photo: originalImage,
  timestamp: Date.now(),
}));
```

### 2. MatrixOCRResult.tsx - UI Verbetering voor IFPI
De component toont al alle segments met badges (IFPI, Catalogus, Matrix). Geen wijzigingen nodig, maar we kunnen de weergave verduidelijken.

### 3. AIScanV2.tsx - IFPI Codes Ontvangen
De scanner moet de IFPI codes uit sessionStorage laden en meesturen naar de analyse.

**Toevoegen aan state:**
```typescript
const [prefilledIfpiCodes, setPrefilledIfpiCodes] = useState<string[]>([]);
```

**Uitbreiden van useEffect (regel ~85):**
```typescript
if (storedData.ifpiCodes) {
  setPrefilledIfpiCodes(storedData.ifpiCodes);
}
```

**Uitbreiden van API call:**
```typescript
body: {
  photoUrls,
  mediaType,
  conditionGrade,
  prefilledMatrix: prefilledMatrix || undefined,
  prefilledIfpiCodes: prefilledIfpiCodes.length > 0 ? prefilledIfpiCodes : undefined
}
```

### 4. ai-photo-analysis-v2 Edge Function - IFPI Verwerken
De Edge Function moet IFPI codes gebruiken voor betere Discogs matching.

**Interface uitbreiden:**
```typescript
interface AnalysisRequest {
  // ...existing fields
  prefilledIfpiCodes?: string[];
}
```

**Logica toevoegen:**
IFPI codes kunnen worden gebruikt voor:
- Validatie van het juiste pressing (land van origine)
- Verfijning van Discogs zoekresultaten

### 5. UI Feedback - IFPI Badge in Scanner
Wanneer IFPI codes zijn meegenomen, toon dit visueel:
```tsx
{prefilledIfpiCodes.length > 0 && (
  <Badge variant="secondary">
    IFPI: {prefilledIfpiCodes.join(', ')}
  </Badge>
)}
```

## Samenvatting Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/CDMatrixEnhancer.tsx` | IFPI codes toevoegen aan sessionStorage |
| `src/pages/AIScanV2.tsx` | IFPI codes laden en tonen + meesturen |
| `supabase/functions/ai-photo-analysis-v2/index.ts` | IFPI accepteren en gebruiken |

## Verwacht Resultaat
Na deze wijzigingen:
1. Matrix Enhancer detecteert zowel catalogusnummer ALS IFPI codes
2. Beide worden visueel getoond in de OCR resultaten
3. Bij "Doorgaan met Scannen" worden ALLE codes meegenomen
4. De AIScanV2 scanner toont welke codes zijn overgenomen
5. De Discogs matching wordt nauwkeuriger door IFPI validatie
