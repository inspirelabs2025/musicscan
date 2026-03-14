import { ReactNode } from "react";
import { Helmet } from "react-helmet";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="flex min-h-screen bg-background">
        <aside className="hidden md:block fixed inset-y-0 left-0 w-64 border-r border-border/40 bg-background z-30 overflow-y-auto">
          <AdminSidebar />
        </aside>

        <main className="flex-1 min-w-0 md:ml-64 px-6 py-6">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>
    </>
  );
}
