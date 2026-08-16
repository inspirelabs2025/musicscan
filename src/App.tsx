import { Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from '@/components/layout';
import HomePage from '@/pages/HomePage';
import ScanPage from '@/pages/ScanPage';
import NotFoundPage from '@/pages/NotFoundPage';
import SettingsPage from '@/pages/SettingsPage';
import HistoryPage from '@/pages/HistoryPage';
import VinylDetailsPage from '@/pages/VinylDetailsPage';
import AddVinylPage from '@/pages/AddVinylPage';
import ArtistDetailsPage from '@/pages/ArtistDetailsPage';
import AlbumDetailsPage from '@/pages/AlbumDetailsPage';
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';
import RequestPasswordResetPage from '@/pages/Auth/RequestPasswordResetPage';
import UpdatePasswordPage from '@/pages/Auth/UpdatePasswordPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProfilePage from '@/pages/ProfilePage';
import ArtistAdminPage from '@/pages/Admin/ArtistAdminPage';
import AlbumAdminPage from '@/pages/Admin/AlbumAdminPage';
import GenreAdminPage from '@/pages/Admin/GenreAdminPage';
import AdminLayout from '@/components/admin-layout';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import AIEntryPage from '@/pages/AIEntryPage';
import AiNudge from '@/components/growth/ai-nudge';
import { AiFeaturesNudge } from '@/components/growth/ai-features-nudge'; // Import new nudge
import ChatNudge from '@/components/growth/chat-nudge';
import UserManagementPage from '@/pages/Admin/UserManagementPage';

const AI_FEATURES_NUDGE_VARIANT = import.meta.env.VITE_AI_FEATURES_NUDGE_VARIANT;

function App() {
  const { user, initialSessionLoaded } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('User logged in:', user.id);
      // Potentially fetch user-specific data here, like AI usage count
      // For now, we'll mock it or assume 0 for the purpose of the nudge
    }
  }, [user]);

  // Mock AI usage count for demonstration. In a real app, this would come from a database.
  const mockAiUsageCount = 0; // Set to 0 to trigger the nudge

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider delayDuration={300}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />

          {/* Main App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="scan" element={<ScanPage />} />
              <Route path="ai-features" element={<AIEntryPage />} /> {/* New AI features page */}
              <Route path="history" element={<HistoryPage />} />
              <Route path="vinyl/:id" element={<VinylDetailsPage />} />
              <Route path="vinyl/add" element={<AddVinylPage />} />
              <Route path="artist/:id" element={<ArtistDetailsPage />} />
              <Route path="album/:id" element={<AlbumDetailsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedAdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="artists" element={<ArtistAdminPage />} />
              <Route path="albums" element={<AlbumAdminPage />} />
              <Route path="genres" element={<GenreAdminPage />} />
              <Route path="users" element={<UserManagementPage />} />
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster />
        {initialSessionLoaded && user && (
          <>
            {/* AI Nudge - existing one */}
            <AiNudge aiUsageCount={0} /> {/* Assuming 0 for the generic AI nudge for now */}
            {/* New AI Features Nudge */}
            {AI_FEATURES_NUDGE_VARIANT === 'new_user_0x_used' && user && (
              <AiFeaturesNudge aiUsageCount={mockAiUsageCount} />
            )}
            {/* Chat Nudge - existing one */}
            <ChatNudge />
          </>
        )}

      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
