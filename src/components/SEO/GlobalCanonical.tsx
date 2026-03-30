import { useLocation } from "react-router-dom";
import { useEffect } from "react";

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

  useEffect(() => {
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    let robotsMeta = document.querySelector('meta[name="robots"][data-global-canonical]') as HTMLMetaElement;
    if (hasSearchParam) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        robotsMeta.setAttribute('data-global-canonical', 'true');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.content = 'noindex, follow';
    } else if (robotsMeta) {
      robotsMeta.remove();
    }

    return () => {
      if (robotsMeta && robotsMeta.parentNode) robotsMeta.remove();
    };
  }, [canonicalUrl, hasSearchParam]);

  return null;
};
