

## Fix: Chat V2 Pipeline - Ontbrekende `conditionGrade`

### Oorzaak

De edge function logs tonen het probleem:

```
null value in column "condition_grade" of relation "ai_scan_results" 
violates not-null constraint
```

De chat roept `ai-photo-analysis-v2` aan ZONDER `conditionGrade`:

```js
// Chat stuurt:
{ photoUrls: urls, mediaType: mType, skipSave: true }

// Scanner stuurt:
{ photoUrls, mediaType, conditionGrade }  // <-- dit werkt
```

De edge function probeert altijd een database-record aan te maken met `condition_grade`, wat crasht als dit veld `null` is.

### Oplossing (2 wijzigingen)

**1. `ScanChatTab.tsx` — `conditionGrade` meesturen**

De chat stuurt een default waarde mee (`"Not Graded"` of `"unknown"`) omdat de conditie pas later in de flow wordt bepaald. Het belangrijkste is dat de V2 pipeline draait voor de identificatie.

**2. `supabase/functions/ai-photo-analysis-v2/index.ts` — `skipSave` ondersteunen**

Voeg een `skipSave` optie toe zodat de chat-flow GEEN database-record aanmaakt. De chat wil alleen het match-resultaat, niet een apart scan-record.

Concreet:
- Lees `skipSave` uit de request body (default `false`)
- Als `skipSave === true`: sla de database insert over, sla de database update over, maar voer WEL de volledige analyse + matching + rights society gating uit
- Retourneer het resultaat direct zonder DB-side-effects
- `conditionGrade` wordt optioneel (default `"Not Graded"`) wanneer `skipSave` actief is

Dit zorgt ervoor dat de chat exact dezelfde matching-logica gebruikt als de scanner, inclusief barcode-zoeken, scoring, rights society gating en local-first lookup.

