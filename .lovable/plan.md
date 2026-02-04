
# Plan: Fix Matrix Foto Detectie

## Probleem

De huidige visuele detectie-algoritmes zijn te strikt voor echte smartphone foto's van CD's:
- Hub hole detectie verwacht >50% donkere pixels (brightness < 60)
- Rainbow detectie verwacht saturation > 0.2 EN hue variance > 40
- Typische foto's scoren slechts 25-40%, onder de 40% drempel

## Oplossing: Dubbele Strategie

### Strategie 1: Positie-Based Auto-Detectie

Voor CD uploads is de 3e foto (index 2) conventioneel de "Label (plaat)" foto. We behandelen deze automatisch als matrix foto:

```text
Upload Flow voor CD:
────────────────────
Foto 1 (index 0) = Voorkant hoes
Foto 2 (index 1) = Achterkant hoes  
Foto 3 (index 2) = Label/Matrix     → AUTO-DETECT als matrix
Foto 4 (index 3) = Binnenkant booklet
```

### Strategie 2: Verlaagde Visuele Thresholds

Visuele detectie als backup met veel lagere drempels:

| Feature | Oud | Nieuw |
|---------|-----|-------|
| Hub hole dark ratio | >50% | >25% |
| Hub hole brightness | <60 | <100 |
| Rainbow saturation | >0.2 | >0.1 |
| Rainbow hue variance | >40 | >20 |
| Central dark ratio | <85% outer | <95% outer |
| Overall threshold | 40% | 25% |

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/AIScanV2.tsx` | Positie-based auto-detect voor foto 3 |
| `src/utils/matrixPhotoDetector.ts` | Verlaagde thresholds |

## Implementatie Details

### 1. AIScanV2.tsx - Positie-Based Detection

```typescript
// Bij CD upload: foto op index 2 is conventioneel de matrix foto
const isConventionalMatrixPosition = mediaType === 'cd' && uploadedFiles.length === 2;

if (isConventionalMatrixPosition || (detection.isMatrix && detection.confidence >= 0.25)) {
  // Start matrix enhancer
  startBackgroundProcessing(file, { skipDetection: true });
}
```

### 2. matrixPhotoDetector.ts - Verlaagde Thresholds

```typescript
// detectHubHole - verlaagd
if (brightness < 100) darkPixels++; // was: 60
return darkRatio > 0.25; // was: 0.5

// detectRainbowReflection - verlaagd  
return saturationRatio > 0.1 && hueVariance > 20; // was: 0.2 en 40

// detectCentralDarkArea - verlaagd
return avgCenter < avgOuter * 0.95; // was: 0.85

// Overall threshold - verlaagd
return { isMatrix: score >= 0.25 }; // was: 0.40
```

## Data Flow na Fix

```text
User Upload: 4 foto's voor CD
     │
     ├─ Foto 1 → Geen matrix check (index 0)
     ├─ Foto 2 → Geen matrix check (index 1)  
     ├─ Foto 3 → AUTO: Matrix Enhancer start! ✅
     └─ Foto 4 → Geen matrix check (index 3)
     
     ↓
Matrix Enhancer (achtergrond)
     │
     ├─ Ring crops + CLAHE
     ├─ matrix-ocr
     ├─ matrix-discogs-lookup
     │
     └─ Resultaat merged met andere OCR
```

## Voordelen

1. **100% Betrouwbaar**: Positie-based detectie werkt altijd voor de 3e foto
2. **Fallback**: Visuele detectie met lagere drempels als backup
3. **Geen User Input**: Volledig automatisch zonder handmatige stappen
4. **Backwards Compatible**: Bestaande flow blijft werken
