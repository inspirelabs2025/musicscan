import { getCookie, setCookie } from './utils';

const AI_NUDGE_VARIANT_COOKIE = 'ai_nudge_variant';
const AI_NUDGE_EXPERIMENT_ID = 'ai-nudge-v1';

// Define possible variants for the A/B test
type AINudgeVariant = 'control' | 'nudge';

/**
 * Determines the A/B test variant for the AI nudge feature.
 * Uses a cookie to ensure consistent variant assignment for a user.
 * If no variant is set, it randomly assigns 'control' or 'nudge' and sets a cookie.
 * @returns {AINudgeVariant} The assigned variant ('control' or 'nudge').
 */
export function getAINudgeVariant(): AINudgeVariant {
  let variant = getCookie(AI_NUDGE_VARIANT_COOKIE) as AINudgeVariant;

  if (!variant) {
    // If no variant cookie, randomly assign one
    variant = Math.random() < 0.5 ? 'control' : 'nudge';
    setCookie(AI_NUDGE_VARIANT_COOKIE, variant, 365); // Persist for 1 year
  }

  return variant;
}

/**
 * Tracks an A/B test event using Google Analytics.
 * @param {string} eventName The name of the event (e.g., 'view_nudge', 'click_nudge').
 * @param {AINudgeVariant} variant The A/B test variant.
 */
export function trackAIBTestEvent(eventName: string, variant: AINudgeVariant): void {
  if (window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'ai_nudge_experiment',
      event_label: variant,
      experiment_id: AI_NUDGE_EXPERIMENT_ID,
      experiment_variant: variant,
    });
  }
}
