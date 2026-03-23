import { setCookie, getCookie } from "./utils";

interface ABTestConfig {
  name: string;
  variants: string[];
  defaultVariant: string;
  cookieName?: string;
  expiryDays?: number;
}

// Function to get the assigned variant for a given A/B test
export function getABTestVariant(config: ABTestConfig): string {
  const { name, variants, defaultVariant, cookieName, expiryDays } = config;
  const finalCookieName = cookieName || `ab_${name}`;

  let variant = getCookie(finalCookieName);

  if (!variant || !variants.includes(variant)) {
    // Assign a new variant if not set or invalid
    variant = variants[Math.floor(Math.random() * variants.length)];
    setCookie(finalCookieName, variant, expiryDays || 30);
  }

  return variant;
}

// Specific A/B test configuration for the AI Nudge
export const aiNudgeABTestConfig: ABTestConfig = {
  name: 'ai_nudge',
  variants: ['control', 'nudge'],
  defaultVariant: 'control',
  expiryDays: 90,
};

export function useAINudgeVariant(): string {
  return getABTestVariant(aiNudgeABTestConfig);
}
