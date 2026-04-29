import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ProjectNudge from "./ProjectNudge";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (user && !user.user_metadata?.has_onboarded) {
      if (location.pathname !== "/onboarding") {
        navigate("/onboarding");
      }
    } else if (!user && location.pathname === "/onboarding") {
      // If user logs out during onboarding, redirect to home
      navigate("/");
    }
  }, [user, navigate, location.pathname]);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        {isDesktop ? (
          <Sidebar />
        ) : (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar onClose={closeSidebar} />
            </SheetContent>
          </Sheet>
        )}
        <div className="flex flex-1 flex-col">
          <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
          <ProjectNudge />
        </div>
      </div>
    </AuthGuard>
  );
};

export default Layout;
