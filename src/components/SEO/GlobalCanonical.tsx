import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SITE_URL, isIndexablePath, normalizePath } from "@/config/site";

/**
 * Global canonical URL component that sets a self-referencing canonical tag
 * on every page. Strips trailing slashes for consistency.
 * Adds noindex for search-parameter URLs and for everything outside the
 * indexable "scan + value" set.
 */
export const GlobalCanonical = () => {
  const { pathname, search } = useLocation();
  const cleanPath = normalizePath(pathname);
  const canonicalUrl = cleanPath === '/' ? `${SITE_URL}/` : `${SITE_URL}${cleanPath}`;
  const hasSearchParam = search.includes('search=');
  const shouldNoindex = hasSearchParam || !isIndexablePath(cleanPath);

  useEffect(() => {
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    let robotsMeta = document.querySelector('meta[name="robots"][data-global-canonical]') as HTMLMetaElement;
    if (shouldNoindex) {
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
  }, [canonicalUrl, shouldNoindex]);

  return null;
};
