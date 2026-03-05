import { GrowthBook } from '@growthbook/growthbook-react';

export const growthbook = new GrowthBook({
  apiHost: import.meta.env.VITE_PUBLIC_GROWTHBOOK_API_HOST,
  clientKey: import.meta.env.VITE_PUBLIC_GROWTHBOOK_CLIENT_KEY,
  enableDevMode: import.meta.env.DEV,
  trackingCallback: (experiment, result) => {
    // TODO: Use your analytics solution to track the experiment impression
    console.log('GrowthBook Experiment Viewed:', { experiment, result });
    // Example with PostHog (if integrated):
    // if (posthog) {
    //   posthog.capture('experiment_viewed', {
    //     experimentId: experiment.key,
    //     variationId: result.inExperiment ? result.variationId : 'control',
    //   });
    // }
  },
  // Add a way to get user attributes, which might come from your auth system
  // For example:
  // attributes: {
  //   id: 'user-id-123',
  //   loggedIn: true,
  //   device: 'desktop',
  //   country: 'US',
  // },
});

// Load features asynchronously
growthbook.loadFeatures();

// GrowthBook SDK setup for A/B testing can be enhanced here.
// For the AI Nudge, we can define a feature flag in GrowthBook.
// Example feature flag definition (this would be managed in GrowthBook UI, not code):
// {
//   "key": "ai-nudge-feature",
//   "defaultValue": false,
//   "variations": [true, false],
//   "rules": [
//     {
//       "condition": {"loggedIn": true, "aiUsageCount": 0},
//       "force": 0.5 // 50% of targeted users get the nudge
//     }
//   ]
// }
