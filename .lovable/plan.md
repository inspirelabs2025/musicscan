
# Fix: Oude Versie Terugval — Service Worker Opruiming

## Root Cause

Het pakket `vite-plugin-pwa` staat in `package.json` maar wordt NIET meer gebruikt in `vite.config.ts`. Een eerdere build heeft een **service worker** geregistreerd in de browser van gebruikers. Deze service worker cached JS-bestanden en serveert de oude bundel, ongeacht of de server nieuwe code heeft.

**Bewijs uit screenshots:**
- "Oud" toont subtitle "Maak een foto en ontdek direct artiest, album en marktwaarde" (zonder "Chat met Magic Mike")
- "Oud" mist de promo credits regel
- "Oud" toont "Nieuws, Podcast, Producten" als quick links i.p.v. "Albums, Podcasts, Shop"
- Dit zijn allemaal vertaalstrings die in het JS-bundel zitten -- een ander bundel = een oudere build

## Oplossing

### 1. Service Worker Unregistratie in `src/main.tsx`
Direct bij het laden van de app, **voor** React mount, worden alle bestaande service workers uitgeschreven. Dit dwingt de browser om altijd verse bestanden op te halen.

```typescript
// Unregister any stale service workers from previous PWA builds
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}
```

### 2. Verwijder `vite-plugin-pwa` uit dependencies
Het pakket wordt niet gebruikt en de aanwezigheid ervan is verwarrend. Verwijderen uit `package.json`.

### 3. Cache-busting versterking in `index.html`
Voeg een no-cache `<meta>` tag toe zodat browsers die de `_headers` file negeren, alsnog geen HTML cachen.

## Bestanden die aangepast worden

| Bestand | Wijziging |
|---------|-----------|
| `src/main.tsx` | Service worker unregistratie toevoegen (5 regels, bovenaan voor React) |
| `package.json` | `vite-plugin-pwa` verwijderen |
| `index.html` | Cache-control meta tags toevoegen |

## Verwacht resultaat
Na deze fix zal de service worker bij het eerst laden worden verwijderd, waarna de browser altijd de nieuwste JS-bundels ophaalt. Het probleem van "terugvallen naar oude versie" zal niet meer voorkomen.
