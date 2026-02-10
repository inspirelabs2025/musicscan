

## Bevestigingen & Uitsluiters: Rights Society Gating

### Probleem
BIEM/STEMRA op de disc betekent dat het een Europese (Nederlandse) persing is. De huidige scoring geeft alleen een -25 penalty op basis van "Made in" tekst, maar negeert harde juridische markers zoals rechtenorganisaties. Hierdoor kan een Japanse release toch winnen als die op andere punten hoog scoort.

### Oplossing: Twee nieuwe mechanismen

**1. Rights Society Region Map (harde uitsluiter)**

Een mapping van rechtenorganisaties naar hun regio:

```text
BIEM/STEMRA, STEMRA     --> NL/EU
GEMA                     --> DE/EU  
SACEM                    --> FR/EU
PRS, MCPS               --> UK/EU
JASRAC                   --> JP
ASCAP, BMI               --> US
SOCAN                    --> CA
APRA, AMCOS              --> AU/NZ
```

Als STEMRA gedetecteerd is en de kandidaat-release komt uit Japan --> **hard exclude** (score naar 0, skip).

**2. Twee-laags logica in de scoring-functie**

Stap A - **Exclude**: Als de gedetecteerde rechtenorganisatie een regio impliceert die NIET compatibel is met het land van de kandidaat, dan wordt de kandidaat volledig uitgesloten (score = 0). Dit is geen penalty maar een eliminatie.

Stap B - **Confirm**: Als de rechtenorganisatie WEL past bij het kandidaat-land, geeft dit +15 bevestigingspunten. STEMRA + "Netherlands" = sterke bevestiging.

### Wat verandert er concreet

**File: `supabase/functions/ai-photo-analysis-v2/index.ts`**

1. **Nieuwe constante**: `RIGHTS_SOCIETY_REGIONS` -- map van society-naam naar compatible landen/regio's
2. **Nieuwe helper**: `detectRightsSocieties(text)` -- zoekt in alle geextraheerde tekst naar bekende rechtenorganisaties
3. **Aanpassing scoring-functie** (`verifyAndScoreCandidate` rond regel 2652):
   - Voeg een check toe VOOR de bestaande country-check
   - Als een rights society is gedetecteerd:
     - Kandidaat-land valt BUITEN de society-regio --> `points = 0`, `excluded = true`, explain: "STEMRA detected: excludes Japan"
     - Kandidaat-land valt BINNEN de society-regio --> `points += 15`, explain: "STEMRA confirms Netherlands origin"
4. **`analysisData` uitbreiden**: Het bestaande `rights_societies` veld wordt doorgegeven aan de scoring-functie zodat het beschikbaar is voor de exclude/confirm logica
5. **Audit trail**: Elke exclude/confirm wordt gelogd in de `explain` array zodat het zichtbaar is in de Audit Log UI

### Voorbeeld flow (jouw CBS CD)

```text
Gedetecteerd: BIEM/STEMRA
Kandidaat 1: Japan (35DP-93) --> EXCLUDED (STEMRA = EU only)
Kandidaat 2: Netherlands (CBS 450227 2) --> +15 confirm, totaal hoger
Resultaat: Nederlandse persing wint
```

### Impact op bestaande logica
- De EU country penalty (-25) blijft bestaan als fallback voor "Made in" tekst
- Rights society gating heeft HOGERE prioriteit en is een harde exclude (niet alleen penalty)
- Geen impact op scans zonder rechtenorganisatie-detectie

