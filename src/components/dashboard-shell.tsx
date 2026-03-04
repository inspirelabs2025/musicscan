import React from 'react';
import { DashboardHeader, DashboardHeaderProps } from './dashboard-header';
import { DashboardSection } from './dashboard-section';
import { cn } from '@/lib/utils';
import { ChatPromotionBanner } from './chat-promotion-banner'; // Import the new banner component

interface DashboardShellProps extends DashboardHeaderProps {
  children: React.ReactNode;
  className?: string; // Add className prop
}

export function DashboardShell({
  title,
  description,
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div className={cn("grid items-start gap-8", className)}>
      <DashboardHeader title={title} description={description} {...props} />
      {/* Render the chat promotion banner here */}
      <ChatPromotionBanner />
      {children}
    </div>
  );
}
