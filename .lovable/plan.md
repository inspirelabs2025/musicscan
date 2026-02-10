

## Magic Mike Chat: V2 Pipeline Integratie + Rights Society Gating

### Kernprobleem
De Magic Mike chat laat het AI-model een Discogs ID **raden** op basis van kennis. Dit levert vaak verkeerde IDs op omdat het model geen toegang heeft tot de Discogs API of de deterministische matching-logica. De V2 scanner (`ai-photo-analysis-v2`) heeft dit wel: barcode-zoeken, scoring, rights society gating, local-first lookup, etc.

### Oplossing: Chat moet de V2 pipeline aanroepen

In plaats van het AI-model te laten gokken, wordt de flow:

```text
1. Gebruiker uploadt foto's
2. Magic Mike chat beschrijft wat hij ziet (artiest, titel, identifiers) -- GEEN Discogs ID meer
3. Na de AI-stream: automatisch ai-photo-analysis-v2 aanroepen met de foto's
4. V2 pipeline doet deterministische matching (incl. rights society gating)
5. Resultaat terug in chat tonen (met verificatie + prijzen)
```

### Concrete wijzigingen

**1. System Prompt aanpassen (`supabase/functions/scan-chat/index.ts`)**

- **Verwijder** de instructie om een Discogs ID te geven (`[[DISCOGS:123456]]`)
- **Behoud** de `[[SCAN_DATA:...]]` tag -- Magic Mike noteert wat hij op de foto's leest
- **Nieuwe instructie**: "Geef NOOIT een Discogs URL of ID. Het systeem zoekt automatisch de juiste release via de scanner-pipeline."
- **Toevoeging rights society awareness**: Instrueer Magic Mike om rechtenorganisaties (BIEM/STEMRA, JASRAC, etc.) expliciet te benoemen als hij ze ziet, zodat de gebruiker begrijpt waarom bepaalde releases worden uitgesloten

**2. ScanChatTab.tsx: V2 pipeline integreren**

Na het streamen van het AI-antwoord:

- **Verwijder** de logica die `[[DISCOGS:...]]` uit de AI-tekst haalt en als ID gebruikt
- **Nieuw**: Roep `ai-photo-analysis-v2` aan met de geuploadde `photoUrls` en `mediaType`
- De V2 pipeline retourneert het juiste `discogs_id` met scoring, rights society exclusions, en audit trail
- Toon het resultaat in de chat (artiest, titel, status, pricing)
- Als V2 meerdere suggesties retourneert, toon die als keuzeknopen

**3. ScanData interface uitbreiden**

Voeg `rights_societies` toe aan de `ScanData` interface zodat de chat ook kan tonen welke rechtenorganisaties gedetecteerd zijn en waarom bepaalde releases zijn uitgesloten.

**4. Flow detail**

```text
Stap 1: Stream AI antwoord (Magic Mike beschrijft foto's, noemt identifiers)
Stap 2: Extract [[SCAN_DATA:{...}]] uit AI tekst (behouden)
Stap 3: Roep ai-photo-analysis-v2 aan met photoUrls + mediaType
Stap 4: V2 retourneert:
         - discogs_id (deterministic match)
         - confidence_score
         - rights_society exclusions (audit trail)
         - suggestions (alternatieven)
Stap 5: Automatisch verify-and-enrich-release + fetch-discogs-pricing
Stap 6: Toon resultaat in chat
```

### Technische details

**scan-chat/index.ts wijzigingen:**
- System prompt: verwijder `[[DISCOGS:...]]` vereiste, voeg toe: "Benoem rechtenorganisaties die je ziet (BIEM, STEMRA, JASRAC, GEMA, etc.)"
- Geen functie-logica wijzigingen nodig -- het blijft een streaming chat

**ScanChatTab.tsx wijzigingen:**
- `sendMessage()` functie (regel 296-496): na de stream-loop, vervang de `extractDiscogsId` + `verify-and-enrich-release` logica door een aanroep naar `ai-photo-analysis-v2`
- Nieuwe functie `runV2Pipeline(photoUrls, mediaType)` die de edge function aanroept en het resultaat verwerkt
- Toon V2 resultaat inclusief: match status, rights society audit entries, en pricing
- Bij `needs_review` of meerdere suggesties: toon keuzeknopen per kandidaat
- `extractDiscogsId()` functie kan verwijderd worden (niet meer nodig)
- `cleanDisplayText()` hoeft `[[DISCOGS:...]]` niet meer te strippen

### Impact
- Rights society gating (STEMRA = exclude Japan) werkt nu ook in de chat
- Deterministische matching in plaats van AI-gokken
- Dezelfde scoring, local-first lookup, en audit trail als de V2 scanner
- Gebruiker ziet waarom een release is gekozen of uitgesloten

