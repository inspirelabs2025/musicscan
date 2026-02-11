

## Probleem: Microfoon/Shazam werkt niet op mobiel

### Oorzaak

Het probleem zit in de **audio opname-instellingen** in `ScanChatTab.tsx`. Er zijn drie fouten:

1. **iOS Safari ondersteunt geen `audio/webm` of `audio/ogg`** -- De huidige mime type fallback is `webm;codecs=opus` -> `webm` -> `ogg`. Geen van deze werkt op iOS. iOS Safari ondersteunt alleen `audio/mp4` via MediaRecorder.

2. **Geen check of MediaRecorder beschikbaar is** -- Op sommige mobiele browsers bestaat `MediaRecorder` niet. Er is geen foutmelding als het ontbreekt.

3. **Onnodige `useCallback` dependency op `messages`** -- Dit herschept de functie bij elk nieuw bericht, wat op mobiel kan leiden tot stale references.

### Oplossing

**Bestand: `src/components/scanner/ScanChatTab.tsx`**

Stap 1 -- Voeg `audio/mp4` toe aan de mime type fallback chain (voor iOS):

```text
Huidige volgorde:  webm;codecs=opus -> webm -> ogg
Nieuwe volgorde:   webm;codecs=opus -> webm -> mp4 -> ogg
```

Stap 2 -- Voeg een check toe of MediaRecorder uberhaupt beschikbaar is:

```typescript
if (typeof MediaRecorder === 'undefined') {
  toast({ 
    title: "Niet ondersteund", 
    description: "Audio opname wordt niet ondersteund op dit apparaat.", 
    variant: "destructive" 
  });
  return;
}
```

Stap 3 -- Verwijder `messages` uit de `useCallback` dependencies (niet nodig, voorkomt onnodige recreaties):

```typescript
// Van:
}, [messages, supabase]);
// Naar:
}, []);
```

Stap 4 -- Voeg betere logging toe voor debugging op mobiel:

```typescript
console.log('[music-rec] Selected mimeType:', mimeType);
console.log('[music-rec] MediaRecorder supported:', typeof MediaRecorder !== 'undefined');
```

### Technische details

- `MediaRecorder` op iOS Safari (16.4+) ondersteunt alleen `audio/mp4`
- Oudere iOS versies (< 16.4) ondersteunen MediaRecorder helemaal niet -- daar tonen we een duidelijke melding
- De `audio/mp4` data kan gewoon als base64 naar de AudD API gestuurd worden, die ondersteunt mp4 audio
- De `recognize-music` edge function hoeft niet aangepast te worden

### Verwacht resultaat

Na deze fix zal de microfoon-knop op zowel iOS als Android correct werken: audio opnemen, naar de herkenningsservice sturen, en het resultaat tonen.

