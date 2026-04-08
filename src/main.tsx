import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './index.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { Provider } from 'react-redux';
import { store } from './store';
import AuthGuard from './components/AuthGuard';
import AppLayout from './layouts/AppLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactGA from 'react-ga4';
import { trackAiNudgeView } from './lib/aiNudgeTracking';

// Initialize Google Analytics (GA4)
const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (gaMeasurementId) {
  ReactGA.initialize(gaMeasurementId);
  ReactGA.send({ hitType: 'pageview', page: window.location.pathname + window.location.search });
}

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { 
    path: '/',
    element: <AuthGuard element={<AppLayout />} />,
    children: [
      { index: true, element: <App /> },
      // Add more protected routes here as needed
      { path: '/ai-features', element: <div>AI Features Page (coming soon!)</div> },
    ]
  },
]);

// Track AI Nudge view when the application first loads and AI usage is 0.
// This needs to be slightly delayed or triggered after initial state is loaded
// For now, we'll add a placeholder. The actual tracking logic for view will be in AiNudgeBanner.tsx
// once the count is fetched.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
