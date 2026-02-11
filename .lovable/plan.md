

# Slimmere suggesties na "Uitleg scannen" en andere fases

## Probleem
Na de scan-uitleg van Magic Mike worden generieke suggesties getoond (bijv. "Vertel daar meer over") in plaats van logische vervolgacties zoals het starten van een scan of het handmatig invoeren.

## Oplossing
Een nieuw suggestie-pool toevoegen voor de "scan guide" context, en de detectielogica verbeteren zodat na scan-gerelateerde uitleg altijd de juiste vervolgacties worden aangeboden.

## Wijzigingen in `ScanChatTab.tsx`

### 1. Nieuw suggestie-pool: `SCAN_GUIDE_FOLLOWUP_SUGGESTIONS`
```
- 📸 Scan een CD of LP (triggert foto-flow)
- ✏️ Ik typ de artiest en titel zelf in (opent handmatig formulier)  
- 💡 Uitleg scannen (nogmaals de gids)
```

### 2. Detectielogica uitbreiden in `detectFollowupPool`
Toevoegen van herkenning voor scan-guide-gerelateerde antwoorden (trefwoorden: "belichting", "matrixnummer", "scannen", "barcode", "foto", "hoek") die naar het nieuwe pool verwijzen.

### 3. "Scan nog een CD of LP" chip slimmer maken
Wanneer er nog geen `verifiedResult` is (dus geen eerdere scan gedaan), wordt de tekst "Scan een CD of LP" i.p.v. "Scan nog een CD of LP".

Dit zorgt ervoor dat na elke fase logische vervolgacties worden geboden:
- Na uitleg scannen: foto maken, handmatig invoeren
- Na scan-resultaat: feitjes, artiest info, opnieuw scannen
- Na artiest-info: meer weetjes, andere albums, opnieuw scannen
