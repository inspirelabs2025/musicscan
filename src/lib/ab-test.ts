import { useEffect, useState } from "react";

// Define possible values for the AI nudge A/B test
export const AB_TEST_VALUES = {
  AI_NUDGE: {
    CONTROL: 'control',
    NUDGE: 'nudge',
  },
} as const;

type ABNudgeVariant = typeof AB_TEST_VALUES.AI_NUDGE[keyof typeof AB_TEST_VALUES.AI_NUDGE];

interface ABTestService {
  getABVariant: (testName: keyof typeof AB_TEST_VALUES, defaultValue?: string) => string;
}

const AB_TEST_LOCAL_STORAGE_KEY = "ab_test_variants";

/**
 * Client-side function to determine the A/B test variant for a given test.
 * It first checks if a variant is already stored in localStorage.
 * If not, it randomly assigns a variant and stores it.
 * @param testName The name of the A/B test (e.g., 'AI_NUDGE').
 * @param defaultValue An optional default value if random assignment is not desired or fails.
 * @returns The assigned A/B test variant.
 */
export const getABVariant: ABTestService['getABVariant'] = (testName, defaultValue) => {
  const testVariants = AB_TEST_VALUES[testName];
  if (!testVariants) {
    console.warn(`AB Test '${String(testName)}' not defined. Returning default.`);
    return defaultValue || '';
  }

  const storedVariants = JSON.parse(localStorage.getItem(AB_TEST_LOCAL_STORAGE_KEY) || '{}');
  let variant = storedVariants[testName];

  if (!variant) {
    const possibleVariants = Object.values(testVariants);
    if (possibleVariants.length === 0) {
      console.warn(`No variants defined for AB Test '${String(testName)}'. Returning default.`);
      return defaultValue || '';
    }

    // Randomly assign a variant
    const randomIndex = Math.floor(Math.random() * possibleVariants.length);
    variant = possibleVariants[randomIndex];

    // Store the assigned variant
    storedVariants[testName] = variant;
    localStorage.setItem(AB_TEST_LOCAL_STORAGE_KEY, JSON.stringify(storedVariants));
  }

  return variant;
};

/**
 * React hook to get the A/B test variant for a given test, with state management.
 * This hook ensures that the component re-renders if the variant changes (though it shouldn't once set).
 * @param testName The name of the A/B test (e.g., 'AI_NUDGE').
 * @param defaultValue An optional default value.
 * @returns The assigned A/B test variant.
 */
export function useABTestVariant<T extends keyof typeof AB_TEST_VALUES>(testName: T, defaultValue?: typeof AB_TEST_VALUES[T][keyof typeof AB_TEST_VALUES[T]]): typeof AB_TEST_VALUES[T][keyof typeof AB_TEST_VALUES[T]] {
  const [variant, setVariant] = useState<typeof AB_TEST_VALUES[T][keyof typeof AB_TEST_VALUES[T]]>(() => {
    // Initialize from localStorage or assign new, then cast to specific type
    return getABVariant(testName, defaultValue as string) as typeof AB_TEST_VALUES[T][keyof typeof AB_TEST_VALUES[T]];
  });

  useEffect(() => {
    const newVariant = getABVariant(testName, defaultValue as string) as typeof AB_TEST_VALUES[T][keyof typeof AB_TEST_VALUES[T]];
    if (newVariant !== variant) {
      setVariant(newVariant);
    }
  }, [testName, defaultValue, variant]);

  return variant;
}

// Example usage (for AI Nudge specific variant)
export function useAINudgeVariant(): ABNudgeVariant {
  return useABTestVariant('AI_NUDGE', AB_TEST_VALUES.AI_NUDGE.CONTROL);
}
