import { Outlet, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <Providers>
      <GlobalCanonical />
      {!isAdmin && <StickyHeader />}
      <main className={isAdmin ? "" : "pt-14 pb-16 md:pb-0"}>
        <Outlet />
        <Toaster />
        {!isAdmin && <AINudge />}
        {!isAdmin && <FloatingMikeChat />}
      </main>
      {!isAdmin && <MobileBottomNav />}
    </Providers>
  );
}

export default App;
