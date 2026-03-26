import './App.css';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from './components/ui/sonner';
import { MainProviders } from './providers';
import { MainRouter } from './Router';
import { AbTestProvider } from './lib/ab-test';

function App() {

  return (
    <MainProviders>
      <AbTestProvider>
        <TooltipProvider>
          <MainRouter />
          <Toaster />
        </TooltipProvider>
      </AbTestProvider>
    </MainProviders>
  );
}

export default App;
