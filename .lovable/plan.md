

## Fix: Chat gebruikt knowledge base niet - Herdeployment nodig

### Probleem

De code in `scan-chat/index.ts` is correct: de `loadAgentPrompt()` functie laadt het profiel + kennisbronnen uit de database. De database bevat ook de juiste data:

- **Profiel**: `magic_mike` (actief, 1761 chars system prompt)
- **Kennisbron**: "Discogs Anti-Patterns" (3517 chars, actief)

Maar de edge function logs tonen GEEN "Loaded agent prompt" regel, wat betekent dat de oude versie (zonder `loadAgentPrompt`) nog draait. De functie moet opnieuw gedeployed worden.

### Oplossing

1. **Redeploy `scan-chat`** edge function zodat de huidige code (met `loadAgentPrompt()` en knowledge base injectie) actief wordt.

2. **Verificatie**: Na deploy controleren we de logs op de regel:
   ```
   [scan-chat] Loaded agent prompt (XXXX chars) with 1 knowledge sources
   ```

Dit is een deploy-only fix — er zijn geen codewijzigingen nodig.

