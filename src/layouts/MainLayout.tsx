import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import AINudgeBanner from '@/components/ui/ai-nudge-banner';
import { useAINudgeStatus } from '@/hooks/use-ai-nudge-status';

const MainLayout: React.FC = () => {
  const { showNudge, aiFeatureUsedCount, dismissNudge } = useAINudgeStatus();

  return (
    <div className="flex min-h-screen bg-background">
      {showNudge && (
        <AINudgeBanner onDismiss={dismissNudge} aiFeatureUsedCount={aiFeatureUsedCount} />
      )}
      
      <Sidebar />
      <div className={`flex flex-col flex-1 ${showNudge ? 'mt-12 md:mt-10' : ''}`}>
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </div>
  );
};

export default MainLayout;
