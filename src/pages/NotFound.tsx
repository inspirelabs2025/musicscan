import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>404 - Pagina niet gevonden | MusicScan</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="De pagina die je zoekt bestaat niet of is verplaatst." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 text-foreground">404</h1>
          <p className="text-xl text-muted-foreground mb-6">Pagina niet gevonden</p>
          <p className="text-muted-foreground mb-8">De pagina die je zoekt bestaat niet of is verplaatst.</p>
          <a href="/" className="text-primary hover:text-primary/80 underline font-medium">
            Terug naar home
          </a>
        </div>
      </div>
    </>
  );
};

export default NotFound;
