import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/components/ui/use-toast';
import { AiNudgeBanner } from './components/ai-nudge-banner'; // Import the new component

// Import your existing components
// For example, if you have a main layout component:
// import MainLayout from './layouts/MainLayout';
// import HomePage from './pages/HomePage';
// import AiFeaturesPage from './pages/AiFeaturesPage'; // Assuming you have an AI features page

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <TooltipProvider>
          <ToastProvider>
            <Routes>
              {/* Example routes - replace with your actual application routes */}
              {/* <Route path="/" element={<MainLayout><HomePage /></MainLayout>} /> */}
              {/* <Route path="/ai-features" element={<MainLayout><AiFeaturesPage /></MainLayout>} /> */}
              {/* Add other routes here */}
              <Route path="*" element={<div className="flex items-center justify-center h-screen text-2xl font-bold bg-background text-foreground">Welcome to your App! Implement your routes here.</div>} />
            </Routes>
            <Toaster />
            <AiNudgeBanner /> {/* Render the nudge banner here */}
          </ToastProvider>
        </TooltipProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
