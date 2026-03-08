export type AiNudgeVariant = 'control' | 'nudge';

const AB_TEST_KEY = 'ai_nudge_ab_test_variant';

export function getAiNudgeVariant(): AiNudgeVariant {
  // First, check server-side assigned variant (e.g., from an environment variable).
  // This would typically be set during build or deployment.
  const serverVariant = import.meta.env.VITE_AI_NUDGE_VARIANT as AiNudgeVariant | undefined;
  if (serverVariant && ['control', 'nudge'].includes(serverVariant)) {
    // Persist server variant to local storage for consistent user experience
    // across sessions, unless the user specifically has a client-side override.
    if (!localStorage.getItem(AB_TEST_KEY)) {
      localStorage.setItem(AB_TEST_KEY, serverVariant);
    }
    return serverVariant;
  }

  // If no server-side variant, check local storage for a previously assigned variant.
  const storedVariant = localStorage.getItem(AB_TEST_KEY) as AiNudgeVariant | null;
  if (storedVariant && ['control', 'nudge'].includes(storedVariant)) {
    return storedVariant;
  }

  // If no stored variant, randomly assign one and store it.
  // For initial rollout, we'll assign 'nudge' to a higher percentage
  // or default to it if no specific A/B testing framework is in place.
  // For this task, we'll default to 'control' unless explicitly set to 'nudge' somewhere.
  const assignedVariant: AiNudgeVariant = Math.random() < 0.5 ? 'control' : 'nudge'; // 50/50 split example
  localStorage.setItem(AB_TEST_KEY, assignedVariant);
  return assignedVariant;
}

/**
 * Simulates an AI feature usage event. 
 * In a real application, this would track actual AI feature usage.
 */
export function recordAiFeatureUsage() {
  localStorage.setItem('ai_feature_used', 'true');
}

export function hasUsedAiFeature(): boolean {
  return localStorage.getItem('ai_feature_used') === 'true';
}
