import { Outlet } from "react-router-dom";
import { Providers } from "./providers";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <Providers>
      <Outlet />
      <Toaster />
    </Providers>
  );
}

export default App;
