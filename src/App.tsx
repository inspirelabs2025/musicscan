import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AiNudgeBanner } from './components/ai-nudge-banner';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <TooltipProvider>
          <Routes>
            <Route path="*" element={<div className="flex items-center justify-center h-screen text-2xl font-bold bg-background text-foreground">Welcome to your App! Implement your routes here.</div>} />
          </Routes>
          <Toaster />
          <AiNudgeBanner />
        </TooltipProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
