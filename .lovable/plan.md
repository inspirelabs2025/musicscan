
# Fix: MCPS Rights Society Gating te breed — Duitse releases worden niet uitgesloten

## Probleem gevonden

Uit de edge function logs blijkt het concrete probleem:

```
MCPS confirms Germany → +15 points   (3x)
MCPS confirms UK → +15 points        (3x)
MCPS confirms Europe → +15 points    (2x)
```

**MCPS geeft +15 bonuspunten aan Duitse releases**, terwijl MCPS specifiek een Britse organisatie is (Mechanical Copyright Protection Society). Het resultaat: Duitse en Britse releases krijgen dezelfde score, en de Duitse verschijnen bovenaan.

## Oorzaak

In de `RIGHTS_SOCIETY_REGIONS` mapping staat MCPS als compatible met heel Europa, inclusief Germany:

```
'MCPS': { regions: ['uk', 'united kingdom', 'europe', 'eu', 'ireland',
  'netherlands', 'holland', 'germany', 'france', ...], label: 'UK/EU' }
```

Dit is te ruim. MCPS op een fysieke CD is een **sterke UK-markt indicator**. Een Duitse release zou GEMA/BIEM hebben, geen MCPS.

## Oplossing: Twee-niveau rights society matching

In plaats van alleen "compatible / niet-compatible", introduceren we een derde categorie: **primary region** (de thuismarkt van de organisatie).

### Nieuwe logica:

```text
Candidate country = primary region   -->  +15 punten (bevestiging)
Candidate country = compatible region -->  +0 punten (neutraal, geen uitsluiting)
Candidate country = niet in lijst    -->  score = 0 (harde uitsluiting)
```

### Voorbeeld met MCPS:
- UK release: +15 (primary)
- Germany release: 0 (compatible maar geen bonus)
- Japan release: score=0 (uitgesloten)

### Aanpassingen in `ai-photo-analysis-v2/index.ts`:

1. **Data model uitbreiden** - `RIGHTS_SOCIETY_REGIONS` krijgt een extra `primary` array naast `regions`:
   - MCPS/PRS: primary = `['uk', 'united kingdom', 'ireland']`
   - STEMRA/BUMA: primary = `['netherlands', 'holland']`
   - GEMA: primary = `['germany', 'austria']`
   - SACEM: primary = `['france']`
   - etc.

2. **Scoring logica aanpassen** (regels 2775-2797):
   - Check eerst of candidate country in `primary` zit --> +15
   - Anders check of het in `regions` zit --> 0 (neutraal)
   - Anders --> score = 0 (exclude)

3. **Disambiguation verbeteren** (regels 2237-2250):
   - Bij gelijke scores: kandidaten uit de primary region van de gedetecteerde rights society krijgen voorrang

Dit zorgt ervoor dat bij MCPS-detectie de UK-release altijd boven de Duitse uitkomt, zonder dat de Duitse onterecht wordt uitgesloten (want het kan theoretisch een in Duitsland geperste maar voor UK bedoelde release zijn).
