

## Probleem

De scanner vindt de juiste Discogs-release (Mariah Carey - Emotions, ID 6042141, 80 punten) maar gooit deze weg door twee samenhangende logische fouten:

1. **Soft match sluit matrix-matches uit**: De formule `hasYear && !hasAnyTechnical` betekent dat kandidaten MET matrix-match ironisch genoeg worden uitgesloten van de soft match
2. **Hard gating herkent matrix niet als voldoende**: De hard gate vereist 2 van {barcode, catno, matrix}, maar matrix + label + year telt niet als LOCK-conditie

## Oplossing: Slimmere Decision Logic

### Wijziging 1: Fix soft match in Strategy 3 verificatie (regel ~1758-1780)

De soft match conditie wordt vervangen door een puntgebaseerde selectie:
- Verwijder de `softMatch` boolean-check
- Selecteer simpelweg de kandidaat met de **hoogste punten** uit de verificatie
- Minimale drempel: 30 punten (label + year + title)

```
// OUD (broken):
const softMatch = hasLabel && (hasCatno || (hasYear && !hasAnyTechnical));
if (softMatch && verification.points > bestConfidencePoints) { ... }

// NIEUW (simpel, effectief):
if (verification.points >= 30 && verification.points > bestConfidencePoints) {
  bestMatch = candidate;
  bestConfidencePoints = verification.points;
  ...
}
```

### Wijziging 2: Voeg matrix + label toe als LOCK-pad (regel ~1821-1854)

Naast de bestaande catno+label soft gate, voeg een matrix+label pad toe:

```
// Matrix + Label = suggested_match (matrix is sterkste identifier na barcode)
if (hasMatrixMatch && hasLabelMatch && hasArtistTitleContext) {
  searchMetadata.verification_level = 'suggested_match';
  bestConfidencePoints = Math.min(bestConfidencePoints, Math.floor(160 * 0.79));
}
```

### Wijziging 3: Voeg matrix toe aan identifierMatchCount

Matrix hoort mee te tellen in de identifier count:
- Matrix match + label match = voldoende voor suggested_match
- Matrix match + catno of barcode = voldoende voor verified

### Verwacht resultaat

De Mariah Carey scan zou nu:
- Candidate 6042141 selecteren (matrix ✅ + label ✅ + year ✅ = 80 pts)
- Status: `suggested_match` met confidence ~0.50 (80/160)
- Discogs URL: https://www.discogs.com/release/6042141

### Bestanden die wijzigen

- `supabase/functions/ai-photo-analysis-v2/index.ts` — drie blokken in de decision logic

