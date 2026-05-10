## Doel
Een gast (niet-ingelogde gebruiker) op `/ai-scan-v2` mag maximaal **10 chatberichten** sturen naar Magic Mike. Daarna wordt verdere chat geblokkeerd en krijgt de gast een login/registratie prompt. Ingelogde gebruikers behouden hun bestaande limieten via `useUsageTracking` (geen verandering).

## Wat telt als 1 "chat"
Elk POST-request van een gast naar de `scan-chat` edge function = 1 chat. Foto-upload + tekst in één bericht = 1 chat. Volgvragen tellen elk apart.

## Identificatie van een gast
Combinatie van:
- `x-device-fingerprint` header (al aanwezig, via `getDeviceFingerprint()`)
- IP-adres als fallback (al gelogd)

We tellen op **device fingerprint** als hoofdsleutel met IP als secundair (om reset te voorkomen bij wisselen van fingerprint vanaf hetzelfde IP).

## Wijzigingen

### 1. Database (migratie)
Nieuwe tabel `guest_chat_usage`:
- `fingerprint` (text, primary key)
- `ip_address` (text)
- `chat_count` (int, default 0)
- `first_seen_at`, `last_seen_at` (timestamptz)

RLS aan, geen public policies — alleen service role schrijft (vanuit edge function).

RPC functie `increment_guest_chat(p_fingerprint, p_ip)` die het aantal returnt en ophoogt (atomisch, UPSERT).

### 2. Edge function `scan-chat`
Vóór de AI-call:
- Als er **geen `userId`** is (gast):
  - Lees `x-device-fingerprint` + IP
  - Roep `increment_guest_chat` aan
  - Als nieuwe count > **10**: return HTTP 403 met JSON `{ error: 'guest_limit_reached', limit: 10 }`
- Ingelogde users: ongewijzigd

### 3. Frontend `ScanChatTab.tsx`
- Detecteer `guest_limit_reached` response in `sendMessage` 
- Toon vriendelijke modal/banner: *"Je hebt je 10 gratis chats gebruikt. Maak een gratis account aan om verder te chatten en je scans op te slaan."* met knoppen **Inloggen** / **Registreren** (links naar `/auth`)
- Disable de Send-knop + foto-upload knoppen wanneer de limiet bereikt is (state `guestLimitReached`)
- Optioneel: toon een subtiele teller bovenin chat voor gasten ("Nog 7 van 10 gratis chats")

### 4. Tekst toevoegen aan `LanguageContext` (NL + EN)
- `guestLimitTitle`, `guestLimitMessage`, `guestRemainingChats`

## Wat niet verandert
- Save-to-collection blijft login-only (zoals nu)
- V2 pipeline / foto-analyse zelf krijgt geen aparte limiet — die loopt mee in de chat-call dus wordt automatisch begrensd
- Bestaande `checkScanRate` (abuse alert) blijft staan

## Edge cases
- Gast logt in halverwege → telling wordt niet meer gebruikt; telt vanaf dat moment via `useUsageTracking`
- Fingerprint wissel (incognito): nieuwe teller mogelijk, maar IP-veld maakt admin-monitoring mogelijk
- Geen rate-limit-style blocking op IP zelf (we hebben geen rate-limit primitives — dit is alleen een gast-quota)

## Bestanden die wijzigen
- **Migratie**: nieuwe tabel + RPC
- `supabase/functions/scan-chat/index.ts` — guest check toevoegen
- `src/components/scanner/ScanChatTab.tsx` — limiet-handling + UI
- `src/contexts/LanguageContext.tsx` — vertalingen
