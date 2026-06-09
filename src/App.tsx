import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import { StickyHeader } from './components/layout/StickyHeader';

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <Providers>
      {!isAdmin && <StickyHeader />}
      <div className={!isAdmin ? 'pt-28 md:pt-16' : ''}>
        <Outlet />
      </div>
      <Toaster />
    </Providers>
  );
}

export default App;
