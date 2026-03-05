import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { SidebarLayout } from './components/layout/sidebar-layout';
import { PageLoader } from './components/shared/page-loader';
import { useAuth } from './hooks/useAuth';
import React, { useEffect } from 'react';
import { GrowthBook } from '@growthbook/growthbook-react';
import { PosthogProvider, useAnalytics } from './lib/analytics';
import { growthbook } from './lib/growthbook';

interface AuthenticatedAppProps {
  children: React.ReactNode;
}

export const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ children }) => {
  const { session, isLoading, userProfile } = useAuth();
  const { identify } = useAnalytics();
  const location = useLocation();

  useEffect(() => {
    if (session && userProfile) {
      identify(session.user.id, {
        email: session.user.email,
        // Add other user properties you want to track
        // Example: firstName: userProfile.first_name, lastName: userProfile.last_name
        // You might also want to set user attributes for GrowthBook here
        createdAt: session.user.created_at,
        lastSignInAt: session.user.last_sign_in_at,
        userRole: userProfile.role || 'user',
        currentWorkspaceId: userProfile.active_workspace_id,
        // Initialize GrowthBook attributes as well
        growthbook_id: session.user.id,
        growthbook_email: session.user.email,
        growthbook_userRole: userProfile.role || 'user',
        growthbook_signupMethod: session.user.app_metadata?.provider || 'email',
      });

      growthbook.setAttributes({
        id: session.user.id,
        email: session.user.email,
        loggedIn: true,
        userRole: userProfile.role || 'user',
        signupMethod: session.user.app_metadata?.provider || 'email',
        // Add any other attributes relevant for A/B testing
        // For example, an 'aiNudgeVariant' attribute can be set here if the decision is server-side
      });
    }
  }, [session, userProfile, identify]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!session) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return (
    <PosthogProvider client={growthbook.ready ? growthbook.getFeatureValue('posthog-api-host', '') : '' as any}>
      <SidebarLayout>
        {children}
      </SidebarLayout>
    </PosthogProvider>
  );
};
