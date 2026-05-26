import { Outlet, useLocation } from 'react-router-dom';
import { Providers } from './providers';
import { StickyHeader } from './components/layout/StickyHeader';

function App() {
  const { pathname } = useLocation();
  const hideHeader = pathname.startsWith('/admin');

  return (
    <Providers>
      {!hideHeader && <StickyHeader />}
      <Outlet />
    </Providers>
  );
}

export default App;
