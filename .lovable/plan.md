

## Magic Mike Chat: V2 Pipeline Integratie + Rights Society Gating

### Status: ✅ GEÏMPLEMENTEERD

### Wat is gedaan

**1. System Prompt (`scan-chat/index.ts`)**
- ✅ `[[DISCOGS:...]]` tag verwijderd — Magic Mike geeft NOOIT meer een Discogs ID
- ✅ Rights society awareness toegevoegd — Magic Mike benoemt expliciet BIEM/STEMRA, JASRAC, etc.
- ✅ `[[SCAN_DATA:...]]` tag uitgebreid met `rights_societies` veld
- ✅ Rechtenorganisaties kennis-sectie toegevoegd aan system prompt

**2. ScanChatTab.tsx — V2 Pipeline Integratie**
- ✅ `extractDiscogsId()` verwijderd — niet meer nodig
- ✅ `cleanDisplayText()` vereenvoudigd — geen `[[DISCOGS:...]]` meer te strippen
- ✅ `runV2Pipeline()` toegevoegd — roept `ai-photo-analysis-v2` aan na AI-stream
- ✅ Auto-run na foto-upload: V2 pipeline start automatisch na Magic Mike's analyse
- ✅ Resultaten met match status, confidence, rights society exclusions, en pricing
- ✅ Suggestie-knoppen bij meerdere kandidaten of `needs_review`
- ✅ `selectCandidate()` voor handmatige selectie van alternatieve releases

**3. Flow**
```text
1. Gebruiker uploadt foto's
2. Magic Mike beschrijft wat hij ziet (artiest, titel, identifiers, rechtenorganisaties)
3. [[SCAN_DATA:{...}]] tag met rights_societies
4. Automatisch ai-photo-analysis-v2 aanroepen
5. V2 pipeline: deterministische matching + rights society gating
6. Resultaat in chat: match status + pricing + exclusions
```
