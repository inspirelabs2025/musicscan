
# Plan: Matrix Enhancer Integratie in Normale Upload Flow

## Doel

Wanneer een gebruiker meerdere foto's uploadt (hoes, achterkant, matrix, barcode), wordt de matrix foto automatisch gedetecteerd en door de Matrix Enhancer pipeline gestuurd. De resultaten worden gecombineerd met OCR van de andere foto's voor een 100% match score.

## Huidige Architectuur

```text
Normale Flow (AIScanV2)              Matrix Enhancer (Standalone)
─────────────────────────           ────────────────────────────
Upload 4 foto's                     Upload 1 matrix foto
     ↓                                    ↓
ai-photo-analysis-v2                processMatrixImage() [client]
  ├─ Pass 1: General OCR                  ↓
  ├─ Pass 2: Details                matrix-ocr [edge function]
  └─ Pass 3: Matrix (basic)               ↓
     ↓                              matrix-discogs-lookup [edge]
searchDiscogsV2()                         ↓
     ↓                              ✅ Catalog + Artist + Title
⚠️ Matrix OCR is ZWAK
```

**Probleem**: De basic matrix OCR in ai-photo-analysis-v2 mist de geavanceerde ring-crops, CLAHE, en super-zoom die de Matrix Enhancer wél heeft.

## Oplossing: Parallel Processing Pipeline

```text
Upload 4 foto's
     │
     ├─────────────────────────────────────────────┐
     ↓                                             ↓
[PARALLEL 1]                               [PARALLEL 2]
Detecteer matrix foto                      Andere foto's
(isMatrixPhoto())                          (hoes, barcode, etc.)
     ↓                                             ↓
processMatrixImage()                       ai-photo-analysis-v2
[client-side enhancer]                     (general + details passes)
     ↓                                             ↓
matrix-ocr                                 Artist, Title, Barcode
     ↓                                     Catalog (from hoes)
matrix-discogs-lookup                              │
     ↓                                             │
Matrix, IFPI, Discogs match                        │
     │                                             │
     └──────────────┬──────────────────────────────┘
                    ↓
            MERGE RESULTS
     ┌──────────────┴──────────────┐
     │  • Matrix Enhancer:         │
     │    - Matrix number ✅        │
     │    - IFPI codes ✅           │
     │    - Discogs ID (if found)  │
     │  • Cover OCR:               │
     │    - Artist ✅               │
     │    - Title ✅                │
     │    - Catalog ✅              │
     │  • Barcode OCR:             │
     │    - Barcode ✅              │
     └──────────────┬──────────────┘
                    ↓
         Cross-Validate & Score
                    ↓
         100% Confidence Match
```

## Technische Implementatie

### Stap 1: Matrix Foto Detectie (Client-side)

**Nieuw bestand**: `src/utils/matrixPhotoDetector.ts`

Detecteert of een foto een CD matrix foto is door:
- Hub hole detectie (donkere cirkel in midden)
- Regenboog reflectie detectie (hoge kleurvariatie)
- Circulaire structuur herkenning

```typescript
export function detectMatrixPhoto(file: File): Promise<{
  isMatrix: boolean;
  confidence: number;
  features: {
    hasHubHole: boolean;
    hasRainbowReflection: boolean;
    hasCircularStructure: boolean;
  };
}>;
```

### Stap 2: Parallel Processing Hook

**Nieuw bestand**: `src/hooks/useParallelMatrixProcessing.ts`

Hook die:
- Matrix foto detecteert bij upload
- processMatrixImage() start in achtergrond
- matrix-ocr aanroept
- matrix-discogs-lookup aanroept
- Resultaten merged met andere analyses

```typescript
export function useParallelMatrixProcessing() {
  const [matrixResult, setMatrixResult] = useState<MatrixProcessingResult | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [discogsResult, setDiscogsResult] = useState<DiscogsLookupResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processMatrixPhotoInBackground = async (file: File) => {
    // 1. Run full matrix enhancement pipeline (client)
    // 2. Call matrix-ocr edge function
    // 3. Call matrix-discogs-lookup edge function
    // 4. Return merged results
  };
  
  return { matrixResult, ocrResult, discogsResult, isProcessing, processMatrixPhotoInBackground };
}
```

### Stap 3: AIScanV2 Integratie

**Wijzigen**: `src/pages/AIScanV2.tsx`

Bij foto upload:
1. Detecteer welke foto de matrix foto is
2. Start Matrix Enhancer pipeline parallel aan normale upload
3. Wacht op beide resultaten
4. Merge resultaten voor final Discogs lookup

```typescript
const handleFileUpload = async (files: File[]) => {
  // Detecteer matrix foto
  for (const file of files) {
    const detection = await detectMatrixPhoto(file);
    if (detection.isMatrix && detection.confidence > 0.7) {
      // Start background processing
      processMatrixPhotoInBackground(file);
    }
  }
  
  // ... bestaande upload logica ...
};

const startAnalysis = async () => {
  // Wacht op beide: normale analyse + matrix enhancer
  const [normalResult, matrixEnhanced] = await Promise.all([
    invokeAiPhotoAnalysisV2(...),
    waitForMatrixResult()
  ]);
  
  // Merge resultaten
  const mergedResult = mergeAnalysisResults(normalResult, matrixEnhanced);
};
```

### Stap 4: Edge Function Update

**Wijzigen**: `supabase/functions/ai-photo-analysis-v2/index.ts`

Accepteer pre-enhanced matrix data:

```typescript
interface AnalysisRequest {
  photoUrls: string[]
  mediaType: 'vinyl' | 'cd'
  conditionGrade: string
  prefilledMatrix?: string
  prefilledIfpiCodes?: string[]
  // NIEUW: Enhanced matrix data van client-side processing
  enhancedMatrixData?: {
    matrixNumber: string;
    ifpiCodes: string[];
    discogsId?: number;
    discogsUrl?: string;
    artist?: string;
    title?: string;
    catalogNumber?: string;
    matchConfidence?: number;
  }
}
```

## Bestanden te Wijzigen/Creëren

| Bestand | Actie | Beschrijving |
|---------|-------|--------------|
| `src/utils/matrixPhotoDetector.ts` | **Nieuw** | Detecteert matrix foto's via hub/reflection analyse |
| `src/hooks/useParallelMatrixProcessing.ts` | **Nieuw** | Hook voor achtergrond matrix processing |
| `src/pages/AIScanV2.tsx` | Wijzigen | Integreer parallel processing bij upload |
| `supabase/functions/ai-photo-analysis-v2/index.ts` | Wijzigen | Accept enhanced matrix data, merge in result |

## Data Flow na Implementatie

```text
User Upload: 4 foto's (hoes, achterkant, matrix, barcode)
     │
     ↓ detectMatrixPhoto() op elke foto
     │
     ├─ Foto 3 = Matrix detected (confidence: 0.85)
     │
     ├─────────────────┬─────────────────────────┐
     ↓                 ↓                         ↓
[Matrix Enhancer]  [Normal Upload]         [UI Feedback]
processMatrixImage  uploadToSupabase       "Matrix processing..."
     ↓                 ↓
matrix-ocr         ai-photo-analysis-v2
     ↓             (general + details)
matrix-discogs-lookup    ↓
     ↓             Artist: Texas
Matrix: CPG1996002 Title: Greatest Hits
IFPI: L028, 94A1   Catalog: 538 194-2
Discogs: 2610353        ↓
     │                   │
     └────────┬──────────┘
              ↓
       MERGE & VALIDATE
         ↓
┌─────────────────────────────────┐
│ Artist: Texas          ✅ Match │
│ Title: Greatest Hits   ✅ Match │
│ Catalog: 538 194-2     ✅ Match │
│ Matrix: CPG1996002     ✅ OCR   │
│ IFPI: L028, 94A1       ✅ OCR   │
│ Discogs ID: 2610353    ✅ Found │
│ Confidence: 98%        🎯       │
└─────────────────────────────────┘
```

## Voordelen

1. **Betere Matrix OCR**: Gebruikt de geavanceerde ring-crops en CLAHE van Matrix Enhancer
2. **Cross-Validatie**: Matrix-found Discogs ID wordt gevalideerd tegen hoes OCR
3. **Parallel Processing**: Geen extra wachttijd door achtergrond verwerking
4. **Fallback**: Als Matrix Enhancer faalt, werkt normale flow nog steeds
5. **100% Automatisch**: Geen handmatige stappen nodig - volledig geautomatiseerd
