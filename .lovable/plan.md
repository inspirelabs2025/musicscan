

## Build Fix: Tailwind CSS PostCSS Plugin

De build faalt omdat Tailwind CSS v4 de PostCSS plugin naar een apart package heeft verplaatst. Er zijn twee wijzigingen nodig:

### 1. PostCSS configuratie updaten
**Bestand: `postcss.config.js`**
- Vervang `tailwindcss` door `@tailwindcss/postcss` als plugin

### 2. Dependency installeren
- Package `@tailwindcss/postcss` toevoegen aan het project

### Technische Details

**postcss.config.js** wordt:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

Dit lost ook de `"type": "module"` warning op door dat veld toe te voegen aan `package.json`.

