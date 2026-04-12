export type AINudgeVariant = 'control' | 'nudge';

// Determine the AI nudge variant from environment variable or client-side randomization
export const getAiNudgeVariant = (): AINudgeVariant => {
  if (import.meta.env.VITE_AI_NUDGE_VARIANT) {
    return import.meta.env.VITE_AI_NUDGE_VARIANT as AINudgeVariant;
  }
  // Client-side random assignment if not explicitly set
  return Math.random() < 0.5 ? 'control' : 'nudge';
};

// Placeholder function to check if the user has used AI features
// In a real application, this would query user data (e.g., from Supabase)
export const hasUsedAIFeatures = (): boolean => {
  // TODO: Implement actual check based on user activity (e.g., database query)
  // For now, it always returns false to ensure the nudge is shown for testing
  return false;
};
