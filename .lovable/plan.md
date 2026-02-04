
# Plan: Verwijder Extreme Modus uit AIScanV2

## Wat wordt verwijderd

De Extreme Modus feature werkt niet naar behoren en wordt volledig verwijderd uit de scanner.

### Te verwijderen elementen

**State variabelen:**
- `extremeMode` useState
- `extremeEnhancementResult` useState  
- `isProcessingExtreme` useState

**Imports:**
- `ExtremeEnhancementPreview` component import
- `extremeMatrixEnhancement` functie import
- `ExtremeEnhancementResult` type import

**useEffect logica:**
- Het hele `if (mediaType === 'cd' && extremeMode)` blok dat extreme enhancement uitvoert
- `extremeMode` uit de dependency array

**UI elementen:**
- De hele oranje Card met "Extreme Modus" toggle (lijnen ~517-607)
- De Switch component
- De preview Cards voor processing en result

### Wat blijft behouden

De **Matrix Enhancer link** wordt behouden maar verplaatst naar een nettere plek onder de CDPhotoTips:

```tsx
{mediaType === 'cd' && (
  <div className="space-y-4">
    <CDPhotoTips />
    
    {/* Directe link naar Matrix Enhancer */}
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-4">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => navigate('/cd-matrix-enhancer')}
        >
          <Sparkles className="h-4 w-4" />
          Open Matrix Enhancer (Geavanceerd)
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Handmatige tuning voor moeilijke CD foto's
        </p>
      </CardContent>
    </Card>
  </div>
)}
```

## Bestanden

| Actie | Bestand |
|-------|---------|
| Wijzigen | `src/pages/AIScanV2.tsx` - Verwijder extreme mode code, behoud Matrix Enhancer link |

## Resultaat

- Schonere code zonder niet-werkende feature
- Matrix Enhancer blijft toegankelijk via duidelijke link
- Geen verwarrende "Extreme Modus" toggle meer voor gebruikers
