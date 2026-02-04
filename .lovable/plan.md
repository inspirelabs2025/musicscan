
# Plan: Extreme Matrix Enhancement Pipeline

## Probleem Analyse

De foto heeft drie uitdagingen:
1. **Extreme regenboog reflecties** - De hele CD-oppervlak is bedekt met prismatische interferentie
2. **Lage matrix tekst contrast** - De gegraveerde tekst is nauwelijks zichtbaar
3. **Schaduw van fotograaf** - Extra donkere gebieden verstoren de analyse

## Oplossing: Multi-Stage Aggressive Filtering

### Nieuwe Filtering Strategie

```text
HUIDIGE PIPELINE:
Upload → Min-channel → Light contrast → AI analyse
        (niet genoeg voor extreme reflecties)

NIEUWE PIPELINE:
Upload → Hub Crop → Min-channel (agressief) → Adaptive Binarization → Multi-variant AI
   │         │              │                        │                     │
   │         │              │                        │                     └─ 3 filter varianten
   │         │              │                        └─ Zwart/wit output
   │         │              └─ Boost factor 1.8 (was 1.3)
   │         └─ Focus op 15-40% van centrum (matrix ring)
   └─ Origineel behouden voor fallback
```

### Fase 1: Automatische Hub Detection & Crop

Detecteert automatisch de CD hub en croppt naar de matrix ring area:

```typescript
function detectAndCropHub(ctx, width, height) {
  // 1. Zoek donkerste circulaire regio (hub gat)
  // 2. Bepaal centrum
  // 3. Crop naar ring: 15% tot 40% van radius
  // 4. Return alleen het relevante gebied
}
```

Dit verkleint het analysegebied drastisch en elimineert irrelevante reflecties.

### Fase 2: Agressieve Reflection Suppression

Verbeterde min-channel filter met hogere boost:

- **Boost factor**: 1.3 → 1.8
- **Gamma correctie**: 0.7 voor donkere gebieden
- **Hub enhancement**: Sterker centrum-gewogen

### Fase 3: Adaptive Binarization (Nieuw)

Omzetten naar puur zwart/wit met adaptive threshold:

```typescript
function adaptiveBinarize(ctx, width, height) {
  // Per regio (32x32 blokken):
  // 1. Bereken lokale gemiddelde
  // 2. Threshold = gemiddelde - C (constante)
  // 3. Pixel > threshold = wit, anders = zwart
}
```

Dit maakt zelfs vage gravures scherp zichtbaar.

### Fase 4: Multi-Variant AI Analysis

Stuur 3 verschillende beeldvarianten naar de AI:

| Variant | Doel |
|---------|------|
| Original cropped | Fallback voor leesbare gevallen |
| Min-channel enhanced | Reflectie onderdrukking |
| Binarized | Maximale tekst contrast |

De AI combineert informatie uit alle drie.

## Technische Implementatie

### Bestand 1: `src/utils/clientImagePreprocess.ts`

Nieuwe functies toevoegen:

```typescript
// Hub detectie en crop
export function detectHubCenter(ctx, width, height): { cx, cy, radius }

// Crop naar matrix ring
export function cropToMatrixRing(ctx, width, height, hubCenter): Canvas

// Adaptive binarization
export function adaptiveBinarize(ctx, width, height, blockSize = 32, C = 10): void

// Volledige extreme enhancement pipeline
export async function extremeMatrixEnhancement(
  imageInput: File | string
): Promise<{
  variants: {
    original: string;
    minChannel: string;
    binarized: string;
  };
  hubDetected: boolean;
  cropApplied: boolean;
}>
```

### Bestand 2: `supabase/functions/ai-photo-analysis-v2/index.ts`

Aangepaste AI prompt voor extreme gevallen:

```typescript
const extremeMatrixPrompt = `
You are analyzing a DIFFICULT CD matrix photo with heavy reflections.

CRITICAL INSTRUCTIONS:
1. Multiple image variants are provided - combine information from ALL
2. The BINARIZED version shows text as black on white - focus here first
3. Matrix codes are in the inner ring near the hub
4. Common OCR confusions to correct: O/0, I/1, S/5, B/8

Look for:
- IFPI codes (format: IFPI LXXXX or IFPI XXXXX)
- Catalog numbers (often start with label prefix)
- Matrix/stamper numbers
`;
```

### Bestand 3: `src/pages/AIScanV2.tsx`

UI updates:

1. "Extreme Enhancement" toggle voor moeilijke foto's
2. Preview van alle 3 filter varianten
3. Quality indicator met feedback ("Foto te donker", "Zware reflecties gedetecteerd")

### Bestand 4: `src/components/scanner/ExtremeEnhancementPreview.tsx` (Nieuw)

Component om de 3 varianten naast elkaar te tonen met tabs:

- Tab 1: Origineel (gecropped)
- Tab 2: Reflectie filter
- Tab 3: Zwart/Wit

## Verwachte Resultaten

Met de voorbeeld foto:
1. **Hub crop** verwijdert 60% irrelevante pixels
2. **Agressieve min-channel** onderdrukt regenboog effecten
3. **Binarisatie** maakt zelfs vage gravures zichtbaar
4. **Multi-variant AI** combineert beste resultaten

## Bestanden

| Actie | Bestand |
|-------|---------|
| Wijzigen | `src/utils/clientImagePreprocess.ts` |
| Wijzigen | `supabase/functions/ai-photo-analysis-v2/index.ts` |
| Wijzigen | `src/pages/AIScanV2.tsx` |
| Nieuw | `src/components/scanner/ExtremeEnhancementPreview.tsx` |

## Optionele Uitbreidingen

- **Auto-detect difficult photos**: Automatisch extreme mode inschakelen bij hoge kleurvariatie
- **User guidance**: Real-time feedback tijdens fotograferen ("Draai CD 45°")
- **Fallback chain**: Als binarisatie faalt, probeer andere drempels
