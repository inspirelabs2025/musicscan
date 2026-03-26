import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type AbTestVariant = 'control' | 'nudge';

interface AbTestContextType {
  variant: AbTestVariant;
  trackExposure: (testName: string, variant: AbTestVariant) => void;
}

const AbTestContext = createContext<AbTestContextType | undefined>(undefined);

export const AbTestProvider = ({ children }: { children: ReactNode }) => {
  const [variant, setVariant] = useState<AbTestVariant>('control');
  const testName = 'ai-nudge-test';

  useEffect(() => {
    // Check if variant is already stored in localStorage
    const storedVariant = localStorage.getItem(testName) as AbTestVariant;
    if (storedVariant) {
      setVariant(storedVariant);
    } else {
      // Randomly assign variant if not already assigned
      const assignedVariant: AbTestVariant = Math.random() < 0.5 ? 'control' : 'nudge'; // 50/50 split
      localStorage.setItem(testName, assignedVariant);
      setVariant(assignedVariant);
    }
  }, []);

  const trackExposure = (test: string, assignedVariant: AbTestVariant) => {
    if (window.gtag) {
      window.gtag('event', 'ab_test_exposure', {
        event_category: 'A/B Test',
        event_label: `${test} - ${assignedVariant}`,
        value: 1,
        test_name: test,
        test_variant: assignedVariant,
      });
    }
  };

  return (
    <AbTestContext.Provider value={{ variant, trackExposure }}>
      {children}
    </AbTestContext.Provider>
  );
};

export const useAbTestVariant = (testName: string = 'ai-nudge-test') => {
  const context = useContext(AbTestContext);
  if (context === undefined) {
    // If AbTestProvider is not used, fallback to control
    console.warn('useAbTestVariant must be used within an AbTestProvider. Defaulting to control variant.');
    return { variant: 'control', trackExposure: () => {} };
  }

  useEffect(() => {
    // Track exposure once the component mounts and variant is stable
    if (context.variant) {
      context.trackExposure(testName, context.variant);
    }
  }, [context.variant, testName, context.trackExposure]);

  return { variant: context.variant };
};
