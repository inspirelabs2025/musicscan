import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from './components/layout/Layout';

// Public Pages 
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";

// Auth Pages
import { SignUpPage } from "./pages/Auth/SignUpPage";
import { SignInPage } from "./pages/Auth/SignInPage";
import { ForgotPasswordPage } from "./pages/Auth/ForgotPasswordPage";
import { NewPasswordPage } from "./pages/Auth/NewPasswordPage";

// Dashboard Pages
import { DashboardPage } from "./pages/Dashboard/DashboardPage";
import { SettingsPage } from "./pages/Dashboard/SettingsPage";
import { UserAnalyticsPage } from "./pages/Dashboard/UserAnalyticsPage";
import { ProjectSettingsPage } from "./pages/Dashboard/ProjectSettingsPage";
import { MembersPage } from "./pages/Dashboard/MembersPage";
import { IntegrationsPage } from "./pages/Dashboard/IntegrationsPage";
import { BillingPage } from "./pages/Dashboard/BillingPage";
import { AuditLogPage } from "./pages/Dashboard/AuditLogPage";
import { NotificationsPage } from "./pages/Dashboard/NotificationsPage";
import { APIDocsPage } from "./pages/Dashboard/APIDocsPage";
import { AIStudioPage } from "./pages/Dashboard/AIStudioPage";

const router = createBrowserRouter([
  { element: <Layout />, id: 'layout', lazy: () => import('./components/layout/Layout') , children: [
    { path: "/", element: <HomePage /> },
    { path: "/signup", element: <SignUpPage /> },
    { path: "/signin", element: <SignInPage /> },
    { path: "/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/new-password", element: <NewPasswordPage /> },
    {
      path: "/dashboard",
      element: <DashboardPage />,
      children: [
        { path: "settings", element: <SettingsPage /> },
        { path: "project-settings", element: <ProjectSettingsPage />},
        { path: "members", element: <MembersPage />},
        { path: "integrations", element: <IntegrationsPage />},
        { path: "billing", element: <BillingPage />},
        { path: "audit-log", element: <AuditLogPage />},
        { path: "notifications", element: <NotificationsPage />},
        { path: "api-docs", element: <APIDocsPage />},
        { path: "analytics", element: <UserAnalyticsPage />},
        { path: "ai", element: <AIStudioPage /> }, // New route for AI Studio
      ]
    },
    
    { path: "*", element: <NotFoundPage /> },
  ]}
]);

export const MainRouter = () => {
  return <RouterProvider router={router} />;
};
