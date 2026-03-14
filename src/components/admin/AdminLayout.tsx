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

      <div className="flex min-h-screen w-full overflow-hidden bg-background">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-20 flex h-12 items-center border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <SidebarTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <PanelLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Menu</span>
            </SidebarTrigger>
            <div className="mx-3 h-4 w-px bg-border/70" />
            <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Admin Workspace
            </span>
          </div>

          <main className="min-w-0 flex-1 overflow-x-hidden bg-background">
            <div className="mx-auto w-full max-w-[1500px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
