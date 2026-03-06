import React, { createContext, useContext } from 'react';

type AnalyticsEvent = 
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
    return { trackEvent: () => {}, identify: () => {}, alias: () => {} };
  }
  return context;
};

export const useTrackEvent = () => {
  const { trackEvent } = useAnalytics();
  return trackEvent;
};

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: AnalyticsContextType = {
    trackEvent: () => {},
    identify: () => {},
    alias: () => {},
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const PosthogProvider: React.FC<{ children: React.ReactNode; client?: any }> = ({ children }) => {
  return <>{children}</>;
};

export const track = (_eventName: string, _properties?: any) => {};
