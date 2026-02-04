
# Plan: Matrix Code Extractie Fixen in CD Matrix Enhancer

## Probleem Analyse

De huidige code in `CDMatrixEnhancer.tsx` (regel 406-407):
```typescript
const matrixCode = ocrResult.segments
  .find(s => s.type === 'matrix')?.text || ocrResult.cleanText;
```

Dit faalt omdat:
1. De OCR geen segment met `type: 'matrix'` vindt (AI classificeert het mogelijk anders)
2. De fallback `cleanText` bevat ALLE tekst: "WWW.MEGATMOTION.COM 3384732 60L0L9"
3. De URL en IFPI-resten worden meegenomen als "matrix code"

## Oplossing

### 1. Verbeterde Matrix Extractie Logica

Nieuwe fallback strategie met meerdere lagen:

```
Laag 1: Zoek segment met type === 'matrix'
Laag 2: Zoek segment met type === 'catalog' (legacy)  
Laag 3: Filter cleanText - verwijder URLs en bekende patronen
Laag 4: Laatste resort - eerste numeriek-achtige string
```

### 2. URL/Pattern Filtering

Maak een `extractPureMatrixCode()` helper functie die:
- URLs verwijdert (www., .com, .nl, etc.)
- IFPI codes verwijdert (begint met IFPI)
- Landnamen verwijdert (Germany, Netherlands, etc.)
- Bedrijfsnamen verwijdert (Sony, EMI, DADC, etc.)
- Alleen alphanumerieke codes behoudt (8+ karakters)

### 3. Bestandswijzigingen

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/CDMatrixEnhancer.tsx` | Matrix extractie logica vervangen door robuuste filtering |

### 4. Filter Regels

```
VERWIJDEREN uit matrix code:
- /www\.[^\s]+/gi          → URLs
- /https?:\/\/[^\s]+/gi    → Full URLs  
- /IFPI\s*[A-Z0-9]+/gi     → IFPI codes
- /made in \w+/gi          → "Made in Germany"
- /\b(sony|emi|dadc|sonopress|pmdc)\b/gi → Bedrijfsnamen

BEHOUDEN als matrix:
- Alphanumerieke codes van 6+ karakters
- Nummers met spaties/streepjes (bijv. "3384732 02 1")
```

### 5. Implementatie

```typescript
// Nieuwe helper functie
const extractPureMatrixCode = (segments: OCRSegment[], cleanText: string): string | null => {
  // Eerst: zoek expliciet matrix type
  const matrixSegment = segments.find(s => s.type === 'matrix');
  if (matrixSegment?.text) return matrixSegment.text;
  
  // Legacy: zoek catalog type
  const catalogSegment = segments.find(s => s.type === 'catalog');
  if (catalogSegment?.text) return catalogSegment.text;
  
  // Fallback: filter cleanText
  let filtered = cleanText
    .replace(/www\.[^\s]+/gi, '')
    .replace(/IFPI\s*[A-Z0-9]+/gi, '')
    .replace(/made in \w+/gi, '')
    .replace(/\b(sony|emi|dadc|sonopress|germany|netherlands)\b/gi, '')
    .trim();
  
  // Extract eerste valide code (6+ alfanumeriek)
  const codeMatch = filtered.match(/[A-Z0-9][A-Z0-9\s-]{5,}/i);
  return codeMatch ? codeMatch[0].trim() : null;
};
```

## Verwacht Resultaat

| Input | Output |
|-------|--------|
| "WWW.MEGATMOTION.COM 3384732 60L0L9" | "3384732" (of "3384732 02 1" als volledig) |
| Segment type: "matrix" met "519 613-2" | "519 613-2" |
| cleanText: "IFPI L028 Made in Germany 50999" | "50999" |

## Alternatieve Aanpak

Als de OCR consistent `type: 'other'` retourneert voor URLs, kunnen we ook de segments filteren:
- Neem alle segmenten die NIET 'ifpi' of 'other' zijn
- Of: neem segmenten met hoogste confidence die geen URL bevatten
