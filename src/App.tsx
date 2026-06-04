import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import routes from './Routes';
import { Toaster } from './components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import AINudge from './components/growth/AINudge';
import { useAINudge } from './hooks/useAINudge';

const queryClient = new QueryClient();
const router = createBrowserRouter(routes);

function App() {
  const { aiUsedCount, isLoading } = useAINudge();

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
        {!isLoading && <AINudge aiUsedCount={aiUsedCount} />}
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
