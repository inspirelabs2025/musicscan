
# Recente Activiteit uitbreiden met alle activiteiten

## Probleem
De "Recente Activiteit" sectie op het dashboard toont momenteel alleen scans (CD/vinyl/AI). De gebruiker wil hier alle soorten activiteiten zien die daadwerkelijk zijn uitgevoerd.

## Oplossing
De sectie aanpassen zodat naast scans ook quizzen, blog posts, follows en shop orders worden getoond - vergelijkbaar met de bestaande `useUserActivity` hook maar dan op het dashboard.

## Wat er verandert

### 1. Nieuwe hook: `useDashboardActivity`
Een nieuwe hook die alle activiteitstypen ophaalt voor de ingelogde gebruiker:
- CD scans ("CD toegevoegd: Artist - Title")
- Vinyl scans ("Vinyl toegevoegd: Artist - Title")
- AI scans ("Scan uitgevoerd: Artist - Title")
- Quiz resultaten ("Quiz voltooid - Score: 85%")
- Blog posts ("Blog gepubliceerd: Titel")
- Shop bestellingen ("Bestelling geplaatst: bedrag")
- Follows ("Begon iemand te volgen")

Alle items worden gesorteerd op datum, de laatste 10 worden getoond.

### 2. Dashboard.tsx aanpassen
De huidige scan-only weergave vervangen door de nieuwe activiteitenfeed met:
- Icoontjes per activiteitstype (muzieknoot voor scans, trofee voor quiz, pen voor blog, etc.)
- Artiest + titel voor scans
- Score percentage voor quizzen
- Titel voor blog posts
- Datum per item

De layout en styling blijven consistent met het huidige design.

## Technische details

- De nieuwe hook hergebruikt het patroon uit `useUserActivity` maar is geoptimaliseerd voor het dashboard (meertalig via `tr` object, minder data per query)
- Parallel fetching van alle tabellen voor snelheid
- Query key bevat `tr` voor taalwisseling support
- Maximaal 10 items, gesorteerd op datum (nieuwste eerst)
