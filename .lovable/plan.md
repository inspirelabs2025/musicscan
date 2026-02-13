
# Discogs Account Viewer - Collection, Wantlist & Inventory

## Wat wordt er gebouwd?
Een nieuwe pagina/sectie binnen de app waar je je eigen Discogs-account kunt bekijken:
- **Collection** - Alle releases in je Discogs collectie
- **Wantlist** - Je wensenlijst op Discogs  
- **Inventory** (Marketplace) - Je actieve "For Sale" listings

## Aanpak

### 1. Nieuwe Edge Function: `fetch-discogs-user-data`
Een edge function die de Discogs API bevraagt met de OAuth tokens van de gebruiker. Ondersteunt drie modi:

- `GET /users/{username}/collection/folders/0/releases` - Hele collectie ophalen
- `GET /users/{username}/wants` - Wantlist ophalen
- `GET /users/{username}/inventory` - Marketplace listings ophalen

De functie hergebruikt de bestaande `makeAuthenticatedRequest` helper (OAuth 1.0a signing) en respecteert rate limits (1.1s delay). Paginering wordt ondersteund via de Discogs `page` en `per_page` parameters.

### 2. React Hook: `useDiscogsAccountData`
Een hook die de edge function aanroept met een `target` parameter (collection/wantlist/inventory). Bevat:
- Paginering support
- Caching via React Query
- Loading/error states

### 3. Nieuwe pagina: `/mijn-discogs`
Een pagina met 3 tabs (Collection, Wantlist, Marketplace) die elk een lijst/grid tonen met:
- Album artwork (thumbnail van Discogs)
- Artiest + titel
- Label, catalogusnummer, jaar
- Conditie (bij collection/marketplace)
- Prijs (bij marketplace listings)
- Link naar Discogs pagina

De pagina is alleen toegankelijk voor ingelogde gebruikers met een gekoppeld Discogs account.

### 4. Navigatie & toegang
- Link toevoegen in het collectie-gedeelte / navigatiemenu
- Alleen zichtbaar wanneer Discogs gekoppeld is

## Technische Details

### Edge Function `fetch-discogs-user-data/index.ts`
- Authenticatie: Bearer token van gebruiker, OAuth 1.0a signing voor Discogs API
- Haalt tokens op uit `discogs_user_tokens` tabel (via service role client)
- Parameters: `target` (collection/wantlist/inventory), `page`, `per_page` (max 50)
- Response: array van releases met metadata + paginering info
- Rate limit: 1.1s delay respecteren, maar per request wordt slechts 1 API call gedaan dus geen interne delay nodig

### Hook `useDiscogsAccountData.ts`
```text
useDiscogsAccountData(target, page) 
  -> POST edge function
  -> returns { items, pagination: { page, pages, items } }
```

### Pagina structuur
```text
/mijn-discogs
  ├── Tabs: Collection | Wantlist | Marketplace
  ├── Zoekbalk (client-side filter)
  ├── Grid van items (hergebruik bestaande card-stijl)
  └── Paginering onderaan
```

### Discogs API endpoints gebruikt
| Target | Endpoint | Methode |
|--------|----------|---------|
| Collection | `/users/{username}/collection/folders/0/releases?page=X&per_page=50` | GET |
| Wantlist | `/users/{username}/wants?page=X&per_page=50` | GET |
| Inventory | `/users/{username}/inventory?page=X&per_page=50&status=For+Sale` | GET |

### Route toevoegen
- `/mijn-discogs` in de router configuratie
- Menu-item in navigatie (onder "Scan & Collectie" of naast de Discogs connect button)
