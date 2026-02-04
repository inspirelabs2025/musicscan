
# Plan: Matrix Nummer Verificatie Systeem

## Overzicht
Een verplichte verificatie-stap toevoegen na de AI analyse waarbij gebruikers het herkende matrix nummer kunnen bevestigen of corrigeren voordat het definitief wordt opgeslagen.

## Waarom Dit Nodig Is
- Matrix nummers zijn cruciaal voor exacte release identificatie op Discogs
- OCR op gegraveerde/geëtste tekst is foutgevoelig (reflecties, slijtage)
- Karakters zoals O/0, I/1, S/5 worden vaak verwisseld
- 100% nauwkeurigheid verhoogt de match-kwaliteit aanzienlijk

## Gebruikerservaring

### Nieuwe Flow
```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Upload Foto's                                            │
│ 2. AI Analyse (multi-pass)                                  │
│ 3. ★ NIEUW: Matrix Verificatie Stap ★                       │
│    ┌─────────────────────────────────────────────────┐     │
│    │ 🔢 Bevestig Matrix Nummer                        │     │
│    │                                                   │     │
│    │ Herkend: [5][3][8][ ][9][7][2][-][2]            │     │
│    │          ▲groen  ▲geel   ▲rood                   │     │
│    │                                                   │     │
│    │ ⚠️ "9" is onzeker (72%) - Klik om te corrigeren │     │
│    │                                                   │     │
│    │ Correcties: [0] [O] [Q] [anders...]             │     │
│    │                                                   │     │
│    │ [Bevestigen & Doorgaan]  [Overslaan]            │     │
│    └─────────────────────────────────────────────────┘     │
│ 4. Discogs Resultaten + Prijzen                             │
│ 5. Toevoegen aan Collectie                                  │
└─────────────────────────────────────────────────────────────┘
```

## Technische Implementatie

### Fase 1: Backend - Karakter-niveau Confidence

**Bestand: `supabase/functions/ai-photo-analysis-v2/index.ts`**

Uitbreiden van de matrix analysis response om per-karakter confidence te retourneren:

```json
{
  "matrixNumber": "538 972-2",
  "matrixCharacters": [
    { "char": "5", "confidence": 0.95, "alternatives": ["S"] },
    { "char": "3", "confidence": 0.98, "alternatives": [] },
    { "char": "8", "confidence": 0.92, "alternatives": ["B"] },
    { "char": " ", "confidence": 1.0, "alternatives": [] },
    { "char": "9", "confidence": 0.72, "alternatives": ["0", "O", "Q"] },
    ...
  ],
  "overallConfidence": 0.89,
  "needsVerification": true
}
```

Wijzigingen:
- Nieuwe prompt instructie voor karakter-niveau output
- Parsing van response naar gestructureerd format
- `needsVerification` flag als confidence < 0.9

### Fase 2: Nieuwe Component - MatrixVerificationStep

**Nieuw bestand: `src/components/scanner/MatrixVerificationStep.tsx`**

Component met:
- Visuele weergave van elk karakter met kleurcodering
- Klikbare onzekere karakters met alternatieve suggesties
- Inline correctie mogelijkheid
- Keyboard navigatie (pijltjes + Enter)
- "Alles correct" quick-action voor hoge confidence
- Foto thumbnail met zoom optie

### Fase 3: UI Integratie in AIScanV2

**Bestand: `src/pages/AIScanV2.tsx`**

Nieuwe state en flow:
```typescript
const [verificationStep, setVerificationStep] = useState<'pending' | 'verifying' | 'verified'>('pending');
const [verifiedMatrixNumber, setVerifiedMatrixNumber] = useState<string | null>(null);
```

Conditionele rendering:
- Na succesvolle analyse: toon MatrixVerificationStep
- Na verificatie: toon volledige resultaten + prijzen
- "Overslaan" optie voor ervaren gebruikers

### Fase 4: Database - Correcties Opslaan

**Nieuwe tabel: `matrix_corrections`**
```sql
CREATE TABLE matrix_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES ai_scan_results(id),
  original_matrix TEXT,
  corrected_matrix TEXT,
  character_corrections JSONB, -- [{position: 4, original: "9", corrected: "0"}]
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Doel: Training data verzamelen voor AI verbetering

### Fase 5: Smart Defaults

Automatische correctie suggesties gebaseerd op:
- Veelvoorkomende verwisselingen (O/0, I/1, S/5, B/8)
- Bekende label patronen (Mercury nummers beginnen vaak met 5)
- Historische correcties uit `matrix_corrections` tabel

## Voordelen

1. **100% Nauwkeurigheid**: Gebruiker bevestigt elk onzeker karakter
2. **Snelle Verificatie**: Hoge confidence = 1 klik bevestiging
3. **Training Data**: Elke correctie verbetert toekomstige herkenning
4. **Transparantie**: Gebruiker ziet exact wat de AI heeft herkend
5. **Gamification Ready**: Badges voor "100 verificaties" etc.

## Bestanden

| Actie | Bestand |
|-------|---------|
| Nieuw | `src/components/scanner/MatrixVerificationStep.tsx` |
| Nieuw | `supabase/migrations/xxx_matrix_corrections.sql` |
| Wijzigen | `supabase/functions/ai-photo-analysis-v2/index.ts` |
| Wijzigen | `src/pages/AIScanV2.tsx` |
| Wijzigen | `src/components/scanner/index.ts` |

## Optionele Uitbreidingen

- **Barcode verificatie**: Zelfde flow voor barcodes
- **Collectieve verificatie**: Community kan elkaars scans helpen verifiëren
- **Auto-learn**: Na X identieke correcties, pas AI prompt aan
