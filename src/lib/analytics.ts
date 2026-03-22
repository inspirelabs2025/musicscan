export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  } else {
    console.warn(`gtag is not defined. Event '${eventName}' not tracked.`, eventParams);
  }
};
