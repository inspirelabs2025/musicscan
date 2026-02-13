
# Fix: Dialog centreren op het scherm

## Probleem
De Discogs export popup verschijnt bovenaan het scherm in plaats van in het midden. De huidige `top-[50%] translate-y-[-50%]` methode werkt niet correct wanneer het dialog een `max-height` en `flex` layout heeft.

## Oplossing
Vervang de centreringsmethode in de basis `DialogContent` component (`dialog.tsx`). In plaats van `top-[50%] left-[50%] translate-x/y-[-50%]` gebruiken we `inset-0 m-auto` met een vaste `h-fit`. Dit is een robuustere CSS-centreringstechniek die onafhankelijk werkt van de content-hoogte.

## Wijzigingen

### 1. `src/components/ui/dialog.tsx`
- Vervang de positioneringsklassen van `DialogPrimitive.Content`:
  - **Weg**: `left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]`
  - **Nieuw**: `inset-0 m-auto h-fit`
- Dit zorgt ervoor dat het dialog altijd exact gecentreerd is, ongeacht hoogte of interne layout.

### 2. `src/components/collection/DiscogsExportDialog.tsx`
- Geen wijzigingen nodig -- de huidige `max-h-[85vh]` en flex layout werken correct met de nieuwe centreringsmethode.

## Technische details
De `inset-0 m-auto h-fit` techniek:
- `inset-0` zet top/right/bottom/left allemaal op 0
- `m-auto` centreert het element automatisch in beide richtingen
- `h-fit` zorgt dat de hoogte zich aanpast aan de content (zodat `m-auto` correct werkt)
- Dit is onafhankelijk van transforms en werkt betrouwbaar met max-height constraints
