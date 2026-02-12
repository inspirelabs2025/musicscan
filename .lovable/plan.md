

## Build Fix: `require()` is not defined

### Probleem
De productie-build faalt omdat `tailwind.config.ts` twee keer `require()` gebruikt:

```
plugins: [
    require("tailwindcss-animate"),   // CRASHT
    require("@tailwindcss/typography"), // CRASHT
]
```

In een ESM-omgeving (Vite + `@tailwindcss/postcss`) werkt `require()` niet. De build crasht, en de oude gecachte versie wordt geserveerd.

### Oplossing

**Bestand: `tailwind.config.ts`** - Vervang `require()` door `import`:

```typescript
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";

// ... rest van config blijft hetzelfde ...

plugins: [
    tailwindcssAnimate,
    tailwindcssTypography,
],
```

### Waarom dit werkt
- Vite draait in ESM mode waar `require()` niet bestaat
- `import` is de standaard manier om modules te laden in ESM
- Beide packages ondersteunen ESM imports
- Geen andere wijzigingen nodig - de rest van de config is correct

### Risico
Laag. Dit is een directe 1-op-1 vervanging van `require()` naar `import`.

