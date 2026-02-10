
# Fix: Chat follow-up vragen triggeren geen nieuwe scan

## Probleem
Na een succesvolle scan met geverifieerd resultaat, stuurt elke vervolgvraag de volledige V2-pipeline opnieuw. Dit is onnodig en verwarrend -- de gebruiker wil alleen een extra vraag stellen over de al gevonden release.

## Oplossing
Een `hasVerifiedResult` state toevoegen die bijhoudt of er al een geverifieerd resultaat is. De V2-pipeline draait alleen opnieuw als:
1. Het de eerste scan is (nog geen resultaat)
2. De gebruiker expliciet aangeeft dat de release niet klopt (detectie via keywords)

Alle andere vervolgvragen gaan alleen naar de chat-AI, inclusief de context van het gevonden resultaat.

---

## Technische details

### Bestand: `src/components/scanner/ScanChatTab.tsx`

**1. Nieuwe state toevoegen:**
```typescript
const [verifiedResult, setVerifiedResult] = useState<V2PipelineResult | null>(null);
```

**2. Bij succesvolle V2 match, resultaat opslaan:**
Na de regel waar `setMessages` het resultaat toont (rond lijn 447), ook:
```typescript
setVerifiedResult(v2Result);
```

**3. In `sendMessage`, V2-pipeline conditioneel maken:**
De huidige check op lijn 376:
```typescript
if (activeUrls.length > 0 && mediaType) {
```
Wordt:
```typescript
const shouldRunV2 = activeUrls.length > 0 && mediaType && !verifiedResult;
```

**4. "Release is fout" detectie toevoegen:**
Bij `handleSend`, check of de gebruiker aangeeft dat het resultaat niet klopt. Als dat zo is, reset `verifiedResult` zodat de V2-pipeline opnieuw draait:
```typescript
const rejectKeywords = ['niet juist', 'niet correct', 'verkeerde', 'fout', 'klopt niet', 
  'andere release', 'niet goed', 'opnieuw zoeken', 'wrong', 'incorrect'];

const isRejection = rejectKeywords.some(kw => input.toLowerCase().includes(kw));
if (isRejection) {
  setVerifiedResult(null);
}
```

**5. Verified context meesturen naar chat-AI:**
Wanneer `verifiedResult` bestaat, het als context meesturen in het bericht naar de AI zodat Mike weet welke release al gevonden is en er inhoudelijk over kan praten:
```typescript
// In sendMessage, voor de fetch call:
if (verifiedResult) {
  // Voeg context toe zodat Mike weet welke release actief is
  const contextNote = `[CONTEXT: Release al geidentificeerd - ${verifiedResult.artist} - ${verifiedResult.title}, Discogs ID: ${verifiedResult.discogs_id}. Beantwoord de vraag van de gebruiker zonder opnieuw te scannen.]`;
  // Prepend aan het user message in de messages array
}
```

**6. Reset bij `resetChat`:**
```typescript
setVerifiedResult(null);
```

### Resultaat
- Eerste scan: foto's uploaden -> AI analyseert -> V2 pipeline draait -> resultaat getoond
- Vervolgvraag: "Welk jaar is dit album uitgebracht?" -> alleen chat-AI antwoordt, geen nieuwe scan
- Gebruiker zegt "Dit klopt niet": -> `verifiedResult` wordt gereset -> volgende bericht triggert V2 opnieuw
