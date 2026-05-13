import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './index.css';
import { Toaster } from 'sonner';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AiNudge } from './components/ui/ai-nudge.tsx';
import { isAiNudgeEnabled } from './lib/utils.ts';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      {isAiNudgeEnabled() && <AiNudge variant="nudge" />}
    </QueryClientProvider>
  </React.StrictMode>
);
