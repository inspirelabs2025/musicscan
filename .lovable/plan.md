
# Matrix Foto OCR Verbetering Plan

## Samenvatting
Een complete image preprocessing pipeline implementeren voor matrix/label foto's van LP's en CD's. De pipeline past specifieke optimalisaties toe afhankelijk van het mediatype voordat de afbeelding naar AI OCR wordt gestuurd.

## Probleemanalyse

### CD Matrix Foto's
- **Probleem**: Sterke lichtreflectie op het glanzende oppervlak
- **Gevolg**: AI kan gegraveerde tekst in de binnenring niet goed lezen
- **Oplossing**: Reflectie-normalisatie, contrast enhancement, edge detection

### LP Matrix Foto's  
- **Probleem**: Slechte leesbaarheid van tekst in dead wax/runout groove
- **Gevolg**: Gegraveerde/geëtste tekst is nauwelijks zichtbaar
- **Oplossing**: Reliëf-detectie, directional enhancement, noise reduction

## Architectuur

```text
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (AIScanV2.tsx)                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Upload foto's → Detecteer matrix/label foto index     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  preprocess-matrix-photo edge function                  │ │
│  │  (nieuwe edge function voor image preprocessing)        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│           preprocess-matrix-photo Edge Function              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT: imageUrl, mediaType ('vinyl' | 'cd')                 │
│                                                              │
│  ┌────────────────┐                                          │
│  │  1. RAW/JPG    │ ← Fetch image, decode to pixel buffer    │
│  │     Ingest     │                                          │
│  └───────┬────────┘                                          │
│          ↓                                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  2. REFLECTIE-NORMALISATIE (CD alleen)                 │  │
│  │     - Homomorphic filtering (log domain)               │  │
│  │     - Specular highlight detection & suppression       │  │
│  │     - Adaptive white balance                           │  │
│  └───────┬────────────────────────────────────────────────┘  │
│          ↓                                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  3. LOKAAL CONTRAST (CLAHE)                            │  │
│  │     - Tile-based histogram equalization                │  │
│  │     - Clip limit: 2.0-3.0                              │  │
│  │     - 8x8 tile grid                                    │  │
│  └───────┬────────────────────────────────────────────────┘  │
│          ↓                                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  4. RELIËF-DETECTIE                                    │  │
│  │     - Sobel edge detection (horizontal + vertical)     │  │
│  │     - Gradient magnitude calculation                   │  │
│  │     - LP: emphasis on groove edges                     │  │
│  └───────┬────────────────────────────────────────────────┘  │
│          ↓                                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  5. DIRECTIONAL ENHANCEMENT (LP alleen)                │  │
│  │     - Circular pattern detection                       │  │
│  │     - Radial gradient enhancement                      │  │
│  │     - Tangential text edge boosting                    │  │
│  └───────┬────────────────────────────────────────────────┘  │
│          ↓                                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  6. NOISE SUPPRESSION                                  │  │
│  │     - Bilateral filtering (edge-preserving)            │  │
│  │     - Median filter for salt-and-pepper noise          │  │
│  └───────┬────────────────────────────────────────────────┘  │
│          ↓                                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  7. BINARY + SOFT MASK                                 │  │
│  │     - Adaptive thresholding (Otsu's method)            │  │
│  │     - Soft mask blending (original + enhanced)         │  │
│  │     - Final sharpening pass                            │  │
│  └───────┬────────────────────────────────────────────────┘  │
│          ↓                                                   │
│  OUTPUT: Enhanced image as base64 (ready for OCR)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│              ai-photo-analysis-v2 Edge Function              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Receives preprocessed matrix image                    │ │
│  │  + original images for cover/back analysis             │ │
│  │  → Enhanced matrix OCR pass with better text detection │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Implementatie Details

### 1. Nieuwe Edge Function: `preprocess-matrix-photo`

**Locatie**: `supabase/functions/preprocess-matrix-photo/index.ts`

**Technologie**: ImageMagick WASM voor Deno (`imagemagick_deno`)

**Functies per mediatype**:

| Stap | CD | LP |
|------|----|----|
| Reflectie-normalisatie | ✅ Intensief | ⚪ Licht |
| CLAHE | ✅ clipLimit=2.5 | ✅ clipLimit=3.0 |
| Edge Detection | ✅ Sobel | ✅ Sobel + Laplacian |
| Directional Enhancement | ⚪ Niet nodig | ✅ Radiaal |
| Noise Suppression | ✅ Bilateral | ✅ Median |
| Binary Threshold | ✅ Otsu | ✅ Adaptive |

### 2. Update `ai-photo-analysis-v2`

**Wijzigingen**:
- Matrix pass (pass 3) ontvangt voorbewerkte afbeelding
- Dedicated prompt voor CD inner-ring vs LP dead wax
- Verbeterde confidence scoring gebaseerd op preprocessing kwaliteit

### 3. Frontend Integratie (AIScanV2.tsx)

**Flow**:
1. Gebruiker uploadt foto's
2. Identificeer matrix foto (foto 3 voor vinyl, foto 3/4 voor CD)
3. Verstuur matrix foto naar `preprocess-matrix-photo`
4. Ontvang enhanced base64 image
5. Vervang originele matrix foto in array
6. Stuur alle foto's (met enhanced matrix) naar `ai-photo-analysis-v2`

### 4. Preprocessing Parameters

**CD-specifieke settings**:
```text
- Reflectie threshold: 95% luminance
- Specular suppression: gaussian blur 5px radius op highlights
- CLAHE: clipLimit=2.5, tileGrid=8x8
- Sharpening: unsharp mask (amount=1.5, radius=1.0, threshold=0.02)
```

**LP-specifieke settings**:
```text
- Grayscale conversie eerst
- CLAHE: clipLimit=3.0, tileGrid=8x8
- Sobel edge: kernel 3x3
- Directional boost: radiale gradient 20% opacity blend
- Adaptive threshold: blockSize=11, C=2
```

## Bestanden die Worden Aangemaakt/Gewijzigd

### Nieuwe bestanden:
1. `supabase/functions/preprocess-matrix-photo/index.ts`
   - Nieuwe edge function voor image preprocessing
   - ImageMagick WASM integratie
   - Separate pipelines voor CD en LP

### Gewijzigde bestanden:
1. `supabase/functions/ai-photo-analysis-v2/index.ts`
   - Integratie met preprocessing function
   - Enhanced matrix prompts
   
2. `src/pages/AIScanV2.tsx`
   - Call preprocessing voor matrix foto's
   - Progress indicator voor preprocessing stap
   - Error handling voor preprocessing failures

3. `supabase/config.toml`
   - Nieuwe function registratie

## Technische Overwegingen

### ImageMagick WASM in Deno
- Gebruikt `imagemagick_deno` package
- Ondersteunt alle benodigde operaties (resize, blur, sharpen, edge detection)
- Performance: ~500ms-2s per afbeelding afhankelijk van grootte

### Fallback Strategie
Als preprocessing faalt:
1. Log error
2. Gebruik originele afbeelding
3. Scan doorgaat met standaard OCR

### Memory Management
- Max image size: 4096x4096 pixels
- Resize grotere afbeeldingen naar max dimensie
- Temp files opruimen na processing

## Fase 1 vs Fase 2

### Fase 1 (Dit Plan)
- Basis preprocessing pipeline
- CLAHE, edge detection, noise reduction
- Integratie in bestaande scan flow

### Fase 2 (Toekomstig)
- AI-gestuurde preprocessing (auto-detect beste parameters)
- Pattern inference voor onleesbare karakters
- Training data collectie voor ML model
