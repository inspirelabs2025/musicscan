
# Fix: Suggesties sorteren op Rights Society Primary Region

## Probleem

De rights society scoring fix werkt correct in de **verifyCandidate** functie (logs bevestigen: MCPS -> UK +15, Germany +0). Maar de **suggesties-lijst** (die je ziet als er geen definitieve match is) gebruikt een ANDERE sorteerlogica die niets doet met rights societies.

De huidige sorteercode (regel 2188-2198) sorteert alleen op "is het een EU-land of niet":

```text
Germany = EU --> bovenaan
UK = EU --> bovenaan
Japan = niet-EU --> onderaan
```

Germany en UK worden als gelijk behandeld, waardoor Germany toevallig bovenaan verschijnt.

## Oplossing

De suggesties-sortering uitbreiden met rights society primary region voorkeur. Als MCPS is gedetecteerd, moeten UK-releases boven Germany komen.

### Aanpassing in `supabase/functions/ai-photo-analysis-v2/index.ts`

**Locatie:** Regels 2165-2200 (suggesties-sorteerblok)

1. **Detect rights societies** in de suggesties-scope (hergebruik de bestaande `detectRightsSocieties` functie met `analysisData`)
2. **Sorteer suggesties** met drie niveaus:
   - Niveau 1: Primary region van gedetecteerde rights society (bijv. UK bij MCPS) --> bovenaan
   - Niveau 2: Compatible EU-land --> midden  
   - Niveau 3: Niet-EU --> onderaan

### Concrete codewijziging:

Na regel 2186 (waar `rawSuggestions` is gebouwd), vervang het sorteerblok (2188-2198) door:

```typescript
// Detect rights societies for suggestion sorting
const sugRightsSocieties = [
  ...(analysisData.rightsSocieties || []),
  ...(analysisData.externalRightsSocieties || []),
];
const sugAllTexts = [
  ...(analysisData.discLabelText || []),
  ...(analysisData.backCoverText || []),
].filter(Boolean);
const sugDetectedSocieties = detectRightsSocieties(sugRightsSocieties, sugAllTexts);

// Sort: primary region first, then EU, then rest
rawSuggestions.sort((a, b) => {
  const aCountry = (a.country || '').toLowerCase();
  const bCountry = (b.country || '').toLowerCase();
  
  // Check primary region match
  let aIsPrimary = false, bIsPrimary = false;
  for (const society of sugDetectedSocieties) {
    const mapping = RIGHTS_SOCIETY_REGIONS[society];
    if (!mapping) continue;
    if (mapping.primary.some(p => aCountry.includes(p))) aIsPrimary = true;
    if (mapping.primary.some(p => bCountry.includes(p))) bIsPrimary = true;
  }
  if (aIsPrimary && !bIsPrimary) return -1;
  if (!aIsPrimary && bIsPrimary) return 1;
  
  // Fallback: EU vs non-EU
  if (isEUHint) {
    const euRegex = /europe|eu|netherlands|...etc/i;
    const aIsEU = euRegex.test(aCountry);
    const bIsEU = euRegex.test(bCountry);
    if (aIsEU && !bIsEU) return -1;
    if (!aIsEU && bIsEU) return 1;
  }
  return 0;
});
```

### Resultaat na fix:

Bij MCPS-detectie:
```text
1. Ella Fitzgerald - Portrait Of Ella Fitzgerald | UK (1996) · PYCD 130    (primary)
2. Ella Fitzgerald - Portrait | Germany · 7186                              (EU, niet primary)
3. Ella Fitzgerald - Portrait | Germany (2002) · 7186                       (EU, niet primary)
4. Ella Fitzgerald - Portrait | Germany (2003) · 204292                     (EU, niet primary)
```

### Geen impact op bestaande logica
- De `verifyCandidate` scoring blijft ongewijzigd
- Alleen de volgorde van suggesties verandert
- Eén bestand, één sorteerblok
