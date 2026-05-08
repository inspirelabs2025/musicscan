import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Providers } from './providers';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { MobileBottomNav } from './components/MobileBottomNav';
import { StickyHeader } from './components/layout/StickyHeader';
import { useAppVersionCheck } from './hooks/useAppVersionCheck';
import { hardReset } from './utils/appReset';

function AppShell() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  useAppVersionCheck();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'hard') void hardReset();
  }, []);

  return (
    <>
      <TooltipProvider>
        {!isAdminRoute && <StickyHeader />}
        <Outlet />
      </TooltipProvider>
      <Toaster />
      {!isAdminRoute && <MobileBottomNav />}
    </>
  );
}

function App() {
  return (
    <Providers>
      <AppShell />
    </Providers>
  );
}

export default App;
