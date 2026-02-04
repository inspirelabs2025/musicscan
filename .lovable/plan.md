
# Plan: CD Matrix Filtering Fine-tuning

## Probleemanalyse van je Foto

De foto toont een CD met zware regenboog-reflecties (interferentie patronen). Dit is het moeilijkste scenario voor OCR omdat:

- **Kleurverschillen**: Reflecties variëren per kleurkanaal (R/G/B)
- **Gegraveerde tekst**: Matrix nummers zijn uniform grijs (geen kleur)
- **Locatie**: Matrix info zit in de binnenste ring rond de hub

## Technische Oplossing

### Strategie: AI-gestuurde Reflection Suppression

Gezien de Deno edge function beperkingen (geen native image libraries zoals Sharp/Jimp), gebruiken we de **AI gateway** met gespecialiseerde prompts voor matrix enhancement.

### Nieuwe Aanpak: Multi-Pass AI Enhancement

```text
┌─────────────────────────────────────────────────────────────┐
│ HUIDIGE FLOW                                                │
│ ┌──────────┐    ┌──────────────┐    ┌─────────────┐        │
│ │ Upload   │ →  │ preprocess-  │ →  │ ai-photo-   │        │
│ │ foto     │    │ matrix-photo │    │ analysis-v2 │        │
│ └──────────┘    └──────────────┘    └─────────────┘        │
│                       ↑                                     │
│            Edge detection only                              │
│            (niet genoeg voor reflecties)                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ NIEUWE FLOW                                                 │
│ ┌──────────┐    ┌──────────────────┐    ┌─────────────┐    │
│ │ Upload   │ →  │ ai-enhance-      │ →  │ ai-photo-   │    │
│ │ foto     │    │ matrix-photo     │    │ analysis-v2 │    │
│ └──────────┘    │ (NEW)            │    └─────────────┘    │
│                 │                   │                       │
│                 │ 1. AI Reflection  │                       │
│                 │    Suppression    │                       │
│                 │ 2. Circular Text  │                       │
│                 │    Enhancement    │                       │
│                 │ 3. Local Contrast │                       │
│                 │    in Hub Area    │                       │
│                 └──────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Implementatie Details

#### 1. Nieuwe Edge Function: `ai-enhance-matrix-photo`

Gebruikt Gemini's vision capabilities met gespecialiseerde prompt:

```typescript
const enhancementPrompt = `
You are an expert image processor specializing in CD/vinyl matrix number enhancement.

TASK: Enhance this CD surface image to make engraved text maximally readable.

CHALLENGES TO ADDRESS:
1. Rainbow/prismatic reflections (iridescence)
2. Low contrast engraved text
3. Circular text arrangement around hub
4. Specular highlights

ENHANCEMENT STRATEGY:
1. Suppress color variations (reflections appear colored, text is uniform gray)
2. Increase local contrast in the inner ring area (15-30mm from center)
3. Apply directional sharpening along circular text paths
4. Normalize brightness to reveal subtle engravings

OUTPUT: The same image with enhanced readability of matrix numbers, IFPI codes, and catalog numbers.
`;
```

#### 2. Client-side Preview Enhancement

Uitbreiding van `clientImagePreprocess.ts`:

```typescript
// Nieuwe functie voor CD-specifieke preprocessing
export function preprocessCDMatrix(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Per pixel: neem MINIMUM van R/G/B kanalen
  // Dit onderdrukt kleurrijke reflecties (die in 1 kanaal sterk zijn)
  for (let i = 0; i < data.length; i += 4) {
    const minChannel = Math.min(data[i], data[i+1], data[i+2]);
    // Boost het minimum kanaal voor betere zichtbaarheid
    const enhanced = Math.min(255, minChannel * 1.3);
    data[i] = enhanced;
    data[i+1] = enhanced;
    data[i+2] = enhanced;
  }
  
  ctx.putImageData(imageData, 0, 0);
}
```

#### 3. Foto Tips UI Component

Nieuwe component met real-time feedback:

```typescript
// Voorbeeld tips voor betere foto's
const cdPhotoTips = [
  "💡 Gebruik indirect licht (geen directe lamp op CD)",
  "📐 Fotografeer onder hoek van 45° om reflecties te minimaliseren",
  "🔍 Focus op de binnenste ring waar matrix codes staan",
  "🌑 Donkere achtergrond vermindert reflecties"
];
```

### Bestanden

| Actie | Bestand | Doel |
|-------|---------|------|
| Wijzigen | `supabase/functions/preprocess-matrix-photo/index.ts` | AI-prompt enhancement toevoegen |
| Wijzigen | `src/utils/clientImagePreprocess.ts` | Min-channel filter voor CD's |
| Wijzigen | `src/pages/AIScanV2.tsx` | Preview tonen van filtering |
| Nieuw | `src/components/scanner/CDPhotoTips.tsx` | Tips voor betere foto's |

### Verwachte Resultaten

Met deze aanpassingen:
1. **Reflecties onderdrukt**: Min-channel filter elimineert kleurverschillen
2. **Tekst versterkt**: Lokale contrast boost in hub-gebied
3. **Betere OCR**: AI krijgt schonere input voor matrix herkenning
4. **Gebruiker feedback**: Preview slider toont verbetering

### Test Scenario

Met jouw foto als test case:
1. Upload → Direct min-channel preview
2. Vergelijk origineel vs gefilterd in slider
3. Analyse → Check of matrix nummer correct wordt herkend
