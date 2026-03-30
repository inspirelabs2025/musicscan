import { useLocation } from "react-router-dom";
import { useSEO } from '@/hooks/useSEO';
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { tr } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
<div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 text-foreground">404</h1>
          <p className="text-xl text-muted-foreground mb-6">{tr.notFound.title}</p>
          <p className="text-muted-foreground mb-8">{tr.notFound.description}</p>
          <a href="/" className="text-primary hover:text-primary/80 underline font-medium">
            {tr.notFound.goHome}
          </a>
        </div>
      </div>
    </>
  );
};

export default NotFound;
