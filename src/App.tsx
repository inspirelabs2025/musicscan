import { Outlet } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { Providers } from "./providers";
import { AINudge } from "./components/ai-nudge";
import { FloatingMikeChat } from "./components/FloatingMikeChat";
import { StickyHeader } from "./components/layout/StickyHeader";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { GlobalCanonical } from "./components/SEO/GlobalCanonical";
import { usePageTracking } from "./hooks/usePageTracking";

function App() {
  usePageTracking();

  return (
    <Providers>
      <GlobalCanonical />
      <StickyHeader />
      <main className="pt-14 pb-16 md:pb-0">
        <Outlet />
        <Toaster />
        <AINudge />
        <FloatingMikeChat />
      </main>
      <MobileBottomNav />
    </Providers>
  );
}

export default App;
