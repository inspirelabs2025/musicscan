# MusicScan edge worker

## Waarom dit bestaat

musicscans.com draait op Lovable-hosting achter Cloudflare. Dat platform leest
`vercel.json` niet en `public/_redirects` ook niet. Gemeten op 25-09-2026:

| Regel uit `_redirects` | Verwacht | Werkelijk |
|---|---|---|
| `/sitemap-llm.xml` → edge function | XML | 404 |
| `/sitemap-podcasts.xml` → edge function | XML | 404 |
| `/plaat-verhaal/*` → SSR-proxy | geïnjecteerde HTML | kale shell |
| `/art-prints` → `/shop` | 301 | 200 (SPA) |
| `/product/*` → `/art-shop` | 301 | 200 (SPA) |

Geen enkele regel werkt. Daarom staan ze hier, in een worker die wél draait.

## Uitrollen

```bash
cd cloudflare
npx wrangler login          # eenmalig, in het Cloudflare-account dat de zone beheert
npx wrangler deploy
```

Voorwaarde: de zone `musicscans.com` moet in dát Cloudflare-account zitten.
De nameservers zijn `dakota.ns.cloudflare.com` en `dee.ns.cloudflare.com`.

## Controleren na uitrol

```bash
curl -sI https://musicscans.com/sitemap-llm.xml | head -1          # 200, niet 404
curl -s -A Googlebot https://musicscans.com/plaat-verhaal/… | grep '<title>'
                                                                    # eigen titel, niet de homepage
curl -sI https://musicscans.com/art-prints | head -1                # 301 naar /shop
curl -s https://musicscans.com/ | grep x-musicscan-edge             # header aanwezig
```

## Let op

`universal-ssr-proxy` zet nu hardcoded `noindex, follow` op alles wat hij
serveert. Vóór de waardepagina's live gaan moet die regel per contenttype
beslist worden — zie sectie 2b van de bouwspecificatie.
