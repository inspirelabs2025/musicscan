import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AiNudgeBanner } from '@/components/AiNudgeBanner';
import { useAiNudge } from '@/hooks/useAiNudge';

const AppLayout: React.FC = () => {
  useAiNudge(); // Initialize and listen for AI nudge state

  return (
    <div className="min-h-screen flex flex-col">
      <AiNudgeBanner />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Toaster richColors />
    </div>
  );
};

export default AppLayout;
