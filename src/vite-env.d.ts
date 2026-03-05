/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_PROJECT_ID: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_GA_MEASUREMENT_ID: string;
    readonly AI_NUDGE_VARIANT?: 'control' | 'nudge';
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Added for gtag as it's not directly included as type in vite
interface Window {
    gtag?: (...args: any[]) => void;
}
