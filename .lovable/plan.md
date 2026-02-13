

# Discogs Export Systeem - Implementatieplan

## Wat wordt er gebouwd?
Een systeem waarmee gebruikers hun CD's en vinyl uit hun MusicScan collectie kunnen exporteren naar hun persoonlijke Discogs account (Collection, Wantlist of Marketplace). Dit werkt via Discogs OAuth 1.0a zodat elke gebruiker zijn eigen Discogs account koppelt.

## Overzicht van de stappen

### Stap 1: Database tabel voor Discogs tokens
Nieuwe tabel `discogs_user_tokens` om per gebruiker de OAuth tokens veilig op te slaan:
- `user_id` (referentie naar auth user)
- `discogs_username`, `discogs_user_id`
- `oauth_token`, `oauth_token_secret`
- `connected_at`, `updated_at`
- RLS: gebruiker kan alleen eigen tokens lezen/schrijven

### Stap 2: Edge Function `discogs-oauth-start`
Start de OAuth 1.0a flow:
- Haalt een request token op bij Discogs
- Slaat het tijdelijke token op (in database of in-memory)
- Stuurt de gebruiker door naar Discogs authorize URL
- Callback URL wijst terug naar de app

### Stap 3: Edge Function `discogs-oauth-callback`
Verwerkt de terugkeer van Discogs:
- Wisselt request token in voor een permanent access token
- Haalt Discogs identity op (username, user ID)
- Slaat tokens op in `discogs_user_tokens`
- Redirect terug naar de app met succes-status

### Stap 4: Edge Function `discogs-collection-export`
De daadwerkelijke export functie:
- Accepteert een lijst van item IDs + doeltype (collection/wantlist)
- Haalt de gebruiker's Discogs tokens op
- Stuurt elk item (op basis van `discogs_id`) naar de Discogs API
- Respecteert rate limits (1 request per seconde)
- Rapporteert succes/falen per item

### Stap 5: Frontend - Discogs koppeling in profiel/instellingen
- Knop "Koppel je Discogs account" in het profiel of collectie-pagina
- Status indicator: gekoppeld/niet gekoppeld
- Mogelijkheid om te ontkoppelen

### Stap 6: Frontend - Export UI in collectie
- Bulk-select functionaliteit in de collectie-weergave
- "Exporteer naar Discogs" knop (alleen zichtbaar bij items met `discogs_id`)
- Keuze: Collection of Wantlist
- Voortgangsindicator tijdens export
- Resultaat-samenvatting (X geslaagd, Y mislukt)

---

## Technische Details

### OAuth 1.0a Flow
```text
+----------+     1. Request Token     +---------+
| MusicScan| -----------------------> | Discogs |
|  (Edge)  | <----------------------- |   API   |
+----------+   temp token + secret    +---------+
     |
     | 2. Redirect user
     v
+-----------+    3. User authorizes   +---------+
|  Browser  | ----------------------> | Discogs |
|           | <---------------------- |  Auth   |
+-----------+   redirect + verifier   +---------+
     |
     | 4. Callback
     v
+----------+   5. Access Token        +---------+
| MusicScan| -----------------------> | Discogs |
|  (Edge)  | <----------------------- |   API   |
+----------+  permanent token+secret  +---------+
```

### Database Schema
```sql
CREATE TABLE discogs_user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discogs_username TEXT,
  discogs_user_id INTEGER,
  oauth_token TEXT NOT NULL,
  oauth_token_secret TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Tijdelijke request tokens voor OAuth flow
CREATE TABLE discogs_oauth_temp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  oauth_token TEXT NOT NULL,
  oauth_token_secret TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(oauth_token)
);
```

### Bestanden die aangemaakt/gewijzigd worden
- `supabase/functions/discogs-oauth-start/index.ts` (nieuw)
- `supabase/functions/discogs-oauth-callback/index.ts` (nieuw)
- `supabase/functions/discogs-collection-export/index.ts` (nieuw)
- `supabase/config.toml` (3 nieuwe function entries)
- `src/hooks/useDiscogsConnection.ts` (nieuw - hook voor koppelstatus)
- `src/hooks/useDiscogsExport.ts` (nieuw - hook voor export)
- `src/components/collection/DiscogsConnectButton.tsx` (nieuw)
- `src/components/collection/DiscogsExportDialog.tsx` (nieuw)
- Bestaande collectie-pagina wordt uitgebreid met export-knop

### Secrets die gebruikt worden
- `DISCOGS_CONSUMER_KEY` (zojuist toegevoegd)
- `DISCOGS_CONSUMER_SECRET` (zojuist toegevoegd)

