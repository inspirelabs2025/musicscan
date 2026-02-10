
# Magic Mike - Direct Foto Analyse & Gespreksstarter

## Probleem
Magic Mike vraagt gebruikers om handmatig tekst over te typen van hun foto's, terwijl hij de foto's gewoon kan zien en analyseren via het vision model. Hij moet ZELF de OCR doen en direct bevestigen wat hij ziet.

## Aanpassingen

### 1. System Prompt herschrijven (`scan-chat/index.ts`)
De prompt wordt aangescherpt met deze kernregels:
- **REGEL 1**: Als je foto's ontvangt, LEES ze zelf. Vraag NOOIT de gebruiker om tekst over te typen die op de foto's staat.
- **REGEL 2**: Begin altijd met bevestiging: "Ik zie [Artiest] - [Titel]" en ga dan verder.
- **REGEL 3**: Zoek zelf naar matrix-nummers, barcodes, catalogusnummers op de foto's.
- **REGEL 4**: Als je iets niet kunt lezen, vraag dan om een betere foto van dat specifieke deel.

Nieuwe flow in de prompt:
1. Ontvang foto's
2. Bevestig artiest en titel
3. Benoem welke technische identifiers je hebt gevonden (matrix, barcode, catno)
4. Geef Discogs kandidaten
5. Vraag eventueel om extra foto's van specifieke delen die onduidelijk zijn

### 2. Eerste bericht van Magic Mike aanpassen (`ScanChatTab.tsx`)
Het automatische eerste bericht wanneer foto's worden verstuurd wijzigt van:
- "Bekijk ze en vertel me wat je ziet" (te passief)
Naar:
- "Analyseer deze foto's. Bevestig eerst de artiest en titel. Zoek dan naar barcode, catalogusnummer en matrix-nummer op de foto's. Geef je bevindingen."

Dit is het verborgen instructie-bericht dat mee wordt gestuurd - niet zichtbaar voor de gebruiker.

### Bestanden

| Actie | Bestand |
|-------|---------|
| Wijzig | `supabase/functions/scan-chat/index.ts` - System prompt aanscherpen |
| Wijzig | `src/components/scanner/ScanChatTab.tsx` - Instructie-bericht bij foto upload |
