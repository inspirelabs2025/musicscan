import { ReactNode } from "react";
import { Helmet } from "react-helmet";
import { PanelLeft } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
        <AdminSidebar />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'auto', maxWidth: '100%' }}>
          {/* Slim top bar with menu trigger */}
          <div className="h-12 flex items-center border-b border-border/60 px-4 shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <PanelLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Menu</span>
            </SidebarTrigger>
          </div>
          <main style={{ flex: 1, width: '100%', minWidth: 0, overflowX: 'auto', overflowY: 'visible' }}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
