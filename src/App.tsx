import { RouterProvider } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

function App() {
  return (
    <>
      <Toaster richColors />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
