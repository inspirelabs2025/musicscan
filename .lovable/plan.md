## Wat ik gevonden heb

**Symptoom:** Op `/admin/discogs-messages` kun je een bericht typen en op "Verstuur" drukken, maar er gebeurt niets — geen toast, geen DB-rij, geen Resend-call.

**Bevestigde feiten uit DB + edge logs:**
- De edge function `discogs-order-message` heeft **0 logs van een POST/send** — hij is dus nooit echt aangeroepen voor een bulk-send (alleen mode=list / mijn testcall).
- `discogs_order_messages` bevat alleen oude inbound berichten, niets van recente admin-sends.
- Admin (`rogiervisser76@gmail.com`) heeft wel een geldige `discogs_user_tokens`-rij → auth is dus niet het probleem.
- De function code zelf is correct (OAuth1 signing + POST naar `marketplace/orders/{id}/messages`).

**Root cause = double-toggle bug in de UI (regel 272-284):**

```tsx
<div onClick={() => toggleOrder(order.discogs_order_id)}>   // hele kaart
  <Checkbox onCheckedChange={() => toggleOrder(order.discogs_order_id)} />
  ...
</div>
```

Als je op de **checkbox** klikt vuren BEIDE handlers (checkbox → `onCheckedChange`, daarna bubbelt het click event naar de parent `div` → `onClick`). `toggleOrder` draait twee keer met dezelfde id → Set wordt toegevoegd én meteen weer verwijderd → **netto geen selectie**.

Gevolg: `selectedOrders.size` blijft 0, de Verstuur-knop blijft `disabled`, of als hij wel aanstond door eerdere clicks op de kaart-rand komt de early-return `selectedOrders.size === 0` toast in beeld. Niets bereikt ooit de edge function — vandaar de 0 logs.

**Secundair probleem (na fix):** Alle orders in de DB hebben status `Shipped` of `Cancelled`. De Discogs Marketplace Messages API weigert berichten op gesloten orders (403/404). Zelfs na de UI-fix gaan de meeste sends mislukken. We willen dat zichtbaar maken i.p.v. ze stil te tellen als "failed".

## Wat ik wil doen (minimaal, binnen scope)

### 1. Fix selectie-bug in `src/pages/admin/AdminDiscogsMessages.tsx`
- Verwijder `onClick={() => toggleOrder(...)}` van de buitenste `<div>` (regel 279) en laat alleen de `Checkbox` (en evt. een expliciete label-klik) de toggle aanroepen, **of** behoud de kaart-klik en stop bubbling vanaf de Checkbox met `onClick={(e) => e.stopPropagation()}` zodat de checkbox alleen via de native onCheckedChange schakelt.
- Voorkeur: checkbox + label-klik op de kaart, met `stopPropagation` op de checkbox zelf. Eén code-pad → één toggle.

### 2. Robuustere error-rapportage in `handleBulkSend`
- Verzamel per order een resultaat-rij `{ orderId, status: 'sent' | 'failed', errorMessage }`.
- Toon na afloop een lijst met de specifieke Discogs-API foutmeldingen (bv. "403 — order is shipped") i.p.v. alleen `sent/failed` aantallen, zodat duidelijk is waarom een send faalt.
- Console.error blijft, plus een destructive toast als 0 succesvol.

### 3. Pre-filter / waarschuwing voor niet-messagable statussen
- In de Select-dropdown of als hint boven de orderlijst: tonen dat `Shipped` en `Cancelled (*)` orders door Discogs geweigerd worden.
- Default `statusFilter` blijft `all`, maar we voegen een visuele badge "⚠ niet messagable" toe op rijen met die statussen, zodat de admin ze niet per ongeluk selecteert.

### 4. Verifiëren
- Na de fix: één order selecteren via checkbox, kijken of `selectedOrders.size` → 1 wordt, edge function logs checken op POST, en de Discogs-respons zichtbaar maken in de UI.

## Buiten scope
- Geen wijzigingen aan `AdminDiscogsBulkEmail.tsx` of `send-discogs-bulk-email` / `refresh-delivery-status` (die werkten in de laatste test).
- Geen wijziging aan de edge function `discogs-order-message` — die werkt; we verbeteren alleen hoe de client met zijn errors omgaat.