

## Probleem

Op mobile (390px) zijn er meerdere layout-problemen op de productdetailpagina:

1. **Beschrijvingstekst loopt uit het scherm** — geen goede word-wrap, tekst wordt horizontaal afgesneden
2. **Share-knop wordt van het scherm geduwd** — de flex-row met "Toevoegen" knop en share-knop past niet op mobile breedte
3. **Prijs/voorraad card sluit niet netjes aan** — te veel padding, elementen overlappen met bottom nav

## Aanpak

### Bestand: `src/pages/PlatformProductDetail.tsx`

1. **Beschrijving overflow fixen**: Toevoegen van `overflow-wrap: anywhere` en `word-break: break-word` op de beschrijving paragraaf, plus `max-w-full` op de container.

2. **Add-to-cart + Share knop responsive maken**: De `flex gap-3` row met de cart-knop en share-knop aanpassen — op mobile de share-knop onder de cart-knop plaatsen of de cart-knop minder breed (`flex-1 min-w-0`) en de share-knop compact houden.

3. **Card padding verkleinen op mobile**: `p-4 md:p-6` in plaats van `p-6` voor de prijs-card.

4. **Grid spacing verkleinen op mobile**: `gap-4 md:gap-8` in de hoofdgrid, en `space-y-4 md:space-y-6` voor de product-info kolom.

5. **Titel responsive**: Al gefixt met `text-2xl md:text-3xl`, maar checken of het daadwerkelijk werkt.

### Technische details

- Regel ~313: `gap-8` → `gap-4 md:gap-8`
- Regel ~363: `space-y-6` → `space-y-4 md:space-y-6`  
- Regel ~385-387: beschrijving container + tekst: toevoegen `overflow-wrap-anywhere` style, `whitespace-pre-line`
- Regel ~391: Card `p-6` → `p-4 md:p-6`
- Regel ~420: Cart/share button row: `flex-wrap` toevoegen zodat share-knop op volgende regel valt als er geen ruimte is

