import { Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import Callback from './pages/Callback';
import ProjectSettings from './pages/ProjectSettings/ProjectSettings';
import { Toaster } from './components/ui/sonner';
import CreateProject from './pages/CreateProject';
import { ThemeProvider } from './contexts/ThemeContext';
import BillingPage from './pages/BillingPage/BillingPage';
import ProfilePage from './pages/ProfilePage';
import OrganizationSettings from './pages/OrganizationSettings/OrganizationSettings';
import { SettingsProvider } from './contexts/SettingsContext';
import OrganizationMembers from './pages/OrganizationMembers';
import RootLayout from './layouts/RootLayout';
import useCheckChatMessages from './hooks/useCheckChatMessages';

function App() {
  const navigate = useNavigate();
  useCheckChatMessages(); // Call the hook here

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <AuthProvider navigate={navigate}>
        <ProjectProvider>
          <SettingsProvider>
            <Routes>
              <Route path="/callback" element={<Callback />} />
              <Route path="/create-project" element={<CreateProject />} />
              <Route path="/dashboard/:projectId/*" element={<RootLayout contentComponent={Dashboard} />} />
              <Route path="/project-settings/:projectId" element={<RootLayout contentComponent={ProjectSettings} />} />
              <Route path="/organization-settings" element={<RootLayout contentComponent={OrganizationSettings} />} />
              <Route path="/organization-members" element={<RootLayout contentComponent={OrganizationMembers} />} />
              <Route path="/billing" element={<RootLayout contentComponent={BillingPage} />} />
              <Route path="/profile" element={<RootLayout contentComponent={ProfilePage} />} />
              <Route path="/" element={<RootLayout contentComponent={Dashboard} />} />
            </Routes>
            <Toaster />
          </SettingsProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
