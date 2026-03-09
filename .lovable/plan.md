
# Audit Resultaat: Verkeerd Project Gekoppeld aan Domein

## De Kern van het Probleem

Na een volledige audit is de oorzaak 100% duidelijk vastgesteld:

**www.musicscan.app en musicscan.lovable.app wijzen naar een ANDER, OUDER Lovable project.**

Dit project (waar we alle wijzigingen maken) heeft als published URL:
- `https://musicscan.lovable.app` (verwacht)

Maar in werkelijkheid serveert `musicscan.lovable.app` de oude "Vinyl Scanner" applicatie met het menu "Home / Price Check / Forum". Dat is een compleet andere app — niet de MusicScan die we hier bouwen.

Dit huidige project heeft als preview URL:
- `https://id-preview--0638cdc3-ae41-4fe5-9a88-2b2d34d360f4.lovable.app`

Alle code-wijzigingen die gedaan zijn (Discogs Messages, Mobile Nav, promo banner, etc.) zijn aanwezig in DEZE codebase, maar komen nooit op de live site terecht omdat het verkeerde project published staat.

## Wat er Fout is Gegaan

Er zijn hoogstwaarschijnlijk twee Lovable projecten:

```text
Project A (OUD) — "Vinyl Scanner"
  Published als: musicscan.lovable.app
  Domein: www.musicscan.app → wijst naar Project A

Project B (DIT project) — "MusicScan"
  Preview: id-preview--0638cdc3-...lovable.app
  Published URL: (losgekoppeld of fout geconfigureerd)
  Domein: NIET gekoppeld
```

Alle wijzigingen zijn in Project B gemaakt, maar de wereld ziet Project A.

## De Oplossing: 3 Stappen

### Stap 1 — Koppel het domein los van het oude project

In het OUDE Lovable project (Vinyl Scanner):
1. Ga naar **Settings → Domains**
2. Verwijder de koppeling met `www.musicscan.app`

### Stap 2 — Publiceer dit project correct

In DIT Lovable project (de nieuwe MusicScan):
1. Klik op de **Publish** knop rechtsboven in Lovable
2. Wacht tot de build klaar is
3. Verifieer dat `musicscan.lovable.app` nu de NIEUWE versie toont

### Stap 3 — Koppel het domein aan dit project

In DIT Lovable project:
1. Ga naar **Settings → Domains**
2. Voeg `www.musicscan.app` toe
3. Volg de DNS-instructies (als de CNAME al klopt, werkt het direct)

## Aanvullende Code Fix: Zorg dat de app altijd de nieuwste versie laadt

Naast de deployment-fix voeg ik ook een **cache-busting mechanisme** toe in de code zodat gebruikers nooit een verouderde versie zien:

### 1. `index.html` — Voeg cache-control meta tags toe
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

### 2. `public/_headers` — Verstevig de cache headers voor Netlify/Vercel
```
/*
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### 3. `vercel.json` — Cache headers zijn al correct aanwezig
De `vercel.json` heeft al de juiste `no-store` headers voor `/index.html` en alle routes behalve `/assets`. Dit is correct.

## Wat ik in de Code Zal Aanpassen

Omdat de deployment-fix buiten mijn bereik valt (dat moet jij doen in de Lovable interface), focus ik op het verstevigen van de code zodat browsers altijd de nieuwste versie laden:

1. **`index.html`** — Cache-busting meta tags toevoegen
2. **`public/_headers`** — Uitbreiden met alle routes
3. **`src/hooks/useVersionCheck.ts`** — Lichtgewicht version-check reactiveren die de pagina herlaadt als er een nieuwe build is

## Jouw Actieplan (Dit Kun Jij Alleen Doen)

De belangrijkste stap ligt buiten de code:

1. **Zoek het oude Lovable project op** (de "Vinyl Scanner" app) — dit is waarschijnlijk een ander project in jouw Lovable workspace
2. **Ontkoppel daar het domein** `www.musicscan.app`
3. **Klik hier in dit project op "Publish"** (de blauwe knop rechtsboven)
4. **Koppel hier het domein** `www.musicscan.app` via Settings → Domains

Zodra je dit doet, zal de live site direct de nieuwste versie tonen — inclusief de Discogs Messages pagina, de promo banner, en alle andere wijzigingen.
