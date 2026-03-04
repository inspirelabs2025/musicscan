import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({ children, className }: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {children}
    </section>
  );
}
