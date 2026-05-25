import { useState, useEffect } from 'react';

type AiNudgeVariant = 'control' | 'nudge';

// Determine the variant based on environment variable or client-side random assignment
function getAiNudgeVariant(): AiNudgeVariant {
  // Prioritize environment variable if set (e.g., for testing specific variants)
  if (import.meta.env.VITE_AI_NUDGE_VARIANT) {
    if (import.meta.env.VITE_AI_NUDGE_VARIANT === 'nudge') {
      return 'nudge';
    } else if (import.meta.env.VITE_AI_NUDGE_VARIANT === 'control') {
      return 'control';
    }
  }

  // Client-side random assignment for production/general use
  if (typeof window !== 'undefined') {
    let variant = localStorage.getItem('ai-nudge-variant');
    if (!variant) {
      variant = Math.random() < 0.5 ? 'nudge' : 'control'; // 50/50 split
      localStorage.setItem('ai-nudge-variant', variant);
    }
    return variant as AiNudgeVariant;
  }

  return 'control'; // Default to control on server or if localStorage is unavailable
}

export function useAiNudgeVariant(): AiNudgeVariant {
  const [variant, setVariant] = useState<AiNudgeVariant>('control');

  useEffect(() => {
    setVariant(getAiNudgeVariant());
  }, []);

  return variant;
}
