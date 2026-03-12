import { Outlet } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { Providers } from "./providers";
import { AINudge } from "./components/ai-nudge";
import { FloatingMikeChat } from "./components/FloatingMikeChat";
import { ChatNudge } from "./components/chat-nudge";
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
        <SonnerToaster />
        <AINudge />
        <ChatNudge />
        <FloatingMikeChat />
      </main>
      <MobileBottomNav />
    </Providers>
  );
}

export default App;
