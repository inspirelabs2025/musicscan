

## Probleem: Oude versie blijft hangen na publish

De huidige aanpak werkt niet omdat:
- `meta http-equiv="Cache-Control"` tags worden genegeerd door moderne browsers - alleen echte HTTP headers tellen
- De `VersionBanner` is verwijderd uit `App.tsx`, dus er is geen enkele versiedetectie actief
- Browsers cachen `index.html` en blijven oude JS/CSS chunks laden

## Oplossing: Stille automatische versie-refresh (geen banner)

In plaats van een zichtbare banner die gebruikers irriteert, wordt de versiecheck **onzichtbaar** gemaakt: bij detectie van een nieuwe versie wordt direct en stil herladen.

### 1. `useVersionCheck.ts` aanpassen - Stille auto-reload

- Bij **eerste mismatch** direct `window.location.reload()` uitvoeren - geen banner, geen teller van 3
- Eerste check na **5 seconden** (i.p.v. 30)
- Interval verkorten naar **2 minuten**
- De hook retourneert niets meer voor UI - het is puur een achtergrondproces

### 2. `VersionBanner.tsx` verwijderen

- Dit component is niet meer nodig - er komt geen zichtbare melding
- De versiecheck draait volledig op de achtergrond

### 3. Nieuw: `AutoVersionCheck` component in `App.tsx`

- Een onzichtbaar component (rendert `null`) dat de hook aanroept
- Wordt bovenaan in `App.tsx` geplaatst
- Gebruikers merken er niets van - de pagina herlaadt gewoon als er een nieuwe versie is

### 4. `App.css` opschonen

- De verouderde Vite boilerplate `#root` styling (max-width, padding) verwijderen die mogelijk layout-problemen veroorzaakt

## Wat de gebruiker ervaart

- Na een publish: binnen 5 seconden detecteert de app automatisch de nieuwe versie
- De pagina herlaadt zichzelf stil - geen banner, geen knop, geen actie nodig
- De gebruiker ziet altijd de nieuwste versie

## Technische details

**Bestanden:**
- `src/hooks/useVersionCheck.ts` - Vereenvoudigen tot stille auto-reload bij eerste mismatch
- `src/components/VersionBanner.tsx` - Verwijderen (niet meer nodig)
- `src/App.tsx` - Klein onzichtbaar `AutoVersionCheck` component toevoegen dat de hook draait
- `src/App.css` - Verouderde `#root` styling verwijderen

