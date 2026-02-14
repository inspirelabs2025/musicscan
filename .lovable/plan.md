

# Spotify Profiel Pagina Reparatie en Uitbreiding

## Probleem
De Spotify Profiel pagina bestaat al (`src/pages/SpotifyProfile.tsx`) maar is niet bereikbaar:
- **Route mismatch**: App.tsx registreert de route als `/spotify/profile`, maar alle links (Navigation, SpotifyWidget, SpotifyCallback) verwijzen naar `/spotify-profile`
- Hierdoor krijg je een 404

## Oplossing

### Stap 1: Route fix
Alle verwijzingen consistent maken op `/spotify-profile`:
- **App.tsx**: Route wijzigen van `/spotify/profile` naar `/spotify-profile`

### Stap 2: Uitbreiding met meer Spotify data
De bestaande pagina verrijken met extra secties:

**Nieuwe secties toevoegen:**
1. **Profiel Header** - Spotify avatar, display name, land, aantal followers (data al beschikbaar via `spotify-sync`)
2. **Recently Played** - Laatst beluisterde tracks ophalen via Spotify API (`/v1/me/player/recently-played`)
3. **Audio Features Analyse** - Danceability, energy, valence gemiddelden visualiseren met progress bars (geeft inzicht in muziekstijl)
4. **Decennia Verdeling** - Pie chart (Recharts) van in welke decennia de verzamelde tracks vallen
5. **Luister-DNA Samenvatting** - Korte AI-gegenereerde samenvatting van het muziekprofiel

### Stap 3: Edge function uitbreiden
`spotify-sync` uitbreiden met:
- **Recently played tracks** ophalen en opslaan
- **Audio features** ophalen voor opgeslagen tracks (batch via `/v1/audio-features`)
- Spotify profielfoto + land opslaan in `profiles` tabel

### Stap 4: Database uitbreiding
- Kolommen toevoegen aan `profiles`: `spotify_avatar_url`, `spotify_country`, `spotify_followers`
- Nieuwe tabel `spotify_recently_played` voor recent beluisterde tracks

## Technische Details

### Bestanden die worden aangepast:
| Bestand | Wijziging |
|---------|-----------|
| `src/App.tsx` | Route `/spotify/profile` naar `/spotify-profile` |
| `src/pages/SpotifyProfile.tsx` | Nieuwe secties: profiel header, recently played, audio features chart, decennia chart, muziek-DNA |
| `supabase/functions/spotify-sync/index.ts` | Recently played + audio features + profieldata ophalen |
| `src/hooks/useSpotifyData.ts` | Nieuwe hooks: `useSpotifyRecentlyPlayed`, audio features aggregatie |
| Database migratie | `spotify_recently_played` tabel + extra `profiles` kolommen |

### Visuele opbouw (van boven naar beneden):
1. Grote Spotify profiel header met avatar en stats
2. 4 stat-kaarten (tracks, playlists, gem. duur, explicit %)
3. Tabs: Overzicht | Top Muziek | Playlists | Insights
   - Overzicht krijgt: Top Genres + Recently Played + Decennia chart
   - Insights krijgt: Audio Features bars (energy, danceability, valence) + Muziek-DNA tekst

