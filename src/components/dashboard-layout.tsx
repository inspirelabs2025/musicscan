import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Toaster } from '@/components/ui/sonner'; // Ensure this is imported for sonner toasts
import { useGrowthNotifications } from '@/providers/growth-notification-provider';
import { ChatAIPromoBanner } from '@/components/chat-ai-promo-banner';

export const DashboardLayout: React.FC = () => {
  const { showChatAINotification } = useGrowthNotifications();

  useEffect(() => {
    // Trigger the in-app notification after a short delay to ensure UI is ready
    const timer = setTimeout(() => {
      showChatAINotification();
    }, 2000);

    return () => clearTimeout(timer);
  }, [showChatAINotification]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 relative">
          <ChatAIPromoBanner /> {/* Positioned absolutely to float over content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
