// Environment variables wrapper
export const env = {
  VITE_PUBLIC_POSTHOG_KEY: import.meta.env.VITE_PUBLIC_POSTHOG_KEY || '',
  VITE_PUBLIC_POSTHOG_HOST: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || '',
  VITE_PUBLIC_GROWTHBOOK_API_HOST: import.meta.env.VITE_PUBLIC_GROWTHBOOK_API_HOST || '',
  VITE_PUBLIC_GROWTHBOOK_CLIENT_KEY: import.meta.env.VITE_PUBLIC_GROWTHBOOK_CLIENT_KEY || '',
};
