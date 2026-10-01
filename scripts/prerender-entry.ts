/**
 * Alles wat scripts/prerender.mjs nodig heeft, in één los te bakken bestand.
 * Geen runtime-imports buiten deze bronnen; type-imports verdwijnen bij het bakken.
 */
export * from '../supabase/functions/universal-ssr-proxy/value-page';
export { WAARDE_HUB_COPY } from '../src/content/waardeHubCopy';
export { CORE_SEO, SCAN_COPY, VALUE_COPY } from '../src/i18n/coreSeo';
