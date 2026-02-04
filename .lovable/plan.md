
# Plan: Preview van Gefilterde Foto's in Scanner

## Overzicht
Toon gebruikers een live vergelijking tussen originele en verwerkte foto's direct na upload, zodat ze zien wat de filtering/preprocessing doet.

## Wat wordt getoond

### Stap 1: Direct na Upload (Client-side filtering)
- **Origineel**: De foto zoals geüpload
- **Verbeterd**: Na auto-contrast en resize optimalisatie
- Interactieve slider om te vergelijken (al bestaande EnhancedScanPreview component)

### Stap 2: Na Analyse (Server-side filtering) - Optioneel
- Toon de zware preprocessing resultaten (multi-shot stacking, edge detection)
- Alleen voor geïnteresseerde gebruikers (uitklapbaar)

## Technische Aanpak

### Fase 1: Client-side Preview (snel, <500ms)
```text
┌─────────────────────────────────────────────────┐
│ Foto Upload                                      │
├─────────────────────────────────────────────────┤
│ ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│ │ Foto 1    │  │ Foto 2    │  │ Foto 3    │    │
│ │ [Slider]  │  │ [Slider]  │  │ [Slider]  │    │
│ │ Orig|Verb │  │ Orig|Verb │  │ Orig|Verb │    │
│ └───────────┘  └───────────┘  └───────────┘    │
│                                                  │
│ Stats: "1.2x contrast verbeterd"                │
└─────────────────────────────────────────────────┘
```

### Wijzigingen

1. **AIScanV2.tsx**
   - Importeer `preprocessImageClient` van `clientImagePreprocess.ts`
   - Voer preprocessing uit wanneer foto wordt geüpload
   - Sla zowel origineel als verwerkte versie op
   - Toon EnhancedScanPreview per foto

2. **UploadedFile interface uitbreiden**
   ```typescript
   interface UploadedFile {
     file: File;
     preview: string;           // Origineel
     processedPreview?: string; // Na filtering
     processingStats?: {
       contrastApplied: boolean;
       wasResized: boolean;
       processingTimeMs: number;
     };
   }
   ```

3. **UI Flow**
   - Upload foto → Direct preprocessing → Toon slider vergelijking
   - Badge met "Smart verbeterd" of processing stats
   - Optie om origineel/verbeterd te togglen

## Voordelen
- Gebruikers zien direct wat er met hun foto's gebeurt
- Transparantie over de "Smart" filtering
- Betere verwachtingen voor OCR resultaten

## Tijdsinschatting
- Implementatie: ~30 minuten
- Geen nieuwe dependencies nodig
- Hergebruikt bestaande EnhancedScanPreview component
