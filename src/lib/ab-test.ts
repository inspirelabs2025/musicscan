import { getCookie } from '@/lib/utils';

export type ABTestVariant = 'control' | 'variant';

interface ExperimentDefinition {
  name: string;
  variants: ABTestVariant[];
  defaultVariant: ABTestVariant;
  // For server-side rendering or build-time overriding
  envVar?: string;
}

const experiments: ExperimentDefinition[] = [
  {
    name: 'aiNudge',
    variants: ['control', 'nudge'],
    defaultVariant: 'control',
    envVar: 'AI_NUDGE_VARIANT',
  },
  // Add more experiments here
];

interface AssignedVariants {
  [key: string]: ABTestVariant;
}

const assignedVariants: AssignedVariants = {};

export const getVariant = (experimentName: string): ABTestVariant => {
  if (assignedVariants[experimentName]) {
    return assignedVariants[experimentName];
  }

  const experiment = experiments.find((exp) => exp.name === experimentName);
  if (!experiment) {
    console.warn(`Experiment '${experimentName}' not found.`);
    return 'control';
  }

  // 1. Check for server-side/build-time override (e.g., from environment variables)
  if (experiment.envVar && import.meta.env[experiment.envVar]) {
    const envVariant = import.meta.env[experiment.envVar] as ABTestVariant;
    if (experiment.variants.includes(envVariant)) {
      assignedVariants[experimentName] = envVariant;
      return envVariant;
    } else {
      console.warn(`Invalid variant '${envVariant}' for experiment '${experimentName}' found in environment variable, falling back to default.`);
    }
  }

  // 2. Check cookie for existing assignment
  const cookieVariant = getCookie(`ab_${experimentName}`);
  if (cookieVariant && experiment.variants.includes(cookieVariant as ABTestVariant)) {
    assignedVariants[experimentName] = cookieVariant as ABTestVariant;
    return assignedVariants[experimentName];
  }

  // 3. Assign randomly if no existing assignment
  const randomVariant = experiment.variants[Math.floor(Math.random() * experiment.variants.length)];
  // Set cookie for 30 days
  document.cookie = `ab_${experimentName}=${randomVariant}; path=/; max-age=${60 * 60 * 24 * 30}`;
  assignedVariants[experimentName] = randomVariant;
  return randomVariant;
};

export const trackExperiment = (experimentName: string, variant: ABTestVariant) => {
  // Implement your analytics tracking here (e.g., Google Analytics, PostHog, etc.)
  // Example for Google Analytics (assuming gtag is available globally):
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'experiment_view', {
      experiment_name: experimentName,
      variant_name: variant,
    });
  }
  console.log(`AB Test: Experiment '${experimentName}', Variant '${variant}' exposed.`);
};

export const trackConversion = (experimentName: string, conversionType: string) => {
    const variant = getVariant(experimentName);
    if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'experiment_conversion', {
            experiment_name: experimentName,
            variant_name: variant,
            conversion_type: conversionType,
        });
    }
    console.log(`AB Test: Experiment '${experimentName}', Variant '${variant}' converted for '${conversionType}'`);
};
