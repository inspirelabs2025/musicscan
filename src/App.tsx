import { Outlet } from 'react-router-dom';
import { Providers } from './providers';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';

function App() {
  return (
    <Providers>
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <Toaster />
    </Providers>
  );
}

export default App;
