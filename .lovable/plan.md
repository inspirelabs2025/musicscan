
# Plan: Strikte Barcode/Catno Verificatie met OCR Behoud - ✅ VOLTOOID

## Geïmplementeerde Wijzigingen

### 1. Matrix Enhancer Verificatie (regel 1279-1368)
- Enhanced matrix matches worden nu **geverifieerd** tegen barcode/catno
- Alleen als barcode OF catno exact matcht wordt de match geaccepteerd
- Anders valt het door naar de standaard zoekstrategie

### 2. Database Opslaan - OCR Behoud (regel 342-395)
- Bij `NO_EXACT_MATCH`: OCR data wordt **altijd behouden**
- Bij `EXACT_MATCH`: Discogs metadata wordt gebruikt (geverifieerd)
- Scan status: `completed` voor matches, `no_exact_match` voor geen match

### 3. NO_EXACT_MATCH Return Object (regel 1618-1641)
- Nieuw `ocrData` veld met alle gescande gegevens:
  - barcode, catalogNumber, artist, title, label, matrixNumber

## Verwacht Gedrag

| Scenario | Gedrag |
|----------|--------|
| Ella Fitzgerald (SUMCD 4164) | `NO_EXACT_MATCH` + OCR behouden |
| CD met exacte barcode match | `EXACT_MATCH` + Discogs data |
| Matrix match zonder barcode/catno verificatie | Doorvallen naar zoekstrategie |

## Kernregel
**"Discogs metadata mag OCR NOOIT overschrijven zonder exacte barcode of catalogusnummer verificatie."**
