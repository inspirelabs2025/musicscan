

# Floating Magic Mike Chat op Alle Pagina's

## Wat wordt er gebouwd
Een zwevende Magic Mike 🎩 chat-bubble die op **elke pagina** van de app beschikbaar is -- zowel publieke als ingelogde pagina's. Mike kan zo overal vragen beantwoorden, collectiewaardes bespreken, en muziekinfo geven.

## Hoe het werkt
- Rechtsonder verschijnt een rondje met het Magic Mike avatar
- Klikken opent een compacte chat-overlay (geen volledige pagina)
- De chat gebruikt dezelfde `scan-chat` edge function als de bestaande ScanChatTab
- Op ingelogde pagina's krijgt Mike context mee over de huidige pagina (bijv. "collection-overview") zodat hij relevante dingen kan zeggen over je collectie
- De chat-staat blijft behouden tijdens navigatie (je verliest je gesprek niet)
- Op de /ai-scan-v2 pagina wordt de floating bubble verborgen (daar zit Mike al inline)

## Gebruikerservaring
1. Gebruiker ziet rechtsonder een Magic Mike avatar-button met een subtiel "pulsje"
2. Klik opent een chat-venster (~400px breed, ~500px hoog)
3. Mike begroet je met een welkomstbericht, contextueel per pagina
4. Je kunt typen, foto's sturen, en gewoon chatten
5. Klik op X of buiten het venster sluit de chat (gesprek blijft bewaard)

## Technische aanpak

### 1. Nieuw component: `FloatingMikeChat.tsx`
- Zwevende button + expandable chat panel
- Hergebruikt de chat-logica uit ScanChatTab (berichten sturen naar `scan-chat` edge function)
- Vereenvoudigde versie: alleen tekst-chat (geen scan/upload functionaliteit -- daarvoor verwijs je naar de scanner pagina)
- Gebruikt `framer-motion` voor open/dicht animatie
- Z-index hoog genoeg om boven alle content te zweven

### 2. Integratie in `App.tsx`
- Component wordt toegevoegd in de AppContent wrapper, naast Navigation
- Conditioneel: alleen tonen als de gebruiker is ingelogd (Magic Mike is een premium feature)
- Verbergen op `/ai-scan-v2` waar Mike al inline beschikbaar is
- Verbergen op `/auth` pagina

### 3. Pagina-context meegeven
- De floating chat detecteert de huidige route via `useLocation()`
- Stuurt een `pageContext` parameter mee naar de `scan-chat` edge function
- Voorbeeld: op `/collection-overview` krijgt Mike mee dat de gebruiker zijn collectie bekijkt, zodat hij relevante tips kan geven

### 4. State management
- Chat-berichten worden in een React state bewaard binnen het component
- Omdat het component in App.tsx leeft (buiten Routes), blijft het gesprek behouden bij navigatie
