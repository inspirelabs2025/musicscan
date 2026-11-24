# AGENTS.md

- Trading Desk lives in its own page (`/trading`), components under `src/components/trading/`, data access in `src/hooks/useTradingDesk.ts`, and `trading-*` edge functions with shared helpers in `supabase/functions/_shared/trading.ts` and `discogs-oauth.ts` — keeps it separate from existing Discogs/marketplace pages.
- Scheduled `trading-*` jobs authenticate with the `x-trading-cron` header matching `app_secrets.TRADING_CRON_TOKEN` (read by pg_cron at run time); every other caller must be a signed-in user — prevents anonymous triggering of costly or price-changing runs.
- Trading Desk colors come from the `--trade-*` tokens (`trade-up`, `trade-down`, `trade-panel`, …) — keeps the dark trading look themeable.
- Push delivery goes through the Firebase Messaging connector and silently no-ops when it is not linked; in-site alerts (realtime + Web Audio chime) work without it.
