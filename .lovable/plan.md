
# Marketplace Listings ophalen voor gescande releases

## Wat verandert er?
Na een succesvolle scan toont Mike niet alleen de prijsstatistieken (laag/mediaan/hoog), maar ook een overzicht van de actuele aanbiedingen op de Discogs Marketplace -- hoeveel exemplaren, tegen welke prijs en in welke conditie.

## Aanpak

### 1. Nieuwe edge function: `fetch-discogs-marketplace-listings`
Haalt de actuele marketplace listings op voor een release ID via de Discogs API.

**Endpoint:** `GET https://api.discogs.com/marketplace/listings?release_id={id}&curr=EUR&sort=price,asc&per_page=10`

Alternatief (als het officiele API endpoint geen release-filter ondersteunt): scrapen van `https://www.discogs.com/sell/release/{id}?curr=EUR` via ScraperAPI, met extractie van:
- Aantal te koop
- Per listing: prijs, conditie (media + sleeve), verkoper, land

**Response format:**
```json
{
  "total_for_sale": 4,
  "listings": [
    {
      "price": 25.00,
      "currency": "EUR",
      "condition_media": "Very Good Plus (VG+)",
      "condition_sleeve": "Very Good (VG)",
      "seller": "VinylShopNL",
      "ships_from": "Netherlands"
    }
  ]
}
```

### 2. Integratie in de V2-pipeline (ScanChatTab.tsx)
Na een succesvolle scan (wanneer `discogs_id` beschikbaar is), een extra call doen naar de nieuwe edge function. De resultaten worden opgeslagen in de `pricingData` (uitgebreid met `marketplace_listings`).

### 3. UI: Marketplace overzicht in chat resultaat
Onder de bestaande prijskaart een compact overzicht tonen:

```
🏪 4 exemplaren te koop op Discogs
┌─────────┬──────────────┬────────────┐
│ €25.00  │ VG+ / VG     │ Nederland  │
│ €30.00  │ NM / VG+     │ Duitsland  │
│ €35.00  │ NM / NM      │ UK         │
│ €45.00  │ M / M        │ Frankrijk  │
└─────────┴──────────────┴────────────┘
```

Met een "Bekijk alle aanbiedingen" link naar `https://www.discogs.com/sell/release/{id}`.

---

## Technische details

### Nieuwe edge function: `supabase/functions/fetch-discogs-marketplace-listings/index.ts`

- Accepteert `{ discogs_id }` als POST body
- Strategie 1: Discogs API `GET /marketplace/listings?release_id={id}&curr=EUR&sort=price,asc&per_page=10` (met DISCOGS_TOKEN)
- Strategie 2 (fallback): ScraperAPI scraping van `/sell/release/{id}?curr=EUR` met HTML parsing
- Retourneert gestructureerde listings array + totaal aantal

### Wijzigingen in `src/components/scanner/ScanChatTab.tsx`

1. **Interface uitbreiden:**
```typescript
interface MarketplaceListing {
  price: number;
  currency: string;
  condition_media: string;
  condition_sleeve: string;
  seller: string;
  ships_from: string;
}

interface PricingData {
  lowest_price: number | null;
  median_price: number | null;
  highest_price: number | null;
  num_for_sale: number | null;
  marketplace_listings?: MarketplaceListing[];
}
```

2. **Na V2 pipeline succes:** Extra fetch naar `fetch-discogs-marketplace-listings` met het `discogs_id`, resultaat toevoegen aan `pricingData`.

3. **UI rendering:** Onder de prijskaart een compacte tabel met max 5 listings (prijs, conditie, land). Plus een link naar de volledige Discogs sell-pagina.

### Bestaande `fetch-discogs-pricing` functie
Blijft ongewijzigd -- die haalt statistieken (historische verkoopdata). De nieuwe functie haalt actuele aanbiedingen.
