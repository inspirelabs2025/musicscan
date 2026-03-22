import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { MobileHeader } from './mobile-header';
import { Toaster } from '@/components/ui/sonner';
import { trackEvent } from '@/lib/analytics';
import { AiFeatureNudge } from './grow/ai-feature-nudge';
import { getABTestVariant, aiNudgeABTestConfig } from '@/lib/ab-test';

interface DashboardShellProps {
  title?: string;
  withSidebar?: boolean;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ title, withSidebar = true }) => {
  const location = useLocation();
  const [showAiNudge, setShowAiNudge] = useState(false);

  useEffect(() => {
    trackEvent('page_view', { page_path: location.pathname, page_title: title || document.title });

    const aiNudgeVariant = getABTestVariant(aiNudgeABTestConfig);
    if (aiNudgeVariant === 'nudge') {
      setShowAiNudge(true);
    } else {
      setShowAiNudge(false);
    }
  }, [location.pathname, title]);

  const handleCloseNudge = () => {
    setShowAiNudge(false);
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {withSidebar && <Sidebar />}
      <div className="flex flex-col">
        <MobileHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
      {showAiNudge && <AiFeatureNudge isVisible={showAiNudge} onClose={handleCloseNudge} />}
    </div>
  );
};
