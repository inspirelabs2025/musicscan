

# Handmatig Invoerformulier Uitbreiden

## Wat verandert er

Het huidige "Handmatig zoeken" formulier in de scanner heeft alleen velden voor **Artiest**, **Album titel** en **Catalogusnummer**. Dit wordt uitgebreid met drie extra velden: **Jaartal**, **Land** en **Matrixnummer**, plus het bestaande catalogusnummer wordt hernoemd naar **Barcode**.

## Nieuwe velden

| Veld | Type | Placeholder | Verplicht |
|------|------|-------------|-----------|
| Artiest | Text | "Artiest" | Nee (maar minimaal 1 veld) |
| Album | Text | "Album titel" | Nee |
| Jaartal | Text/Number | "Bijv. 1996" | Nee |
| Land | Text | "Bijv. UK, Germany" | Nee |
| Matrixnummer | Text | "Matrix / runout inscriptie" | Nee |
| Barcode | Text | "Barcode (EAN/UPC)" | Nee |

Layout: Artiest + Album op 1 rij, Jaartal + Land op 1 rij, Matrix + Barcode op 1 rij. Alles in een 2-koloms grid op desktop, 1 kolom op mobiel.

## Technische Details

### Bestanden die aangepast worden:

1. **`src/components/scanner/ScannerManualSearch.tsx`**
   - Drie extra state-velden: `year`, `country`, `matrix`
   - Bestaand `catalogNumber` veld hernoemen naar `barcode`
   - Interface `onSearch` uitbreiden met extra parameters
   - 2-koloms grid layout voor alle velden
   - Labels toevoegen boven elk veld voor duidelijkheid

2. **`src/hooks/useUnifiedScan.ts`**
   - `searchManual` functie signatuur uitbreiden met `year`, `country`, `matrix`, `barcode`
   - Extra parameters doorgeven aan de `optimized-catalog-search` edge function

3. **`src/pages/UnifiedScanner.tsx`**
   - Geen wijzigingen nodig (de `onSearch` callback wordt automatisch bijgewerkt via de hook)

### Geen backend wijzigingen nodig
De `optimized-catalog-search` edge function accepteert al extra parameters. De extra velden helpen bij het filteren van Discogs-resultaten op de bestaande manier.

