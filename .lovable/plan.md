## Doel

Maak het mogelijk om naar **alle** Discogs-contacten met een bestaande conversatie een bericht te sturen, ongeacht orderstatus. Verwijder false-negatives en blokkerende UI-gates.

## Wijzigingen

### 1. `supabase/functions/discogs-order-message/index.ts`
- POST 2xx van Discogs = **direct success**. Geen verplichte GET-verificatie meer.
- GET-verificatie wordt best-effort: respons opslaan in `discogs_order_messages` als hij binnenkomt, maar **nooit** een 502/error teruggeven als verificatie faalt.
- 4xx/5xx van Discogs blijven errors met de ruwe Discogs-respons in de payload (voor admin-zichtbaarheid).
- `isFreshMessage` / `findConfirmedSentMessage` gating verwijderd uit het success-pad.

### 2. `src/pages/admin/AdminDiscogsMessages.tsx`
- **Verwijder** `ACTIVE_DISCOGS_STATUSES` blokkade: alle orders met een conversatie zijn selecteerbaar.
- `hasRestrictedStatus` / `isActiveOrderStatus` worden info-only (badge "⚠ mogelijk geweigerd door Discogs"), geen disable + geen toast-block in `toggleOrder`.
- `Checkbox` niet meer `disabled` voor closed orders.
- Knop heet weer **"Selecteer alles"** en selecteert alles in de huidige lijst. Extra knop **"Selecteer actieve orders"** als sneltoets blijft beschikbaar.
- `handleBulkSend` behandelt `success: true` (ongeacht `confirmed`) als verzonden. Failures tonen de Discogs-foutmelding per order.

### 3. Datasource
- Geen schemawijziging. Bron blijft `discogs_orders` gefilterd op orders waarvoor minimaal één rij in `discogs_order_messages` bestaat (bestaande query behouden / lichte aanpassing van filter).

## Buiten scope
- Geen wijziging aan `discogs-bulk-email`, inbound sync, of database schema.
- Geen Resend-fallback.
- Geen wijziging aan andere admin-pagina's.

## Validatie
1. Open `/admin/discogs-messages`, selecteer een `Shipped` order met conversatie → checkbox werkt, selectie blijft staan.
2. Verstuur testbericht → edge function logs tonen POST, UI toont success of de échte Discogs-foutmelding.
3. "Selecteer alles" selecteert elke order in de lijst.
