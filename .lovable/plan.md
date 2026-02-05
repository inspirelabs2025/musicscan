
# Artiest Ontdek-popup na Scan Opslaan

## Wat wordt gebouwd

Een dynamische popup/drawer die verschijnt nadat een gebruiker op "Toevoegen aan Collectie" klikt in de scan resultaten. Deze popup toont alle beschikbare MusicScan content over de gescande artiest, gegroepeerd per type.

## Content bronnen

De popup doorzoekt 6 tabellen op basis van de artiestnaam uit het scan-resultaat:

| Bron | Tabel | Match-veld | Route |
|---|---|---|---|
| Artiest Verhaal | `artist_stories` | `artist_name` (ILIKE) | `/artists/{slug}` |
| Album Stories | `music_stories` | `artist_name` (ILIKE), `single_name IS NULL` | `/muziek-verhaal/{slug}` |
| Singles | `music_stories` | `artist_name` (ILIKE), `single_name IS NOT NULL` | `/singles/{slug}` |
| Anekdotes | `music_anecdotes` | `subject_name` (ILIKE) | `/anekdotes/{slug}` |
| Nieuws | `news_blog_posts` | `title` (ILIKE op artiestnaam) | `/nieuws/{slug}` |
| Shop Producten | `platform_products` | `artist` (ILIKE) | `/product/{slug}` |

## UX Flow

1. Gebruiker scant een CD/vinyl en krijgt resultaat
2. Gebruiker klikt "Toevoegen aan Collectie"
3. **NIEUW**: Popup verschijnt met "Ontdek meer over [Artiest]"
4. Popup toont per categorie de beschikbare content (met aantallen)
5. Gebruiker kan items aanklikken (opent in nieuw tabblad) of popup sluiten
6. Na sluiten gaat de navigatie verder naar `/scanner/discogs` (het bestaande opslaan-proces)

## Visueel ontwerp

- Desktop: Dialog (modal) met gradient header in artiest-stijl
- Mobiel: Drawer (bottom sheet) met swipe-to-dismiss
- Secties met iconen per content-type
- Lege secties worden niet getoond
- Als er helemaal geen content is: popup wordt overgeslagen, directe navigatie

## Technische aanpak

### 1. Nieuwe hook: `useArtistContent.ts`
- Accepteert `artistName: string`
- Voert 6 parallelle queries uit (met `Promise.all`)
- Returns: `{ artistStory, albumStories, singles, anecdotes, news, products, totalCount, isLoading }`
- Elke query beperkt tot 5 items

### 2. Nieuw component: `ArtistDiscoveryPopup.tsx`
- Props: `artistName`, `isOpen`, `onClose`, `onContinue` (gaat door naar collectie-opslaan)
- Gebruikt `useArtistContent` hook
- Desktop = Dialog, Mobiel = Drawer (zelfde patroon als `SitePopup.tsx`)
- Gradient header met artiestnaam
- Per sectie: icoon + titel + items als klikbare links (target="_blank")
- Footer met twee knoppen: "Later bekijken" (sluit) en "Ga door naar opslaan" (primair)

### 3. Wijziging in `AIScanV2.tsx`
- State toevoegen: `showArtistPopup: boolean`
- Bij klik op "Toevoegen aan Collectie": in plaats van direct navigeren, eerst `showArtistPopup = true` zetten
- De `onContinue` callback van de popup voert de bestaande navigatie uit naar `/scanner/discogs`
- Als `totalCount === 0`: popup overslaan, direct navigeren (geen lege popup tonen)
