interface ABTestConfig {
  [testName: string]: { variants: string[]; defaultVariant: string };
}

const config: ABTestConfig = {
  aiNudgeVariant: { variants: ['control', 'nudge'], defaultVariant: 'control' },
  // Add other A/B test configurations here
};

export const getVariant = (testName: string): string => {
  if (typeof window === 'undefined') return config[testName]?.defaultVariant || 'control';

  const storageKey = `ab_test_${testName}`;
  let variant = localStorage.getItem(storageKey);

  if (!variant || !config[testName]?.variants.includes(variant)) {
    const variants = config[testName]?.variants || ['control'];
    variant = variants[Math.floor(Math.random() * variants.length)];
    localStorage.setItem(storageKey, variant);
  }
  return variant;
};

export const trackABTestEvent = (testName: string, eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const variant = getVariant(testName);
    // Replace with your actual analytics tracking function (e.g., Google Analytics gtag)
    (window as any).gtag('event', eventName, {
      event_category: 'AB Test',
      event_label: `${testName}_${variant}`,
      test_name: testName,
      variant: variant,
      ...properties,
    });
  } else {
    console.log(`AB Test Event: ${testName} - Variant: ${getVariant(testName)} - Event: ${eventName}`, properties);
  }
};
