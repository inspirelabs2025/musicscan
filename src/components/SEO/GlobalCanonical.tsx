import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";

/**
 * Global canonical URL component that sets a self-referencing canonical tag
 * on every page. Strips trailing slashes for consistency.
 * Also adds noindex for search parameter URLs to prevent thin content indexing.
 */
export const GlobalCanonical = () => {
  const { pathname, search } = useLocation();
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const canonicalUrl = `https://www.musicscan.app${cleanPath}`;
  const hasSearchParam = search.includes('search=');

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
      {hasSearchParam && <meta name="robots" content="noindex, follow" />}
    </Helmet>
  );
};
