

## Definitieve Build Fix: Ontbrekend `terser` Package

### Probleem gevonden

Na uitgebreide audit is het echte probleem gevonden: **`terser` is niet geinstalleerd**, maar `vite.config.ts` verwijst er wel naar.

De vite.config.ts bevat:
```typescript
minify: 'terser',
terserOptions: {
  compress: {
    drop_console: mode === 'production',
    // ...
  }
}
```

Maar `terser` staat NIET in `package.json`. Sinds Vite 5+ moet terser apart worden geinstalleerd. In dev-mode wordt terser niet gebruikt (daarom werkt de preview), maar bij `vite build` (productie) faalt de build omdat het package niet gevonden kan worden.

### Oplossing: 2 opties (beide worden uitgevoerd)

**Optie A (voorkeur): Schakel over naar de standaard Vite minifier (esbuild)**
- Verwijder `minify: 'terser'` en `terserOptions` uit `vite.config.ts`
- esbuild is de standaard in Vite en is sneller dan terser
- Console-stripping kan via esbuild's `drop` optie

**Dit is beter dan terser installeren omdat:**
- esbuild is 10-100x sneller
- Geen extra dependency nodig
- Standaard Vite gedrag = minder kans op problemen

### Technische Details

**`vite.config.ts`** - Vervang terser door esbuild configuratie:

```typescript
build: {
    target: 'esnext',
    // minify: 'terser',  <-- VERWIJDEREN
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: { /* ... bestaande chunks ... */ }
      }
    },
    // terserOptions: { ... }  <-- VERWIJDEREN
    // Vervangen door esbuild drop:
    ...(mode === 'production' ? {
      minify: 'esbuild',
    } : {}),
    chunkSizeWarningLimit: 600
  },
  esbuild: mode === 'production' ? {
    drop: ['console', 'debugger'],
  } : {},
```

Dit bereikt hetzelfde als de terser config (console.log verwijderen in productie) maar dan met de standaard Vite minifier die altijd beschikbaar is.

### Waarom eerdere fixes niet werkten

Alle eerdere fixes (tw-animate-css, ESM imports, @plugin directive) waren correcte verbeteringen, maar losten het eigenlijke probleem niet op. De build faalde steeds op de terser-stap die NA de CSS/Tailwind processing komt.

### Risico
Minimaal. esbuild is de standaard Vite minifier en produceert vergelijkbare output. De console-stripping werkt identiek.
