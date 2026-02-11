

# Magic Mike Chat Verrijken met Platform Content

## Wat gaan we doen?

Na een succesvolle scan of wanneer een artiest ter sprake komt, toont Magic Mike automatisch relevante content uit het MusicScan platform: verhalen, producten, anekdotes en singles. Dit maakt de chat een ontdekkingsinterface voor al je content.

## 3 Verbeteringen

### 1. Content Cards na Scan-resultaat
Wanneer een album/artiest is geidentificeerd, zoekt de chat automatisch naar gerelateerde platform-content en toont die als visuele kaartjes direct in de chat.

- **Artiesten-verhaal** -- link naar `/artists/{slug}`
- **Album-verhalen** -- link naar `/muziek-verhaal/{slug}`
- **Singles** -- link naar `/singles/{slug}`
- **Producten** (posters, t-shirts, canvas) -- link naar `/product/{slug}`
- **Anekdotes** -- link naar `/anekdotes/{slug}`

De kaartjes verschijnen als een horizontaal scrollbare strip met artwork, titel en type-badge.

### 2. Slimmere Suggestie-chips met Platform Links
Na een scan worden de suggestie-chips uitgebreid met content-specifieke opties:
- "Lees het verhaal van [artiest]" (alleen als er een artist_story bestaat)
- "Bekijk [artiest] producten" (alleen als er producten bestaan)
- "Ken je deze anekdote?" (alleen als er anekdotes bestaan)

### 3. Context-injectie naar de Edge Function
Bij een gescande artiest sturen we een samenvatting van beschikbare platform-content mee naar de AI, zodat Magic Mike er actief naar kan verwijzen:
> "We hebben een verhaal over David Bowie, 3 singles en 12 producten op het platform."

Dit maakt dat Mike kan zeggen: *"Wist je dat we een uitgebreid verhaal over deze artiest hebben? Bekijk het eens!"*

---

## Technische Details

### Nieuwe component: `ArtistContentCards.tsx`
Een compacte, horizontaal scrollbare strip met content-kaartjes. Gebruikt de bestaande `useArtistContent` hook.

### Wijzigingen in `ScanChatTab.tsx`
1. Na `setVerifiedResult(v2Result)` wordt `useArtistContent` getriggerd met de artiestnaam
2. Content cards worden gerenderd onder het scan-resultaat bericht
3. Suggestie-chips worden verrijkt op basis van beschikbare content
4. Bij het versturen van berichten wordt een `[PLATFORM_CONTENT: ...]` context-tag meegegeven aan de edge function

### Wijzigingen in `scan-chat/index.ts`
- System prompt krijgt een extra instructie: "Als er platform-content beschikbaar is (aangegeven met PLATFORM_CONTENT tag), verwijs hier actief naar en moedig de gebruiker aan om deze te bekijken."

### Bestanden
| Bestand | Actie |
|---|---|
| `src/components/scanner/ArtistContentCards.tsx` | Nieuw -- content strip component |
| `src/components/scanner/ScanChatTab.tsx` | Wijzigen -- content cards integreren, chips verrijken, context meesturen |
| `supabase/functions/scan-chat/index.ts` | Wijzigen -- prompt instructie voor platform-content verwijzingen |

