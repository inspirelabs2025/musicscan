
# Meertalig Platform (NL/EN) - Stapsgewijze Aanpak

## Overzicht
Het hele publieke platform wordt tweetalig (Nederlands + Engels). Admin pagina's blijven Nederlands. We bouwen eerst de infrastructuur, dan pagina voor pagina.

## Fase 1: Infrastructuur (eerste stap)

### 1.1 Taal Context & Hook
- Nieuw bestand `src/contexts/LanguageContext.tsx` met:
  - Taalstatus (`nl` | `en`), opgeslagen in `localStorage`
  - Auto-detectie via browser `navigator.language`
  - `useLanguage()` hook die `{ language, setLanguage, t }` teruggeeft
- Nieuw bestand `src/i18n/translations.ts` als centraal vertaalbestand met geneste objecten per sectie

### 1.2 Vertaalstructuur
```text
src/i18n/
  translations.ts      -- alle vertalingen { nl: {...}, en: {...} }
```

Structuur per sectie, bijv.:
```text
{
  nl: {
    nav: { shop: "Shop", stories: "Verhalen", quiz: "Quiz", ... },
    hero: { title: "Scan Je Collectie", subtitle: "...", cta: "Start Scannen", ... },
    common: { free: "Gratis", readMore: "Lees meer", ... },
    ...
  },
  en: {
    nav: { shop: "Shop", stories: "Stories", quiz: "Quiz", ... },
    hero: { title: "Scan Your Collection", subtitle: "...", cta: "Start Scanning", ... },
    common: { free: "Free", readMore: "Read more", ... },
    ...
  }
}
```

### 1.3 Taalschakelaar Component
- Klein component `LanguageSwitcher.tsx` met NL/EN vlaggetjes in de navigatiebalk
- Wordt opgenomen in `Navigation.tsx`

## Fase 2: Gedeelde Componenten (stap 2)

Vertalingen toepassen op:
1. **Navigation.tsx** - Menu items, dropdowns
2. **ScannerHero.tsx** - Hero teksten, CTA buttons
3. **QuickLinks.tsx** - Labels
4. **ConditionalFooter / Footer** - Footer teksten
5. **Common UI** - Buttons, labels, foutmeldingen

## Fase 3: Pagina's (stap voor stap)

Elke iteratie pakt een groep pagina's aan:

| Volgorde | Pagina's | Reden |
|----------|----------|-------|
| 1 | Home, NotFound | Landingspagina's, eerste indruk |
| 2 | Shop, ProductDetail | Commercieel belangrijk |
| 3 | Verhalen, Singles, Artists | Content pagina's |
| 4 | QuizHub, Quiz | Interactieve features |
| 5 | Auth, Profile, Pricing | Account & conversie |
| 6 | Overige publieke pagina's | Nieuws, Releases, Podcasts, etc. |

## Technische Details

### LanguageContext opzet
- `createContext` met `language`, `setLanguage`, `t(key)` functie
- `t('hero.title')` geeft automatisch de juiste vertaling terug
- Provider wraps de hele app in `App.tsx` (rond alle andere providers)
- `localStorage` key: `musicscan-language`

### Vertaalfunctie `t()`
- Ondersteunt geneste keys: `t('nav.shop')` 
- Fallback naar Nederlands als een Engelse vertaling ontbreekt
- TypeScript typing voor autocomplete op vertaalkeys

### Wat NIET vertaald wordt
- Admin pagina's (alle `/admin/*` routes)
- Database content (verhalen, nieuws, etc. blijven in oorspronkelijke taal)
- Technische labels in admin tools

### Wat WEL vertaald wordt
- Alle UI labels, buttons, titels, subtitels
- Navigatie en menu's
- SEO meta tags (title, description) per taal
- Placeholder teksten
- Foutmeldingen en toasts
- Footer content

## Aanpak
We starten met **Fase 1** (infrastructuur) zodat het vertaalsysteem klaarstaat. Daarna werken we pagina voor pagina door de lijst.
