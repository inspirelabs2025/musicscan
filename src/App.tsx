import { Outlet } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { Providers } from "./providers";
import { AINudge } from "./components/ai-nudge";

function App() {
  return (
    <Providers>
      <main>
        <Outlet />
        <Toaster />
        <AINudge />
      </main>
    </Providers>
  );
}

export default App;
