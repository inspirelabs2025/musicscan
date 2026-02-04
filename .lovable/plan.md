
# Plan: Fix Multi-File Upload Matrix Detection Bug

## Probleem Analyse

### Root Cause
Er is een **React state closure bug** in de file upload handler. Wanneer de gebruiker meerdere foto's tegelijk selecteert:

```text
User selecteert: ella1.jpeg, ella2.jpeg, ella3.jpeg, ella4.jpeg (4 files in één keer)
     │
     ├─ for (file of files) loop start
     │
     ├─ File 1: uploadedFiles.length = 0 (state nog niet geüpdatet)
     │   └─ isConventionalMatrixPosition = (0 === 2) = FALSE ❌
     │   └─ Visual detection: confidence 75% → Matrix Enhancer START
     │
     ├─ File 2: uploadedFiles.length = 0 (nog steeds!)
     │   └─ isConventionalMatrixPosition = (0 === 2) = FALSE ❌
     │   └─ Visual detection: confidence 100% → Matrix Enhancer OVERSCHRIJFT ⚠️
     │
     ├─ File 3: uploadedFiles.length = 0 (nog steeds!)
     │   └─ isConventionalMatrixPosition = (0 === 2) = FALSE ❌
     │   └─ Visual detection: confidence 40% → Matrix Enhancer OVERSCHRIJFT ⚠️
     │
     └─ React batch update: uploadedFiles.length wordt nu pas 4
```

De `uploadedFiles.length` waarde in de callback is **stale** (uit de closure), waardoor:
1. Position-based detectie NOOIT werkt (currentFileCount is altijd de oude waarde)
2. Visual detection kan triggeren voor ALLE foto's
3. De LAATSTE foto die door visual detection komt overschrijft de matrix promise

### Bewijs uit Logs

```
matrix-ocr: "SUMCD 4164" (ella1 of ella2 - catalogusnummer)
matrix-ocr: "2NWCD 4TEA" (ella3 of ella4 - verkeerde matrix)
matrix-discogs-lookup: Zoekt op "2NWCD 4TEA" → Vindt verkeerde CD!
```

## Oplossing: Track File Index in Batch

Gebruik een **lokale counter** binnen de for-loop om de correcte positie te bepalen:

### Code Wijziging

```typescript
const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  
  // Track starting count + index within this batch
  const startingCount = uploadedFiles.length;
  let processedInBatch = 0;
  let batchMatrixFound = false; // Prevent multiple matrix detections in same batch
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const id = Math.random().toString(36).substr(2, 9);
      const fileIndexInTotal = startingCount + processedInBatch;
      processedInBatch++;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        // ... add file logic ...
        
        // For CD media type, detect matrix photo
        if (mediaType === 'cd' && !matrixFileId && !batchMatrixFound) {
          // Strategy 1: Position-based (3rd photo = index 2)
          const isConventionalMatrixPosition = fileIndexInTotal === 2;
          
          if (isConventionalMatrixPosition) {
            batchMatrixFound = true; // Prevent other files from also triggering
            console.log(`📍 Position-based matrix detection: file at index ${fileIndexInTotal}`);
            setMatrixFileId(id);
            // ... start processing ...
          } else if (!batchMatrixFound) {
            // Strategy 2: Visual detection as fallback (only if position-based didn't trigger)
            // ... visual detection ...
          }
        }
      };
    }
  }
}, [mediaType, matrixFileId, startBackgroundProcessing, uploadedFiles.length]);
```

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/pages/AIScanV2.tsx` | Fix batch upload index tracking + prevent multiple matrix detections |

## Data Flow Na Fix

```text
User selecteert: ella1.jpeg, ella2.jpeg, ella3.jpeg, ella4.jpeg
     │
     ├─ startingCount = 0, processedInBatch = 0
     │
     ├─ File 1: fileIndexInTotal = 0
     │   └─ isConventionalMatrixPosition = (0 === 2) = FALSE
     │   └─ Visual detection skipped (wacht op positie 2)
     │
     ├─ File 2: fileIndexInTotal = 1
     │   └─ isConventionalMatrixPosition = (1 === 2) = FALSE
     │   └─ Visual detection skipped
     │
     ├─ File 3: fileIndexInTotal = 2 ✅
     │   └─ isConventionalMatrixPosition = (2 === 2) = TRUE ✅
     │   └─ batchMatrixFound = true
     │   └─ Matrix Enhancer gestart voor correcte foto
     │
     └─ File 4: fileIndexInTotal = 3
         └─ batchMatrixFound = true → SKIP (al gevonden)
```

## Extra Safeguard

Voeg ook een check toe om te voorkomen dat de matrix promise wordt overschreven:

```typescript
// Only start if no processing is already running
if (!matrixProcessingPromiseRef.current) {
  const processingPromise = startBackgroundProcessing(file, {
    skipDetection: true,
    confidenceThreshold: 0.5
  });
  matrixProcessingPromiseRef.current = processingPromise;
}
```

## Verwachte Resultaat

Na deze fix:
1. Bij 4-foto upload wordt ALLEEN foto 3 (index 2) door de Matrix Enhancer verwerkt
2. De correcte matrix "SUMCD 4164" wordt gelezen
3. De Discogs lookup vindt "Ella Fitzgerald - Portrait"
4. De merge met ai-photo-analysis-v2 gebruikt de correcte data
