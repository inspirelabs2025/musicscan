import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import { StickyHeader } from './components/layout/StickyHeader';
import { MobileBottomNav } from './components/MobileBottomNav';

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <Providers>
      {!isAdmin && <StickyHeader />}
      <div className={!isAdmin ? 'pt-16 pb-20 md:pb-0' : ''}>
        <Outlet />
      </div>
      {!isAdmin && <MobileBottomNav />}
      <Toaster />
    </Providers>
  );
}

export default App;
