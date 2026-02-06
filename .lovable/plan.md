
# ArtistDiscoveryPopup verplaatsen naar na het opslaan

## Probleem
De ArtistDiscoveryPopup zit momenteel op de **AIScanV2** pagina en wordt getoond **voordat** je naar `/scanner/discogs` navigeert. Na klikken op "Ga door naar opslaan" navigeer je weg en de popup verdwijnt. Op de BulkerImage pagina (waar het item daadwerkelijk wordt opgeslagen) is er geen ArtistDiscoveryPopup.

## Oplossing
De popup verplaatsen naar de **BulkerImage** pagina (`/scanner/discogs`) en tonen **na een succesvolle opslag**.

## Stappen

### 1. BulkerImage.tsx - ArtistDiscoveryPopup toevoegen
- Importeer `ArtistDiscoveryPopup` component
- Voeg state toe: `showArtistPopup` (boolean)
- Na succesvolle opslag in `performSave` (na de toast "Scan Voltooid!"), zet `showArtistPopup` op `true` als er een artiestnaam beschikbaar is
- Render de `ArtistDiscoveryPopup` onderaan de component met de artiestnaam uit `searchResults[0]?.artist` of de query parameter

### 2. AIScanV2.tsx - Directe navigatie na klik
- Verwijder de `showArtistPopup` state en `pendingNavigateRef` logica
- Bij klik op "Toevoegen aan Collectie": navigeer direct naar `/scanner/discogs` zonder popup tussenstap
- Verwijder de `ArtistDiscoveryPopup` render en import

### 3. BulkerImage popup callbacks
- `onClose`: Sluit popup, gebruiker blijft op de pagina of navigeert terug naar scanner
- `onContinue`: Sluit popup, optioneel navigeer naar collectie-overzicht

## Technische details

```text
Huidige flow:
AIScanV2 -> klik opslaan -> popup (kort zichtbaar) -> navigate -> BulkerImage -> opslaan

Nieuwe flow:
AIScanV2 -> klik opslaan -> navigate -> BulkerImage -> opslaan -> popup (na succes)
```

De artiestnaam wordt uit de URL query parameters gehaald (die al meegegeven worden: `artist=Blondie`) of uit `searchResults[0]?.artist`.
