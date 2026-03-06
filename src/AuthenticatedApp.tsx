import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { SidebarLayout } from './components/layout/sidebar-layout';
import { PageLoader } from './components/shared/page-loader';
import { useAuth } from './hooks/useAuth';
import React from 'react';

interface AuthenticatedAppProps {
  children: React.ReactNode;
}

export const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ children }) => {
  const { user, loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
};
