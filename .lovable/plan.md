
# Shazam-integratie in Magic Mike Chat

## Wat we bouwen
Een microfoon-knop in de Magic Mike chat input-balk waarmee gebruikers muziek kunnen herkennen door een audiofragment op te nemen. Het resultaat verschijnt direct in het chatgesprek.

## Vereiste: AudD API Key

Er is nog geen `AUDD_API_TOKEN` geconfigureerd. Je hebt een gratis account nodig op [audd.io](https://dashboard.audd.io/) (300 gratis requests).

We voegen de secret toe voordat we de edge function bouwen.

## Technische Aanpak

### 1. Edge Function: `recognize-music`
Nieuw bestand: `supabase/functions/recognize-music/index.ts`

- Ontvangt base64-encoded audio (WebM/OGG, ~8 seconden)
- Stuurt naar AudD API (`https://api.audd.io/` met `return=spotify`)
- Retourneert: artiest, titel, album, release date, Spotify-link, albumcover

### 2. ScanChatTab.tsx aanpassingen

**Nieuwe state:**
- `isListening` - of de microfoon actief is
- `listeningProgress` - countdown timer (8 seconden)

**Nieuwe knop in input-balk:**
- Microfoon-icoon (van Lucide: `Mic`) naast de camera/galerij knoppen
- Bij klikken: vraag microfoon-toestemming, neem 8 sec op
- Geanimeerde pulse-ring tijdens opname + countdown
- Na opname: base64 encode, stuur naar edge function, toon resultaat als chatbericht

**Resultaat in chat:**
- Assistent-bericht met artiest, titel, album
- Spotify-link als die beschikbaar is
- Suggestie-chips: "Voeg toe aan collectie", "Meer over deze artiest", "Herken nog een nummer"

### 3. Vertalingen (i18n)
Nieuwe keys in `src/i18n/translations.ts` onder `shazam`:

| Key | NL | EN |
|-----|----|----|
| listening | Luisteren... | Listening... |
| recognized | Nummer herkend! | Song recognized! |
| noMatch | Niet herkend | Not recognized |
| micPermission | Microfoon toestemming nodig | Microphone permission needed |
| tapToListen | Tik om te luisteren | Tap to listen |

### 4. Gebruikersflow

```text
[Tik microfoon] --> [Browser vraagt toestemming]
    --> [Luisteren... 8 sec met countdown]
    --> [Audio naar recognize-music edge function]
    --> [AudD API antwoord]
    --> [Resultaat als chatbericht van Magic Mike]
```

## Bestanden

| Bestand | Actie |
|---------|-------|
| `supabase/functions/recognize-music/index.ts` | Nieuw |
| `src/components/scanner/ScanChatTab.tsx` | Microfoon-knop + opname-logica toevoegen |
| `src/i18n/translations.ts` | Shazam vertalingen NL/EN |

## Stappen
1. AUDD_API_TOKEN secret toevoegen (vraag aan gebruiker)
2. Edge function `recognize-music` bouwen en deployen
3. Microfoon-knop + opname-logica in ScanChatTab
4. Vertalingen toevoegen
