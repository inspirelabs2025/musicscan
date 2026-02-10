
# Scan Chat Tab - met foto-upload flow

## Overzicht
Een "Chat" tab toevoegen aan de AI Scan V2 pagina met dezelfde startopzet als de foto-scanner: eerst mediatype kiezen, dan foto's uploaden, maar daarna in een chatgesprek de juiste release vinden in plaats van een automatische analyse.

## Gebruikersflow

1. Gebruiker opent de pagina en ziet 2 tabs: **Foto Scanner** | **Chat**
2. In de Chat tab:
   - Stap 1: Selecteer mediatype (Vinyl / CD) - zelfde knoppen als scanner
   - Stap 2: Upload foto's (zelfde upload-grid als scanner, met labels per foto)
   - Stap 3: Chat opent zich - foto's worden automatisch als context meegestuurd
   - De AI analyseert de foto's, stelt vragen, en helpt de juiste release te vinden
3. Quick-prompt knoppen beschikbaar: "Analyseer mijn foto's", "Zoek op barcode", "Welke persing is dit?"

## Wijzigingen

### 1. Nieuw: `supabase/functions/scan-chat/index.ts`
- Ontvangt berichten + foto URLs + mediaType als context
- Bij eerste bericht worden foto's automatisch meegegeven aan de AI als image content
- Gebruikt Lovable AI (google/gemini-3-flash-preview) met streaming (SSE)
- System prompt: muziek-release identificatie expert die OCR doet op foto's, matrix/barcode/catalogusnummers herkent, en Discogs doorzoekt
- Geen tool-calling in v1 - de AI beschrijft wat het ziet en doet suggesties

### 2. Nieuw: `src/components/scanner/ScanChatTab.tsx`
- **Fase 1 (setup):** MediaType selectie + foto upload grid (hergebruikt dezelfde UI-patronen als AIScanV2)
- **Fase 2 (chat):** Na minimaal 1 foto verschijnt de chatinterface
  - Berichtenlijst in ScrollArea met markdown rendering
  - Token-by-token streaming weergave
  - Quick-prompt knoppen
  - Invoerveld + verzendknop
- Automatisch eerste bericht: stuurt foto's naar AI met vraag "Wat zie je op deze foto's?"

### 3. Wijziging: `src/pages/AIScanV2.tsx`
- Tabs wrapper toevoegen (Radix Tabs, al beschikbaar)
- Tab 1: "Foto Scanner" - bevat de volledige bestaande flow
- Tab 2: "Chat" - rendert ScanChatTab component
- Geen gedeelde state nodig - elke tab werkt onafhankelijk

### 4. Wijziging: `supabase/config.toml`
- Nieuwe entry: `[functions.scan-chat]` met `verify_jwt = false`

## Technische Details

### Edge Function `scan-chat`
- Accepteert `{ messages, photoUrls?, mediaType? }` als POST body
- Eerste bericht bevat foto's als base64/URL image content parts voor het vision model
- System prompt bevat instructies voor OCR, matrix herkenning, barcode detectie, Discogs kennis
- Streamt respons via SSE
- Foutafhandeling voor 429/402 rate limits

### ScanChatTab component structuur
```text
ScanChatTab
  +-- Setup fase (als geen foto's)
  |   +-- MediaType keuze (Vinyl/CD knoppen)
  |   +-- Foto upload grid (ScannerUploadZone hergebruik)
  |   +-- "Start Chat" knop
  +-- Chat fase (na foto's + start)
      +-- ScrollArea met berichten
      |   +-- UserMessage (tekst)
      |   +-- AssistantMessage (markdown, streaming)
      +-- Quick prompts (chips)
      +-- Input + Send knop
```

### Bestanden

| Actie | Bestand |
|-------|---------|
| Nieuw | `supabase/functions/scan-chat/index.ts` |
| Nieuw | `src/components/scanner/ScanChatTab.tsx` |
| Wijzig | `src/pages/AIScanV2.tsx` |
| Wijzig | `supabase/config.toml` |
