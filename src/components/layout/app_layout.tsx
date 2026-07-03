import { ReactNode, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/navigation/sidebar';
import { Header } from '@/components/navigation/header';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { CommandMenu } from '@/components/command-menu';
import { HelpSidebar } from '../navigation/help_sidebar';
import { Analytics } from '@vercel/analytics/react';
import { Hotjar } from 'react-hotjar';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AiNudge } from '../marketing/ai_nudge';

interface AppLayoutProps {
  children?: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHelpSidebarOpen, setIsHelpSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize Hotjar
    // Check if HJID and HJSV are defined before initializing
    if (import.meta.env.VITE_HOTJAR_ID && import.meta.env.VITE_HOTJAR_SNIPPET_VERSION) {
      Hotjar.init(Number(import.meta.env.VITE_HOTJAR_ID), Number(import.meta.env.VITE_HOTJAR_SNIPPET_VERSION));
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleToggleHelpSidebar = () => {
    setIsHelpSidebarOpen(!isHelpSidebarOpen);
  };

  return (
    <div className="flex h-screen font-body antialiased">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={handleToggleSidebar} />
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          isSidebarOpen ? 'ml-0 lg:ml-[250px]' : 'ml-0'
        )}
      >
        <Header toggleSidebar={handleToggleSidebar} toggleHelpSidebar={handleToggleHelpSidebar} />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          {children || <Outlet />}
        </main>
        <Toaster />
        <CommandMenu />
      </div>
      <HelpSidebar isOpen={isHelpSidebarOpen} toggleHelpSidebar={handleToggleHelpSidebar} />
      <Analytics />
      <SpeedInsights />
      <AiNudge />
    </div>
  );
};
