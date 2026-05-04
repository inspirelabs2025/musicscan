/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_NUDGE_VARIANT?: 'nudge' | 'disabled';
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __BUILD_TIMESTAMP__: string;
