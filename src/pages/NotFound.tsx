import { useLocation } from "react-router-dom";
import { useSEO } from '@/hooks/useSEO';
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { tr } = useLanguage();

  useSEO({
    title: `${tr.notFound.title} | MusicScan`,
    description: tr.notFound.description,
    noindex: true,
  });

  // Dedicated robots tag (same pattern as AdminLayout): GlobalCanonical rewrites
  // the shared robots tag on every route change, so a separate tag keeps
  // "noindex, nofollow" in place for as long as this page is shown.
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"][data-not-found]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      meta.setAttribute('data-not-found', 'true');
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
    return () => { if (meta.parentNode) meta.remove(); };
  }, []);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold mb-4 text-foreground">404</p>
        <h1 className="text-2xl font-semibold mb-3 text-foreground">{tr.notFound.title}</h1>
        <p className="text-muted-foreground mb-8">{tr.notFound.description}</p>
        <a href="/" className="text-primary hover:text-primary/80 underline font-medium">
          {tr.notFound.goHome}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
