import { Outlet } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { Providers } from "./providers";
import { AINudge } from "./components/ai-nudge";
import { StickyHeader } from "./components/layout/StickyHeader";

function App() {
  return (
    <Providers>
      <StickyHeader />
      <main className="pt-14">
        <Outlet />
        <Toaster />
        <AINudge />
      </main>
    </Providers>
  );
}

export default App;
