

## Extracted Fields in V2 Scanner Results

### What changes
Add a prominent "Geextraheerde velden" (Extracted Fields) section to the V2 scanner results, showing all data collected from the photos with confidence indicators -- similar to the CD Pipeline's `ExtractionFields` component.

### Current situation
The V2 scanner (`AIScanV2Results.tsx`) buries technical identifiers in a plain text list under "Technische Details". There are no confidence indicators, no "detected / not detected" status, and no visual feedback on what was found vs. what is missing.

### Plan

**1. Build extraction data from V2 results**

In `AIScanV2Results.tsx`, transform the existing result fields (barcode, matrix_number, catalog_number, sid_code_mastering, sid_code_mould, label_code, label, country, year, genre) into a structured extraction array that the `ExtractionFields` component can render.

Each field gets:
- **field name** (barcode, matrix, catno, ifpi_master, ifpi_mould, label_code, label, country, year, genre)
- **raw/normalized value** from the result
- **confidence** derived from: 1.0 if present + verified match, 0.8 if present but unverified, 0 if missing
- Status from the `collector_audit` log (rejected, verified, unverified)

**2. Add ExtractionFields section to results UI**

Place the extraction fields section directly after the confidence score and before the release information section. This makes the "what did we find in your photos" data the first thing the user sees.

**3. Reuse existing ExtractionFields component**

Import and use the existing `ExtractionFields` component from `src/components/scan-pipeline/ExtractionFields.tsx` -- no need to create a new component.

### Technical details

- File to edit: `src/components/scanner/AIScanV2Results.tsx`
- Import: `ExtractionFields` from `@/components/scan-pipeline/ExtractionFields`
- Import: `ScanExtraction` type from `@/hooks/useCDScanPipeline`
- Build a `buildExtractions(result, collectorAudit)` helper function that maps V2 result fields to `ScanExtraction[]`
- Parse the `collector_audit` entries to determine if fields were rejected/verified, adjusting confidence accordingly (rejected = 0.3, verified = 1.0)
- Render between the confidence score bar and the release information grid

