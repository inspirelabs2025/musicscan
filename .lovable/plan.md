
# Plan: IFPI Code Detectie Verbeteren voor Kleine Binnenste Ring Tekst

## Probleem Analyse
De IFPI code bevindt zich op de **allerkleinste binnenste ring** (boven "Germany" tekst), en de letters zijn:
- Veel kleiner dan de matrix/catalogusnummers
- Mogelijk gestampt/embossed in plaats van gegraveerd
- In een zeer klein gebied dicht bij het centergat

Huidige IFPI ring crop: 8-40% radius met 3x zoom - dit is te breed en zoomt niet genoeg in op het specifieke IFPI gebied.

## Technische Oplossing

### 1. Nieuwe "Super-Zoom IFPI" Crop Toevoegen
Maak een extra, veel agressievere zoom specifiek voor de binnenste IFPI-zone:

| Parameter | Huidige IFPI Crop | Nieuwe Super-Zoom |
|-----------|-------------------|-------------------|
| Inner radius | 8% | 3% (dichter bij centergat) |
| Outer radius | 40% | 15% (alleen binnenste ring) |
| Zoom factor | 3.0x | 5.0x (veel agressiever) |
| Unsharp radius | 0.4 | 0.3 (scherper voor kleine tekst) |
| Unsharp amount | 1.5 | 2.0 (sterker contrast) |

### 2. Contrast Versterking voor Gestampte Tekst
Gestampte/embossed tekst is vaak alleen zichtbaar door subtiele schaduwen. Toevoegen:
- Extra CLAHE pass met hogere clip limit (3.5)
- Directional shadow enhancement voor embossed tekst
- Inverted versie voor lichte tekst op donkere achtergrond

### 3. Bestandswijzigingen

**`src/utils/matrixEnhancementPipeline.ts`:**
- Nieuwe functie `createSuperZoomIfpiCrop()` toevoegen
- Extra output velden: `superZoomIfpi` en `superZoomIfpiEnhanced`
- Speciale embossed-text enhancement filter

**`supabase/functions/matrix-ocr/index.ts`:**
- Super-zoom afbeeldingen accepteren en prioriteit geven
- OCR prompt aanpassen om naar zeer kleine tekst te zoeken

**`src/pages/CDMatrixEnhancer.tsx`:**
- Super-zoom data meesturen naar OCR functie

**`src/components/matrix-enhancer/MatrixReviewStep.tsx`:**
- Nieuwe tab "🔬 Super Zoom IFPI" toevoegen voor preview

### 4. Verbeterde OCR Prompt
Specifieke instructies voor de AI om te zoeken naar:
- Zeer kleine tekst (< 2mm hoog)
- Gestampte/embossed karakters met subtiele schaduwen
- IFPI formaat: "IFPI L" + 3 tekens OF "IFPI" + 4 tekens
- Tekst die BOVEN andere tekst staat (zoals "Germany")

## Verwacht Resultaat
- 5x zoom op de binnenste 3-15% van de disc
- Geoptimaliseerde filters voor embossed/gestampte tekst
- Aparte preview tab om de super-zoom te controleren
- Betere kans op IFPI detectie door focus op juiste gebied

## Implementatie Volgorde
1. Super-zoom crop functie in pipeline
2. UI preview tab toevoegen
3. Edge function updaten met nieuwe afbeeldingen
4. OCR prompt verfijnen
5. Testen en fine-tunen
