
interface Window {
  gtag?: (
    command: 'event' | 'config',
    action: string,
    params: { [key: string]: any }
  ) => void;
}

/**
 * Tracks the usage of AI features.
 * This utility provides methods to record when an AI feature is used
 * and if the feature usage has hit a certain threshold (e.g., 1x).
 */
class AIUsageTracker {
  private static instance: AIUsageTracker;
  private AI_USAGE_KEY = 'ai_feature_usage_count';

  private constructor() { }

  public static getInstance(): AIUsageTracker {
    if (!AIUsageTracker.instance) {
      AIUsageTracker.instance = new AIUsageTracker();
    }
    return AIUsageTracker.instance;
  }

  /**
   * Increments the AI feature usage count and tracks an event.
   * @param featureName The name of the AI feature used (e.g., 'image_generation', 'text_summarization').
   */
  public recordAIUsage(featureName: string): void {
    const currentCount = this.getAIUsageCount();
    const newCount = currentCount + 1;
    localStorage.setItem(this.AI_USAGE_KEY, newCount.toString());

    this.trackGAEvent('ai_feature_used', featureName, newCount);

    if (newCount === 1) {
      this.trackGAEvent('ai_feature_first_use', featureName, 1);
    }
  }

  /**
   * Get the current AI feature usage count.
   * @returns The number of times any AI feature has been used.
   */
  public getAIUsageCount(): number {
    const count = localStorage.getItem(this.AI_USAGE_KEY);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Checks if AI features have been used at least once.
   * @returns `true` if AI features have been used, `false` otherwise.
   */
  public hasUsedAIFeatures(): boolean {
    return this.getAIUsageCount() > 0;
  }

  private trackGAEvent(eventName: string, featureName: string, usageCount: number): void {
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'AI Features',
        event_label: featureName,
        value: usageCount,
        non_interaction: false,
      });
    }
  }
}

export const aiUsageTracker = AIUsageTracker.getInstance();
