# Plan: Matrix Code Extractie - GEÏMPLEMENTEERD ✅

## Probleem
De V2 scanner kreeg foutief de volledige cleanText (inclusief URLs en IFPI codes) als matrix code.

## Oplossing
Robuuste `extractPureMatrixCode()` functie toegevoegd in `CDMatrixEnhancer.tsx`:

1. **Layer 1**: Zoek segment met `type === 'matrix'`
2. **Layer 2**: Filter cleanText met regex:
   - Verwijder URLs (`www.*`, `http://`)
   - Verwijder IFPI codes
   - Verwijder landen (Germany, Netherlands)
   - Verwijder bedrijfsnamen (Sony, EMI, DADC)
3. **Layer 3**: Extract eerste valide alphanumerieke code (6+ karakters)

## Resultaat
| Input | Output |
|-------|--------|
| "WWW.MEGATMOTION.COM 3384732 60L0L9" | "3384732 60L0L9" |
| Segment type: "matrix" | Directe waarde |
