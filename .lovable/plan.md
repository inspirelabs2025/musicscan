

## SoundScan knop naast Smart Scan titel

De muziekherkenningsfunctie (microfoon/luisteren) bestaat al in de chat-component maar is alleen bereikbaar via een klein microfoon-icoontje onderaan de chat. De gebruiker wil deze als prominente "SoundScan" knop naast de "Smart Scan" titel, die bij aanklikken direct de luisterfunctie start.

### Wat er verandert

**Pagina header wordt twee knoppen naast elkaar:**
- "Smart Scan" (bestaand, huidige scanner)  
- "SoundScan" (nieuw, start direct muziekherkenning)

Bij klikken op SoundScan wordt direct de microfoon geactiveerd en begint de muziekherkenning (10 seconden luisteren).

### Technische aanpak

**1. `ScanChatTab.tsx` - Exposed trigger via prop/ref**
- Een optionele `autoStartListening` prop toevoegen
- Bij mount: als `autoStartListening` true is, direct `startListening()` aanroepen
- Dit voorkomt dat we de hele listening-logica moeten dupliceren

**2. `AIScanV2.tsx` - Header aanpassen**
- Naast "Smart Scan" titel een "SoundScan" knop toevoegen met een `Mic` icoon
- State `soundScanActive` toevoegen
- Bij klik op SoundScan: `soundScanActive` op true zetten, wat doorgestuurd wordt als prop naar `ScanChatTab`
- Styling: vergelijkbare badge-stijl als Smart Scan, met een ander kleuraccent (amber/goud voor geluid)

**3. Visuele layout header**
```
[Brain] Smart Scan [BETA]  |  [Mic] SoundScan
```
- Twee klikbare tabs/knoppen naast elkaar
- SoundScan krijgt een amber/goud kleur om het te onderscheiden
- Bij actieve luistersessie: pulserende animatie op de SoundScan knop

**Bestanden:**
- `src/pages/AIScanV2.tsx` - Header aanpassen met SoundScan knop + state
- `src/components/scanner/ScanChatTab.tsx` - `autoStartListening` prop accepteren en bij mount triggeren
