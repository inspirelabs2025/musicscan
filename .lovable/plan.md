

# Spotify Analyse 2.0: Diepgaande Inzichten + Collectie Vergelijking

## Probleem
De huidige Spotify AI analyse is te oppervlakkig -- slechts 6 categorieeen (personality, trends, recommendations, patterns, collectionComparison, funFacts). De collectie-analyse heeft 9 rijke categorieen met veel meer diepgang. Er is geen echte vergelijking tussen Spotify en de fysieke collectie.

## Oplossing

### 1. Uitgebreide AI Analyse Prompt
De `spotify-ai-analysis` edge function krijgt een veel rijkere prompt met meer dimensies:

**Nieuwe analyse-categorieeen (naast bestaande):**
- **Luisterreis Timeline** - Hoe je smaak zich heeft ontwikkeld (recent vs. medium vs. lang)
- **Genre-Ecosysteem** - Diepere analyse van genre-verbanden, niche-genres, mainstream vs. underground ratio
- **Artiest-Netwerk** - Verbindingen tussen je top artiesten, samenwerkingen, invloeden
- **Emotioneel Landschap** - Mood-mapping over de dag/week, energie-patronen
- **Ontdekker Score** - Hoe avontuurlijk je luistert (obscure vs. populair, genre-diversiteit)
- **Muzikale Tijdreiziger** - Welke decennia domineren, nostalgie vs. nieuwsgierigheid
- **Collectie Vergelijking (verrijkt)** - Diepgaande vergelijking fysiek vs. digitaal met overlap-analyse, genre-verschuivingen, "blinde vlekken" in beide collecties

### 2. UI Redesign Insights Tab
De Insights tab wordt compleet vernieuwd met een visueel rijkere layout:

- **Muziek Persoonlijkheid** (hero card met gradient) - Titel + samenvatting + traits
- **Ontdekker Scorecard** - Visuele meter (mainstream vs. underground, breed vs. niche)
- **Genre Ecosysteem** - Visuele weergave van genre-clusters en verbanden
- **Emotioneel Landschap** - Mood kaarten met kleuren
- **Luisterreis** - Timeline van smaakevolutie
- **Artiest Connecties** - Netwerk van invloeden
- **Fysiek vs. Digitaal** - Uitgebreide vergelijking met overlap-stats, blinde vlekken, suggesties
- **Verborgen Parels** - Unieke ontdekkingen en deep cuts
- **Fun Facts** - Verbeterde weetjes

### 3. Collectie Cross-Analyse
De edge function haalt meer data op uit de fysieke collectie:
- Genre-verdeling fysiek vs. Spotify
- Decennia-verdeling vergelijking
- Artiesten overlap met details (welke albums fysiek, welke tracks digitaal)
- "Blinde vlekken" - wat heb je fysiek maar luister je niet op Spotify en vice versa

## Technische Details

### Bestanden die worden aangepast

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/spotify-ai-analysis/index.ts` | Prompt uitbreiden naar 12+ analyse-dimensies, meer collectie-data ophalen |
| `src/hooks/useSpotifyAIAnalysis.ts` | Interface uitbreiden met nieuwe categorieeen |
| `src/pages/SpotifyProfile.tsx` | Insights tab compleet vernieuwen met rijkere visuele componenten |

### Nieuwe AI Response Structuur

```text
personality        -> titel, samenvatting, traits (bestaand, verrijkt)
genreEcosystem     -> clusters, nichescores, mainstream ratio, verbanden
emotionalLandscape -> moods, energieflow, seizoenspatronen
explorerProfile    -> score (0-100), diversiteit, obscuriteit, avontuurlijkheid
listeningJourney   -> smaakevolutie, keermomenten, tijdlijn
artistNetwork      -> connecties, invloeden, samenwerkingen
collectionBridge   -> overlap stats, blinde vlekken, genre shifts, suggesties
hiddenGems         -> underrated tracks, deep cuts, verrassingen
trends             -> stijgend, dalend, beschrijving (bestaand, verrijkt)
recommendations    -> artiesten, genres, albums (bestaand, verrijkt)
funFacts           -> 5-7 weetjes (verrijkt)
```

### Edge Function Data Ophalen (uitbreiding)
Naast bestaande queries, extra ophalen uit fysieke collectie:
- Genre-verdeling per bron (cd_scan, vinyl2_scan)
- Jaar-verdeling per bron
- Volledige artiesten-lijst met albums voor overlap-analyse
- Waarde-informatie uit ai_scan_results voor collector-inzichten

