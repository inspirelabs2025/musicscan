import ReactGA from 'react-ga4';

export const trackAiNudgeDismiss = () => {
  if (ReactGA.isInitialized) {
    ReactGA.event({
      category: 'AI Nudge',
      action: 'Dismiss Nudge',
      label: 'User dismissed AI feature nudge',
    });
  }
};

export const trackAiNudgeView = () => {
    if (ReactGA.isInitialized) {
        ReactGA.event({
            category: 'AI Nudge',
            action: 'View Nudge',
            label: 'User viewed AI feature nudge banner',
        });
    }
};

export const trackAiNudgeClick = () => {
    if (ReactGA.isInitialized) {
        ReactGA.event({
            category: 'AI Nudge',
            action: 'Click Nudge CTA',
            label: 'User clicked AI feature nudge CTA',
        });
    }
};
