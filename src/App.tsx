import { Outlet, useLocation } from 'react-router-dom';
import { Providers } from './providers';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { MobileBottomNav } from './components/MobileBottomNav';
import { StickyHeader } from './components/layout/StickyHeader';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <Providers>
      <TooltipProvider>
        {!isAdminRoute && <StickyHeader />}
        <Outlet />
      </TooltipProvider>
      <Toaster />
      {!isAdminRoute && <MobileBottomNav />}
    </Providers>
  );
}

export default App;
