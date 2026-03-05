import { env } from '@/env';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import React, { createContext, useContext } from 'react';

// Initialize PostHog
if (env.VITE_PUBLIC_POSTHOG_KEY && env.VITE_PUBLIC_POSTHOG_HOST) {
  posthog.init(env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: env.VITE_PUBLIC_POSTHOG_HOST,
    person_profiles: 'identified',
    loaded: (posthog) => {
      if (import.meta.env.DEV) posthog.debug();
    },
  });
}

// Define a type for your events, including potential properties
export type AnalyticsEvent = 
  | { name: 'page_view', properties: { url: string, title: string } }
  | { name: 'user_signed_up', properties: { method: string } }
  | { name: 'user_logged_in', properties: { method: string } }
  | { name: 'user_logged_out' }
  | { name: 'ai_feature_used', properties: { featureName: string, projectId?: string } }
  | { name: 'ai_nudge_shown' }
  | { name: 'ai_nudge_dismissed' }
  | { name: 'project_created', properties: { projectId: string, projectName: string } };

interface AnalyticsContextType {
  trackEvent: (event: AnalyticsEvent['name'], properties?: Record<string, any>) => void;
  identify: (userId: string, properties?: Record<string, any>) => void;
  alias: (newId: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const useTrackEvent = () => {
  const { trackEvent } = useAnalytics();
  return trackEvent;
};

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const trackEvent = (eventName: AnalyticsEvent['name'], properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  };

  const identify = (userId: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.identify(userId, properties);
    }
  };

  const alias = (newId: string) => {
    if (posthog) {
      posthog.alias(newId);
    }
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, identify, alias }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// We still export PostHogProvider for the root level to ensure context is available
export const PosthogProvider = PHProvider;

// This is for type safety and to ensure all our events are properly recorded without direct string magic
export const track = <K extends AnalyticsEvent['name']>(eventName: K, properties: Extract<AnalyticsEvent, { name: K }>['properties']) => {
  if (posthog) {
    posthog.capture(eventName, properties);
  }
};
