import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, MenuIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MobileHeader } from '@/components/mobile-header';
import { AINudgeBanner } from '@/components/ainudge-banner';
import { getAIFeatureUsageCount, useAINudgeABTest } from '@/lib/ab-test';

interface DashboardShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showBackButton?: boolean;
  backButtonRoute?: string;
}

export function DashboardShell({
  children,
  title,
  description,
  showBackButton = false,
  backButtonRoute = '../',
}: DashboardShellProps) {
  const location = useLocation();
  const isDashboardRoot = location.pathname === '/dashboard';
  const abVariant = useAINudgeABTest();
  const aiUsageCount = getAIFeatureUsageCount();
  const showAiNudge = abVariant === 'nudge' && isDashboardRoot && aiUsageCount === 0;

  return (
    <TooltipProvider>
      <div
        className={cn(
          'grid min-h-screen w-full lg:grid-cols-[280px_1fr]',
          'grid-rows-[auto_1fr]' // Ensure header takes up space
        )}
      >
        <Sidebar className="fixed top-0 left-0 hidden h-full lg:flex flex-col z-50" />
        <div className="flex flex-col lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 lg:border-b-0 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0 sm:max-w-xs">
                <MobileHeader />
                <Sidebar className="flex-1 overflow-auto" />
              </SheetContent>
            </Sheet>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8 pt-6">
            {showBackButton && (
              <Button
                variant="ghost"
                className="w-fit justify-start pl-0 text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link to={backButtonRoute} className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Terug
                </Link>
              </Button>
            )}
            {title && (
              <div className="flex items-center">
                <h1 className="font-semibold text-lg md:text-2xl capitalize">{title}</h1>
              </div>
            )}
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}

            {showAiNudge && (
              <div className="mt-4">
                <AINudgeBanner />
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
