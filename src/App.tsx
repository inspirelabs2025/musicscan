import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AiNudgeBanner } from './components/ai-nudge-banner';
import { Providers } from './providers';

function App() {
  return (
    <Providers>
      <TooltipProvider>
        <Outlet />
        <Toaster />
        <AiNudgeBanner />
      </TooltipProvider>
    </Providers>
  );
}

export default App;
