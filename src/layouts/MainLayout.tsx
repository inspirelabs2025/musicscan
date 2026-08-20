import { Outlet } from 'react-router-dom';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { ModeToggle } from '@/components/mode-toggle';
import { Toaster } from '@/components/ui/sonner';
import AiFeaturesNudge from '@/components/AiFeaturesNudge'; // Import the new nudge component

export function MainLayout() {
  // TODO: Replace with actual user AI usage count from backend/context
  const aiUsageCount = 0; 
  
  // Example onDismiss handler - in a real app, this would update user preferences
  const handleNudgeDismiss = () => {
    console.log('AI Features Nudge dismissed');
    // You might want to store this in local storage or user settings
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <MainNav />
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              <ModeToggle />
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">
          {/* AI Features Nudge positioned above the main content */}
          <div className="mb-6">
            <AiFeaturesNudge
              aiUsageCount={aiUsageCount}
              variant="growth"
              onDismiss={handleNudgeDismiss}
            />
          </div>
          <Outlet />
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
