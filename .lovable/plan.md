
# Plan: Duidelijke Scheiding Matrix / IFPI / Extra Info

## Analyse Huidige Problemen

| Wat de AI stuurt | Wat de UI toont | Probleem |
|------------------|-----------------|----------|
| type: "other" | "Onbekend" | UI kent "other" niet |
| type: "catalog" | "Catalogusnummer" | Verwarrende naam |
| URL als "unknown" | "Onbekend" | AI classificeert verkeerd |

## Oplossing: 3 Duidelijke Categorieën

```text
┌─────────────────────────────────────────────────────────┐
│  📀 MATRIX NUMMER                                       │
│  ═══════════════                                        │
│  • Alphanumerieke code voor pressing identificatie      │
│  • Voorbeelden: "3384732 02 1", "DESCD09", "519 613-2"  │
│  • ALLEEN cijfers, letters, spaties, streepjes         │
│  • Meestal 8-15 karakters                               │
├─────────────────────────────────────────────────────────┤
│  🔢 IFPI CODE                                           │
│  ═══════════                                            │
│  • MOET beginnen met "IFPI"                             │
│  • Formaten: "IFPI XXXX" of "IFPI LXXX"                │
├─────────────────────────────────────────────────────────┤
│  ℹ️  EXTRA INFO                                         │
│  ══════════                                             │
│  • URLs: www.megatmotion.com                            │
│  • Landen: Made in Germany                              │
│  • Bedrijven: Sony DADC, Sonopress                      │
│  • NIET belangrijk voor identificatie                   │
└─────────────────────────────────────────────────────────┘
```

## Technische Wijzigingen

### 1. UI Component Update (`MatrixOCRResult.tsx`)

Aanpassen van de type definities en labels:

- Type enum uitbreiden: `'ifpi' | 'matrix' | 'other'`
- Verwijderen van verwarrende "catalog" - vervangen door "matrix"
- Toevoegen van "other" (Extra Info) met grijs/neutraal badge
- Labels:
  - `matrix` → "Matrix Nummer" (groen badge)
  - `ifpi` → "IFPI Code" (blauw badge)  
  - `other` → "Extra Info" (grijs badge)

### 2. Edge Function Prompt (`matrix-ocr/index.ts`)

Versimpelen en verduidelijken van de classificatie:

- Type "catalog" vervangen door "matrix" voor consistentie
- Strengere regels voor wat WEL en NIET een matrix nummer is
- Expliciet vermelden dat URLs ALTIJD "other" zijn
- Toevoegen van lengte-check hint (matrix = meestal 8+ karakters)

### 3. Verbeterde OCR Prompt Structuur

```
## MATRIX NUMMER (type: "matrix")
✅ Alphanumeriek, 8-15 karakters
✅ Bevat vaak spaties of streepjes
✅ Voorbeelden: "3384732 02 1", "519 613-2 04"

❌ GEEN URLs
❌ GEEN woorden (Germany, Sony)
❌ GEEN korte codes (<6 tekens)

## IFPI CODE (type: "ifpi")  
✅ MOET starten met "IFPI"
✅ Dan 4-5 karakters

## EXTRA INFO (type: "other")
Alles wat niet matrix of IFPI is
```

## Bestanden te Wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/components/matrix-enhancer/MatrixOCRResult.tsx` | Type definities + labels updaten |
| `supabase/functions/matrix-ocr/index.ts` | Prompt versimpelen, "catalog"→"matrix" |

## Verwacht Resultaat

Na implementatie ziet de UI er zo uit:

```
┌────────────────────────────────────────┐
│ 🟢 Matrix Nummer         95%          │
│    3384732 02 1                        │
├────────────────────────────────────────┤
│ 🔵 IFPI Code             90%          │
│    IFPI L028                           │
├────────────────────────────────────────┤
│ ⚪ Extra Info            80%          │
│    www.megatmotion.com                 │
├────────────────────────────────────────┤
│ ⚪ Extra Info            85%          │
│    Made in Germany                     │
└────────────────────────────────────────┘
```

## Implementatie Volgorde

1. UI types aanpassen (matrix, ifpi, other)
2. Labels en badges updaten  
3. Edge function prompt versimpelen
4. Type "catalog" → "matrix" in alle responses
5. Testen met dezelfde CD
