import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';

// Public Pages
const LandingPage = lazy(() => import('@/pages/landing'));
const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));

// Authenticated Pages
const DashboardPage = lazy(() => import('@/pages/Dashboard'));

// AI Features Page (New)
const AIFeaturesPage = lazy(() => import('@/pages/ai-features'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout showMenu={false} showSearch={false} />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '/dashboard',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: '/ai-features',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <AIFeaturesPage />,
      },
    ],
  },
]);
