import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";

/**
 * Global canonical URL component that sets a self-referencing canonical tag
 * on every page. Strips trailing slashes for consistency.
 * Pages using useSEO() or their own <link rel="canonical"> will override this.
 */
export const GlobalCanonical = () => {
  const { pathname } = useLocation();
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const canonicalUrl = `https://www.musicscan.app${cleanPath}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
};
