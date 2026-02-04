
# Plan: CD Matrix Enhancer Feature

## Architectuur Context

**Belangrijk**: Dit project gebruikt **React + Vite + Tailwind** (niet Next.js) en **Supabase Edge Functions (Deno)** als backend (niet Node.js). OpenCV is niet beschikbaar in Deno, dus we implementeren alle image processing met Canvas API client-side en AI-gestuurde OCR server-side.

## Overzicht

Een complete "CD Matrix Enhancer" feature met:
- Multi-stage image enhancement pipeline
- Interactieve parameter tuning met live preview
- OCR via AI (Gemini) voor matrix tekst extractie
- Before/after vergelijking slider
- Stepper UI: Upload → Enhance → Review → OCR → Save

## Technische Implementatie

### 1. Image Processing Pipeline (Client-side)

Uitbreiding van `src/utils/clientImagePreprocess.ts`:

```text
INPUT IMAGE
    │
    ▼
┌──────────────────────────────────────────────────┐
│ 1. Luminance-weighted Grayscale                  │
│    gray = 0.2126*R + 0.7152*G + 0.0722*B         │
└──────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────┐
│ 2. Highlight Suppression                         │
│    - Detect top 2-5% luminance (percentile)      │
│    - Apply tone mapping rolloff                  │
│    - Strength: 0-100 (default: 50)               │
└──────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────┐
│ 3. CLAHE (Contrast Limited Adaptive Histogram)   │
│    - clipLimit: 1-5 (default: 2.0)               │
│    - tileGridSize: 8/16/24 (default: 16)         │
│    - Pure Canvas implementation                  │
└──────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────┐
│ 4. Bilateral-like Denoise                        │
│    - Edge-preserving smoothing                   │
│    - Reduces rainbow noise                       │
└──────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────┐
│ 5. Unsharp Mask                                  │
│    - radius: 0.3-1.2 (default: 0.7)              │
│    - amount: 0-2 (default: 1.0)                  │
│    - Edge-aware application                      │
└──────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────┐
│ 6. Radial Gradient Removal                       │
│    - Estimate illumination field                 │
│    - Subtract and normalize                      │
└──────────────────────────────────────────────────┘
    │
    ├──────────────────┐
    ▼                  ▼
┌────────────┐   ┌────────────────────────────────┐
│ ENHANCED   │   │ OCR LAYER                      │
│ PREVIEW    │   │ - Adaptive threshold (Gaussian)│
│ (grayscale)│   │ - blockSize: 11-51 odd         │
│            │   │ - C: -10 to +10                 │
└────────────┘   │ - Also create inverted version │
                └────────────────────────────────┘
```

### 2. Nieuwe Filter Functies

```typescript
// CLAHE - lokaal contrast zonder overloss
export function applyCLAHE(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    clipLimit?: number;      // 1-5, default 2.0
    tileGridSize?: number;   // 8, 16, 24, default 16
  }
): void;

// Highlight suppression
export function applyHighlightSuppression(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number  // 0-100, default 50
): void;

// Unsharp mask
export function applyUnsharpMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    radius?: number;   // 0.3-1.2, default 0.7
    amount?: number;   // 0-2, default 1.0
  }
): void;

// Radial gradient removal
export function removeRadialGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void;

// Gaussian adaptive threshold
export function applyGaussianAdaptiveThreshold(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    blockSize?: number;  // 11-51 odd, default 31
    C?: number;          // -10 to +10, default 5
  }
): ImageData;

// Full pipeline with all parameters
export interface MatrixEnhancementParams {
  claheClipLimit: number;
  claheTileSize: number;
  highlightStrength: number;
  unsharpRadius: number;
  unsharpAmount: number;
  adaptiveBlockSize: number;
  adaptiveC: number;
}

export async function processMatrixImage(
  input: File | string,
  params: MatrixEnhancementParams
): Promise<{
  enhancedPreview: string;
  ocrLayer: string;
  ocrLayerInverted: string;
  roi: { detected: boolean; cx: number; cy: number; innerR: number; outerR: number } | null;
  processingTime: number;
}>;
```

### 3. Ring Detection (Hough-like)

```typescript
// Verbeterde ring detectie met meerdere methodes
export function detectMatrixRing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): {
  detected: boolean;
  center: { x: number; y: number };
  innerRadius: number;
  outerRadius: number;
  confidence: number;
  method: 'hub' | 'edge' | 'gradient' | 'fallback';
};
```

### 4. Database Schema

Nieuwe tabel `matrix_scans`:

```sql
CREATE TABLE matrix_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Images
  original_image_url TEXT NOT NULL,
  enhanced_image_url TEXT,
  ocr_layer_url TEXT,
  
  -- OCR Results
  ocr_text_raw TEXT,
  ocr_text_clean TEXT,
  ocr_confidence NUMERIC,
  ocr_layer_used TEXT, -- 'normal' or 'inverted'
  
  -- Processing Parameters
  params_json JSONB DEFAULT '{}',
  roi_json JSONB, -- Ring detection result
  
  -- Timings
  processing_time_ms INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending',
  error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE matrix_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans" ON matrix_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON matrix_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans" ON matrix_scans
  FOR UPDATE USING (auth.uid() = user_id);
```

### 5. Edge Function: `matrix-ocr`

```typescript
// supabase/functions/matrix-ocr/index.ts

// Input: enhanced image + OCR layer image
// Output: extracted text + confidence

const ocrPrompt = `
You are an expert OCR system for CD matrix numbers.

TASK: Extract ALL text from this CD inner ring image.

WHITELIST CHARACTERS: A-Z 0-9 - / . ( ) + space

COMMON PATTERNS:
- IFPI codes: "IFPI LXXXX" or "IFPI XX###"
- Catalog numbers: label prefix + numbers
- Matrix/stamper codes: alphanumeric sequences

COMMON OCR FIXES to apply:
- O ↔ 0 (letter O vs zero)
- I ↔ 1 (letter I vs one)
- S ↔ 5
- B ↔ 8
- Z ↔ 2

OUTPUT JSON:
{
  "raw_text": "exact text as seen",
  "clean_text": "text with likely corrections applied",
  "segments": [
    { "text": "IFPI L123", "type": "ifpi", "confidence": 0.95 },
    { "text": "538 972-2", "type": "catalog", "confidence": 0.88 }
  ],
  "overall_confidence": 0.91
}

IMPORTANT: Never hallucinate. If text is unreadable, set confidence low.
`;
```

### 6. UI Components

**Nieuwe pagina: `/cd-matrix-enhancer`**

Stepper flow:
1. **Upload** - Drag/drop zone met camera optie
2. **Auto Enhance** - Progress indicator + preview
3. **Review** - Before/after slider + parameter tuning
4. **OCR Result** - Tekst met confidence + copy button
5. **Save** - Opslaan naar database

**Nieuwe components:**

```text
src/components/matrix-enhancer/
├── MatrixEnhancerPage.tsx       # Main page
├── MatrixUploadStep.tsx         # Step 1: Upload
├── MatrixProcessingStep.tsx     # Step 2: Auto process
├── MatrixReviewStep.tsx         # Step 3: Review + tune
├── MatrixOCRResult.tsx          # Step 4: OCR output
├── MatrixParameterControls.tsx  # Tuning sliders
├── MatrixBeforeAfterSlider.tsx  # Comparison slider
├── MatrixDebugAccordion.tsx     # Debug info
└── index.ts                     # Barrel export
```

**Parameter Controls UI:**

| Parameter | Type | Range | Default |
|-----------|------|-------|---------|
| CLAHE clipLimit | Slider | 1-5 | 2.0 |
| CLAHE tileGridSize | Select | 8/16/24 | 16 |
| Highlight Suppression | Slider | 0-100 | 50 |
| Unsharp Radius | Slider | 0.3-1.2 | 0.7 |
| Unsharp Amount | Slider | 0-2.0 | 1.0 |
| Adaptive Block Size | Slider | 11-51 (odd) | 31 |
| Adaptive C | Slider | -10 to +10 | 5 |

### 7. Before/After Slider

```typescript
// Interactieve slider met draggable divider
<MatrixBeforeAfterSlider
  beforeImage={originalImage}
  afterImage={enhancedImage}
  initialPosition={50}
  onPositionChange={(pos) => console.log(pos)}
/>
```

### 8. API Routes (Edge Functions)

| Method | Path | Doel |
|--------|------|------|
| POST | `/functions/v1/matrix-scan-create` | Create scan + upload original |
| POST | `/functions/v1/matrix-scan-process` | Run pipeline + persist outputs |
| GET | `/functions/v1/matrix-scan/:id` | Get results + URLs |
| POST | `/functions/v1/matrix-ocr` | Run OCR on enhanced image |

### 9. Performance Optimizations

- **Web Workers**: Zware Canvas operaties in worker thread
- **Debounced reprocessing**: 300ms debounce op parameter changes
- **Caching**: Intermediate results in memory tijdens tuning
- **Target**: Reprocessing < 2s voor typische images

## Bestanden

| Actie | Bestand |
|-------|---------|
| Wijzigen | `src/utils/clientImagePreprocess.ts` - Nieuwe filters |
| Nieuw | `src/utils/matrixEnhancementPipeline.ts` - Full pipeline |
| Nieuw | `src/pages/CDMatrixEnhancer.tsx` - Main page |
| Nieuw | `src/components/matrix-enhancer/MatrixUploadStep.tsx` |
| Nieuw | `src/components/matrix-enhancer/MatrixProcessingStep.tsx` |
| Nieuw | `src/components/matrix-enhancer/MatrixReviewStep.tsx` |
| Nieuw | `src/components/matrix-enhancer/MatrixOCRResult.tsx` |
| Nieuw | `src/components/matrix-enhancer/MatrixParameterControls.tsx` |
| Nieuw | `src/components/matrix-enhancer/MatrixBeforeAfterSlider.tsx` |
| Nieuw | `src/components/matrix-enhancer/MatrixDebugAccordion.tsx` |
| Nieuw | `src/components/matrix-enhancer/index.ts` |
| Nieuw | `supabase/migrations/xxx_matrix_scans.sql` |
| Nieuw | `supabase/functions/matrix-ocr/index.ts` |
| Nieuw | `supabase/functions/matrix-scan-create/index.ts` |
| Nieuw | `supabase/functions/matrix-scan-process/index.ts` |
| Wijzigen | `src/App.tsx` - Route toevoegen |

## Quality & Safety

- **Geen hallucinatie**: OCR toont altijd confidence score
- **Deterministische processing**: Geen generatieve AI voor enhancement
- **Raw + clean output**: Beide versies altijd beschikbaar
- **Debug accordion**: Parameters, ROI, en timings voor developers

## Aanpak Integratie met Bestaande Code

De nieuwe feature hergebruikt:
- Bestaande `detectHubCenter()` functie (uitbreiden voor ring detection)
- Bestaande `adaptiveBinarize()` (uitbreiden met Gaussian variant)
- Bestaande Supabase storage bucket `vinyl_images`
- Bestaande auth context en usage tracking
