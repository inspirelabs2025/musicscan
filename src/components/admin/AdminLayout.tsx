import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
      <main className="flex-1 overflow-auto w-full">
        <div className="w-full max-w-none">
          {children}
        </div>
      </main>
      </div>
    </SidebarProvider>
  );
}
