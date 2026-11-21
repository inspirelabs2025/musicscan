# Trading Desk: een nieuwe handelspagina voor Discogs-verkopers en -verzamelaars

Een nieuwe, aparte pagina **/trading** ("Trading Desk"). Bestaande pagina's (Mijn Discogs, Marktplaats, Berichten, Collectie) blijven exact zoals ze zijn. De nieuwe pagina gebruikt de Discogs-koppeling die gebruikers al hebben, en bestaande gegevens worden alleen gelezen.

## Wat de gebruiker krijgt

```text
/trading
 ├─ Overzicht      : portefeuillewaarde, grafiek, "te duur / te goedkoop" teller
 ├─ Mijn listings  : per plaat je prijs vs. marktprijs, signaal + mini-grafiek
 ├─ Plaat-detail   : prijsverloop (lijn/candle-achtig), laagste/mediaan/hoogste
 ├─ Matches        : wie zoekt jouw platen (wantlist) → "Stuur bericht"
 ├─ Wantlist-alerts: jouw gezochte platen die net te koop zijn verschenen
 ├─ Auto-prijs     : per plaat aan/uit, strategie + minimumprijs
 └─ Meldingen      : feed + instellingen (push, geluid, welke soorten)
```

1. **Prijs-check van je voorraad**: elke listing in je Discogs-inventory wordt vergeleken met de actuele marktprijs (Discogs prijssuggestie per conditie, plus laagste prijs en aantal te koop). Label: *Te duur* (>10% boven markt), *Te goedkoop* (>10% onder), *Marktconform*. De drempel kun je instellen.
2. **Marktalerts**: een melding als een plaat die jij hebt of verkoopt opnieuw op de Discogs-markt verschijnt bij een andere verkoper, met de prijsvergelijking erbij.
3. **Trading-grafieken**: een prijsverloop per plaat en de totale portefeuillewaarde door de tijd, met een tickerbalk met de grootste stijgers en dalers. De prijzen worden elk uur ververst, niet live per seconde. Discogs staat niet meer verzoeken toe.
4. **Automatisch prijs aanpassen (opt-in)**: dit staat standaard uit en zet je per plaat aan. Je kiest een strategie: *net onder de laagste*, *gelijk aan de mediaan* of *marktprijs ± %*. Er geldt altijd een minimumprijs die jij instelt. Elke wijziging wordt gelogd en is terug te draaien. De nieuwe prijs wordt via je Discogs-koppeling direct op Discogs gezet.
5. **Wishlist-matches tussen gebruikers**: als jouw te-koop-plaat op de wantlist van een andere MusicScan-gebruiker staat, krijgen jullie allebei een melding. Je opent dan een gesprek in de bestaande berichtenfunctie.
6. **Wantlist-alerts voor kopers**: een plaat op je wantlist die nieuw te koop staat, op Discogs of bij een MusicScan-verkoper, levert direct een melding op.
7. **Discogs-nieuws en -alerts**: een melding bij nieuwe Discogs-nieuwsberichten. Dit hergebruikt de bestaande nieuwsbron.
8. **Push met geluid op mobiel en pc**: browsermeldingen op pc en Android, en pushmeldingen in de telefoon-app, met een meldingsgeluid. Binnen de pagina zelf verschijnt ook een melding met geluid. Per soort melding aan of uit te zetten.

Alles draait automatisch via geplande taken, zonder dat de admin iets hoeft te doen. In het adminmenu komt een monitor-pagina met de status van de taken, het aantal alerts en eventuele fouten.

## Aannames (corrigeer gerust)

- "Wishlist" = de **Discogs-wantlist** van gebruikers die Discogs hebben gekoppeld. Matchen kan alleen tussen MusicScan-gebruikers, want Discogs geeft geen lijst van wantlists van onbekende mensen.
- De pagina is alleen voor ingelogde gebruikers met een Discogs-koppeling. Wie geen koppeling heeft, ziet de knop "Koppel Discogs", die al bestaat.
- De pagina staat in het menu onder Scan & Collectie als "Trading Desk". Op publieke pagina's komt geen "AI"-woordgebruik.

## Wat ik van jou nodig heb

- **Pushmeldingen vereisen een Firebase-project (gratis)**. Ik open een koppelkaart. Zonder die koppeling werken de meldingen in de app en de browsermeldingen terwijl de site open is, maar komen er geen meldingen binnen als de app dicht is.
- Voor push in de iPhone- en Android-app is daarna een nieuwe app-build in de stores nodig. Dat kan ik niet zelf doen.

## Testen

Ik test elke taak los met echte Discogs-data van een gekoppeld account: prijs-check, alerts, matches en auto-prijs. Auto-prijs test ik eerst als proefronde zonder schrijven. Daarna loop ik de pagina in de browser door. Ingelogd testen in de preview kan alleen als er een sessie beschikbaar is. Wat ik niet kan testen, noem ik expliciet (bijvoorbeeld push op een echte iPhone).

## Technische details

**Nieuwe tabellen** (allemaal met RLS en eigen GRANTs, eigenaar = `auth.uid()`):
- `trading_inventory_items`: een snapshot van iemands Discogs-listings (listing_id, release_id, conditie, eigen prijs, status).
- `trading_price_snapshots`: elk uur per release en conditie: suggestie, laagste, mediaan, aantal te koop. Dit is de bron voor de grafieken.
- `trading_price_signals`: het actuele label per item (te duur / te goedkoop / markt), afwijking in %.
- `trading_wantlist_items`: de gesynchroniseerde Discogs-wantlist per gebruiker.
- `trading_auto_price_rules` en `trading_price_adjustments_log`: strategie, minimumprijs, oude en nieuwe prijs, en terugdraaien.
- `trading_alerts`: de meldingenfeed (type: overpriced, underpriced, market_listing, wishlist_match, wantlist_available, discogs_news), dedupe-sleutel.
- `trading_alert_preferences`: per type aan/uit, geluid, drempel-%.
- `push_subscriptions`: FCM-tokens per apparaat.

**Edge functions** (cron, in batches binnen de Discogs-limiet van ongeveer 60 verzoeken per minuut):
- `trading-sync-inventory` en `trading-sync-wantlist` (elk uur, per gebruiker): ze gebruiken de bestaande OAuth-ondertekening.
- `trading-market-check` (elk uur): `marketplace/price_suggestions` + `marketplace/stats`, schrijft snapshots en signalen, en maakt alerts.
- `trading-match-wishlists` (elke 15 min): koppelt inventory aan andere gebruikers' wantlists, maakt alerts aan beide kanten met een bericht-link naar de bestaande `conversations`/`messages`.
- `trading-auto-price` (elk uur): past regels toe met `POST /marketplace/listings/{id}`, respecteert de minimumprijs, maximaal één wijziging per listing per 6 uur, en heeft een dryRun-modus.
- `trading-discogs-news-alerts`: haakt in op de bestaande `latest-discogs-news`.
- `send-push` (gedeeld): FCM via de Firebase-connector, en ruimt verlopen tokens op.

**Frontend**: `src/pages/TradingDesk.tsx` met tabs, recharts-grafieken (al aanwezig), hooks `useTradingInventory`, `useTradingAlerts` (realtime met opruiming), `usePriceHistory`. Een in-app toast met geluid via een klein audiobestand in `public/`. Push op web via `firebase-messaging-sw.js`, in de app via `@capacitor/push-notifications`. Er komt een nieuwe route en een menulink. Bestaande pagina's en hooks blijven onaangeroerd. Admin: `/admin/trading-monitor` in het adminmenu.
