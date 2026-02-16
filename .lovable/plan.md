
# Tijdelijke Hard Refresh Button in Header

## Wat wordt er gedaan
Een opvallende "refresh" button toevoegen in de header (Navigation component), naast het logo, die een harde refresh uitvoert om alle gecachte pagina's te vernieuwen.

## Technisch Detail

### Bestand: `src/components/Navigation.tsx`

- Een `RefreshCw` icon importeren uit `lucide-react`
- Na het logo (zowel desktop als mobiel) een button toevoegen:
  - Kleine paarse button met een refresh-icoon
  - `onClick` handler die `window.location.reload()` aanroept (forceert een volledige herlaadbeurt)
  - Voorafgaand aan reload worden alle caches gewist via `caches.delete()`
  - Label: "🔄" of refresh icon, compact
- Desktop: naast het logo op regel ~150
- Mobiel: naast het gecentreerde logo op regel ~314

### Refresh logica
```text
1. Wis alle browser caches (via caches API)
2. Wis sessionStorage reload-key
3. Forceer window.location.reload()
```

Dit is bewust een tijdelijke toevoeging die later weer verwijderd kan worden.
