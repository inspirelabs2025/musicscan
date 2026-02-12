

## Uitgebreide Build Audit & Fix: Tailwind v4 Plugin Incompatibiliteit

### Oorzaak van het probleem

De productie-build faalt steeds omdat het project **Tailwind CSS v4** (`^4.1.18`) gebruikt, maar de plugins nog op de **v3-manier** zijn geconfigureerd via `tailwind.config.ts`. In Tailwind v4 werkt het plugin-systeem fundamenteel anders:

- `tailwindcss-animate` (v1.0.7) is **niet compatibel** met Tailwind v4 -- er is een vervanger nodig: `tw-animate-css`
- `@tailwindcss/typography` moet via de CSS `@plugin` directive geladen worden, niet via de JS config

Dit is ook bevestigd door shadcn/ui die in maart 2025 `tailwindcss-animate` heeft gedepreceerd ten gunste van `tw-animate-css`.

### Wat er moet veranderen

#### 1. Vervang `tailwindcss-animate` door `tw-animate-css`
- Verwijder `tailwindcss-animate` als dependency
- Installeer `tw-animate-css` als dependency
- Laad via CSS `@import` in plaats van JS plugin

#### 2. Laad `@tailwindcss/typography` via CSS `@plugin` directive
- Verwijder de import en plugin-referentie uit `tailwind.config.ts`
- Voeg `@plugin "@tailwindcss/typography"` toe in `src/index.css`

#### 3. Verwijder de `plugins` array uit `tailwind.config.ts`
- De twee ESM imports bovenaan het bestand worden verwijderd
- De `plugins: [...]` array wordt leeggemaakt of verwijderd

### Technische Details

**`src/index.css`** -- bovenaan toevoegen:
```css
@import "tailwindcss";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";
@config "../tailwind.config.ts";
```

**`tailwind.config.ts`** -- plugins verwijderen:
```typescript
// VERWIJDER deze imports:
// import tailwindcssAnimate from "tailwindcss-animate";
// import tailwindcssTypography from "@tailwindcss/typography";

// VERWIJDER of leegmaken:
plugins: [],
```

**`package.json`** -- dependencies aanpassen:
- Verwijder: `tailwindcss-animate`
- Toevoegen: `tw-animate-css`

### Waarom dit de definitieve fix is

1. `tailwindcss-animate` is een Tailwind v3 plugin die de v4 plugin API niet ondersteunt -- dit crasht de build
2. `tw-animate-css` is de officieel aanbevolen vervanging (door zowel de auteur als shadcn/ui)
3. `@tailwindcss/typography` werkt wel met v4, maar moet via `@plugin` in CSS geladen worden, niet via de JS config
4. De huidige `tailwind.config.ts` met `plugins: [...]` probeert v3-style plugins te laden in een v4 omgeving

### Risico
Laag. De animatie-classes (`animate-in`, `animate-out`, `accordion-down`, etc.) zijn identiek in `tw-animate-css`. De typography `prose` classes werken exact hetzelfde via `@plugin`.

