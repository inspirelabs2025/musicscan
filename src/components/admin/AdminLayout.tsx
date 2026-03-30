import { ReactNode, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"][data-admin]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      meta.setAttribute('data-admin', 'true');
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
    return () => { if (meta.parentNode) meta.remove(); };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:block fixed inset-y-0 left-0 w-64 border-r border-border/40 bg-background z-30 overflow-y-auto">
        <AdminSidebar />
      </aside>

      <main className="flex-1 min-w-0 md:ml-64 px-6 py-6">
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
}
