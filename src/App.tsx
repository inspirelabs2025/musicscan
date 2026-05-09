import './App.css';
import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';
import { useChatMessages } from './hooks/useChatMessages';
import { toast } from '@/components/ui/use-toast';
import { BellRing } from 'lucide-react';
import { Button } from './components/ui/button';

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: chatMessages } = useChatMessages();

  useEffect(() => {
    if (!loading && user && (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/')) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate, location.pathname]);

  useEffect(() => {
    if (!loading && user && chatMessages && chatMessages.length === 0) {
      toast({
        title: '💬 Heb je de chat al geprobeerd?',
        description: 'Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!',
        action: (
          <Button
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate('/dashboard?tab=chat')}
          >
            Probeer chat
          </Button>
        ),
        icon: <BellRing className="h-5 w-5" />,
        duration: 10000,
      });
    }
  }, [user, loading, chatMessages, navigate]);

  return (
    <div className="App min-h-screen flex flex-col bg-background text-foreground">
      {user && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
