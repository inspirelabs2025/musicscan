

## Camera-functie toevoegen aan Magic Mike Chat

### Probleem
De huidige file input in de chat (`<input type="file" accept="image/*">`) opent op mobiel alleen de bestandskiezer. Er ontbreekt een `capture="environment"` attribuut en een aparte camera-knop, waardoor gebruikers niet direct een foto kunnen maken.

### Oplossing
Twee aanpassingen in `src/components/scanner/ScanChatTab.tsx`:

1. **Aparte camera-knop** naast de bestaande foto-knop in de input bar (onderaan de chat). De bestaande knop blijft voor het uploaden van bestanden uit de galerij; de nieuwe knop opent direct de camera.

2. **Twee hidden file inputs**:
   - De bestaande `fileInputRef` (galerij/bestanden kiezen, zonder `capture`)
   - Een nieuwe `cameraInputRef` met `capture="environment"` die direct de camera opent op mobiel

3. **UI aanpassing input bar**: Twee knoppen naast het tekstveld:
   - Camera-icoon (`Camera`) -- opent de camera direct
   - Galerij-icoon (`ImagePlus`) -- opent bestandskiezer

4. **Zelfde aanpassing in de pending-files preview**: De "+" knop voor extra foto's krijgt ook een camera-optie.

### Technische details

**Bestand:** `src/components/scanner/ScanChatTab.tsx`

- Nieuwe `useRef`: `const cameraInputRef = useRef<HTMLInputElement>(null);`
- Tweede hidden input:
  ```html
  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFilesSelected} className="hidden" />
  ```
- Input bar wordt aangepast van 1 knop naar 2 knoppen:
  - `Camera` icoon -> `cameraInputRef.current?.click()`
  - `ImagePlus` icoon -> `fileInputRef.current?.click()`
- In de pending-files preview-area: extra camera-knop naast de bestaande "+" knop

