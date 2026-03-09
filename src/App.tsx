import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AiNudgeBanner } from './components/ai-nudge-banner';
import { Providers } from './providers';
import { StickyHeader } from './components/layout/StickyHeader';

function App() {
  return (
    <Providers>
      <TooltipProvider>
        <StickyHeader />
        <Outlet />
        <Toaster />
        <AiNudgeBanner />
      </TooltipProvider>
    </Providers>
  );
}

export default App;
