/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_NUDGE_VARIANT: string;
  readonly VITE_CHAT_NUDGE_VARIANT: string;
  readonly VITE_GA_MEASUREMENT_ID: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
