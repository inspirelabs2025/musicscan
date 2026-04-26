import { Outlet } from "react-router-dom";
import { Providers } from "./providers";
import { Toaster } from "./components/ui/sonner";
import { Navigation } from "./components/Navigation";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { ConditionalFooter } from "./components/ConditionalFooter";

function App() {
  return (
    <Providers>
      <Navigation />
      <Outlet />
      <ConditionalFooter />
      <MobileBottomNav />
      <Toaster />
    </Providers>
  );
}

export default App;
