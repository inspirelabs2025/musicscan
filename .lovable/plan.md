

# Fix: Oude Versie / Caching Probleem Oplossen

## Diagnose

Na grondig onderzoek heb ik drie concrete problemen gevonden:

### Probleem 1: Browser cache serveert oude code
De preview toont tekst ("Smart Foto Analyse V2", "GPT-4.1 en multi-pass technologie", "Ingelogd als:") die **niet meer in de broncode staat**. De huidige code zegt "Smart Scan" en "Ontdek supersnel de juiste album release". Dit bewijst dat de browser een oude gecachte versie laadt.

**Oorzaak**: Hoewel `vercel.json` en `public/_headers` no-cache headers hebben, ontbreekt er een mechanisme om de browser te **dwingen** een nieuwe versie te laden. De `build-version` meta tag in `index.html` is statisch (`2026-02-11T12:00:00Z`) en wordt nergens gecontroleerd.

### Probleem 2: FloatingMikeChat database-fout
Console error: `invalid input syntax for type uuid: "floating-mike-global"`. De `session_id` kolom in `chat_messages` verwacht een UUID, maar de code stuurt een gewone string.

### Probleem 3: check-subscription wordt 8x per minuut aangeroepen
`useSubscription()` pollt elke 30 seconden en wordt in 4+ componenten tegelijk gebruikt. Elke instantie maakt een eigen interval aan = 8+ onnodige API-calls per minuut.

## Oplossingen

### 1. Versie-detectie met automatische refresh
- Voeg een dynamische `BUILD_VERSION` constant toe (timestamp van build)
- Maak een `useVersionCheck` hook die periodiek de huidige HTML ophaalt en de build-version vergelijkt
- Bij een mismatch: toon een subtiele banner "Er is een nieuwe versie beschikbaar" met een refresh-knop
- Na 3 mismatches: automatisch herladen

### 2. Fix FloatingMikeChat session_id
- Genereer een echte UUID voor de floating Mike sessie per gebruiker (bijv. `crypto.randomUUID()` of een deterministische UUID op basis van `user.id`)
- Gebruik een vaste prefix-gebaseerde UUID: neem de `user.id` als session-id, of genereer eenmalig een UUID en sla die op in localStorage

### 3. Optimaliseer check-subscription
- Verplaats `useSubscription` naar een React Context (SubscriptionContext), zodat er maar 1 instantie draait
- Alle 4 componenten consumeren dezelfde context in plaats van elk hun eigen polling te starten
- Verlaag polling frequentie naar 60 seconden (was 30s)

## Technische Details

### Bestanden die aangepast worden

1. **`src/hooks/useVersionCheck.ts`** (nieuw)
   - Periodiek (elke 5 min) een fetch naar `/index.html` met cache-busting query param
   - Parse de `build-version` meta tag uit de response
   - Vergelijk met de ingebakken versie
   - Return `{ updateAvailable, refresh }` state

2. **`src/components/VersionBanner.tsx`** (nieuw)
   - Dunne banner bovenaan wanneer een update beschikbaar is
   - "Klik om te vernieuwen" knop

3. **`index.html`**
   - Update `build-version` meta tag bij elke build

4. **`src/components/FloatingMikeChat.tsx`**
   - Vervang `'floating-mike-global'` door een geldige UUID-strategie (bijv. `user.id` als session key, of een deterministische UUID)

5. **`src/contexts/SubscriptionContext.tsx`** (nieuw)
   - Wrap de `useSubscription` logica in een Context Provider
   - Eenmalige polling (60s interval)
   - Alle componenten gebruiken `useSubscriptionContext()` in plaats van `useSubscription()`

6. **`src/App.tsx`**
   - Integreer `SubscriptionProvider` en `VersionBanner`

7. **`src/pages/AIScanV2.tsx`**, **Dashboard.tsx**, **Pricing.tsx**, **SubscriptionStatus.tsx**
   - Vervang `useSubscription()` door `useSubscriptionContext()`

