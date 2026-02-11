

## Probleem

De mobiele live versie toont de oude homepage omdat de browser een gecachte versie van `index.html` serveert. Er is geen service worker actief (geen vite-plugin-pwa geinstalleerd), dus het is puur een HTTP-cache probleem.

## Oplossing

### Stap 1: Cache-Control headers voor index.html

Voeg no-cache headers toe aan zowel `vercel.json` als `public/_redirects`/`public/_headers` zodat `index.html` nooit gecached wordt door de browser, ongeacht het hosting platform.

**Nieuw bestand: `public/_headers`**
```
/index.html
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0

/
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0
```

**Update: `vercel.json`** - Headers toevoegen voor index.html/root:
```json
{
  "source": "/((?!assets|lovable-uploads).*)",
  "headers": [
    { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
  ]
}
```
Dit zorgt ervoor dat alleen statische assets (JS/CSS in `/assets/` en uploads) lang gecached worden, terwijl HTML-pagina's altijd vers opgehaald worden.

### Stap 2: Build-version meta tag updaten

De `build-version` meta tag in `index.html` staat op `2025-11-06` (maanden oud). Deze updaten naar de huidige datum zodat duidelijk is welke versie live staat.

### Stap 3: Herpubliceren

Na deze wijzigingen moet het project opnieuw gepubliceerd worden via de "Update" knop in de Publish-dialog. Frontend changes gaan pas live na publicatie.

## Technische details

- `public/_headers` wordt door Netlify/Lovable hosting automatisch opgepikt
- `vercel.json` headers gelden voor Vercel hosting
- Assets in `/assets/` en `/lovable-uploads/` behouden hun lange cache (immutable) omdat ze content-hashed zijn
- Alle andere routes (HTML/SPA) krijgen no-cache zodat de browser altijd de nieuwste versie laadt

## Verwacht resultaat

Na publicatie zal de mobiele browser altijd de nieuwste `index.html` ophalen, waardoor de nieuwe homepage direct zichtbaar is zonder dat gebruikers handmatig hun cache hoeven te legen.

