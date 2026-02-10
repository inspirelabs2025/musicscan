
# Conditie-beoordeling en prijsadvies na scan

## Wat verandert er?
Na het vinden van een release toont de chat twee dropdown-selectors: **Staat van de media** (CD/vinyl) en **Staat van de hoes** (sleeve), beide volgens de officiele Discogs Grading richtlijnen. Op basis van de gekozen conditie wordt een **adviesprijs** berekend, afgeleid van de marketplace-prijsdata. Dit wordt ook meegenomen bij het opslaan in de catalogus.

## Hoe werkt het prijsadvies?

De mediaan-prijs wordt gecorrigeerd met een conditie-factor:

```text
Conditie           Factor
Mint (M)            1.20
Near Mint (NM)      1.00  (= mediaan)
Very Good Plus      0.75
Very Good (VG)      0.50
Good Plus (G+)      0.35
Good (G)            0.20
Fair / Poor         0.10
```

Als er marketplace listings zijn, wordt ook gekeken naar listings met vergelijkbare conditie voor een nauwkeuriger advies.

---

## Technische details

### Bestand: `src/components/scanner/ScanChatTab.tsx`

**1. Nieuwe state variabelen:**
```typescript
const [conditionMedia, setConditionMedia] = useState<string>('');
const [conditionSleeve, setConditionSleeve] = useState<string>('');
```

**2. Conditie-opties (Discogs standaard):**
```typescript
const DISCOGS_CONDITIONS = [
  { value: 'Mint (M)', label: 'Mint (M)', desc: 'Absoluut perfect, nooit afgespeeld' },
  { value: 'Near Mint (NM or M-)', label: 'Near Mint (NM)', desc: 'Vrijwel perfect' },
  { value: 'Very Good Plus (VG+)', label: 'Very Good Plus (VG+)', desc: 'Lichte gebruikssporen' },
  { value: 'Very Good (VG)', label: 'Very Good (VG)', desc: 'Duidelijke gebruikssporen, speelt goed' },
  { value: 'Good Plus (G+)', label: 'Good Plus (G+)', desc: 'Zichtbare slijtage' },
  { value: 'Good (G)', label: 'Good (G)', desc: 'Veel slijtage, speelt nog' },
  { value: 'Fair (F)', label: 'Fair (F)', desc: 'Beschadigd' },
  { value: 'Poor (P)', label: 'Poor (P)', desc: 'Nauwelijks afspeelbaar' },
];
```

**3. Adviesprijs-berekening:**
```typescript
const CONDITION_FACTORS: Record<string, number> = {
  'Mint (M)': 1.20,
  'Near Mint (NM or M-)': 1.00,
  'Very Good Plus (VG+)': 0.75,
  'Very Good (VG)': 0.50,
  'Good Plus (G+)': 0.35,
  'Good (G)': 0.20,
  'Fair (F)': 0.10,
  'Poor (P)': 0.05,
};

function calculateAdvicePrice(
  pricing: PricingData | null,
  conditionMedia: string,
  conditionSleeve: string
): number | null {
  if (!pricing?.median_price || !conditionMedia) return null;
  const mediaFactor = CONDITION_FACTORS[conditionMedia] ?? 0.5;
  const sleeveFactor = CONDITION_FACTORS[conditionSleeve] ?? 0.5;
  // Media weegt zwaarder (70%) dan hoes (30%)
  const combinedFactor = (mediaFactor * 0.7) + (sleeveFactor * 0.3);
  return Math.round(pricing.median_price * combinedFactor * 100) / 100;
}
```

**4. UI: Conditie-panel na match (inline in chat, onder prijskaart):**
Na de marketplace listings en voor de "Opslaan" knop, een compact panel tonen met:
- Select dropdown "Staat Media" (CD/Vinyl)
- Select dropdown "Staat Hoes"
- Berekend adviesprijs badge
- Beide volgens Discogs grading met korte beschrijving per optie

**5. Opslaan met conditie:**
De `saveToCollection` functie wordt uitgebreid:
```typescript
record.condition_grade = conditionMedia || 'Not Graded';
record.sleeve_condition = conditionSleeve || 'Not Graded';
record.calculated_advice_price = advicePrice ?? pricing?.median_price ?? null;
```

**6. Reset:**
Bij `resetChat` worden `conditionMedia` en `conditionSleeve` teruggezet naar `''`.

### Resultaat
- Release gevonden -> prijsdata getoond -> gebruiker kiest conditie media + hoes -> adviesprijs berekend -> opslaan met juiste conditie en prijs
