import { ReactNode } from "react";
import { PanelLeftOpen } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-auto w-full">
          <div className="h-10 flex items-center border-b px-2 shrink-0">
            <SidebarTrigger className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <PanelLeftOpen className="h-5 w-5" />
              <span className="text-sm">Menu</span>
            </SidebarTrigger>
          </div>
          <main className="flex-1 w-full max-w-none">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
