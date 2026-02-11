

# Chat Visueel Verbeteren

Hier zijn concrete verbeteringen om de Collection Chat er moderner en aantrekkelijker uit te laten zien:

## 1. Avatar-iconen bij berichten
- Gebruiker-berichten krijgen een klein profielfoto/avatar icoontje
- AI-berichten krijgen een herkenbaar bot-icoon (Brain/Bot icon met een gouden ring)
- Geeft het gevoel van een echt gesprek

## 2. Typing indicator met animatie
- Drie pulserende bolletjes in plaats van alleen tekst "AI denkt na..."
- Smooth bounce-animatie zoals bij WhatsApp/iMessage

## 3. Betere message bubbles
- Subtiele schaduw en afrondingen verbeteren
- Tijdstempel onder elk bericht (nu alleen tokens/ms info)
- Lichte glasmorphism-stijl voor AI-berichten

## 4. Welkomstscherm vernieuwen
- Groot welkom-icoon met animatie
- Suggestie-knoppen als "chips" in een grid (2 kolommen) in plaats van een lange lijst
- Categorie-labels bij suggesties (bijv. "Waarde", "Smaak", "Spotify")

## 5. Input-balk verbeteren
- Grotere, mooiere input met afgeronde hoeken
- Gradient send-knop (vinyl-gold)
- Sticky input aan de onderkant

## 6. ReactMarkdown voor AI-responses
- Huidige handmatige regex-parsing vervangen door `react-markdown` (al geinstalleerd)
- Betere ondersteuning voor lijsten, headers, bold/italic

---

## Technische Details

### Bestanden die aangepast worden:
- `src/pages/CollectionChat.tsx` - Hoofdbestand met alle visuele verbeteringen

### Aanpak:
1. Import `react-markdown` en `Avatar` componenten
2. `renderMessage` functie herschrijven met avatars, timestamps en markdown
3. Typing indicator component met CSS animatie
4. Welkomstscherm met 2-koloms grid suggesties
5. Input-balk stylen met gradient button

### Geen nieuwe dependencies nodig
Alles is al beschikbaar: `react-markdown`, `Avatar`, `framer-motion`, Tailwind animaties.

