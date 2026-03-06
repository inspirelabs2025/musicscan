import React from 'react';
import Sidebar from '@/components/Sidebar';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-[var(--sidebar-width)]">
        {children}
      </div>
    </div>
  );
};
