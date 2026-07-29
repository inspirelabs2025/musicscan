import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SITE_URL, canonicalPathFor, isIndexablePath, matchCorePath, normalizePath } from "@/config/site";

/**
 * Global canonical + robots fallback for every route.
 *
 * Self-referencing canonical, noindex for search-parameter URLs and for
 * everything outside the indexable "scan + value" set, and cleanup of stale
 * hreflang tags when navigating from a core page to a non-core page.
 */
export const GlobalCanonical = () => {
  const { pathname, search } = useLocation();
  const cleanPath = canonicalPathFor(normalizePath(pathname));
  const canonicalUrl = cleanPath === '/' ? `${SITE_URL}/` : `${SITE_URL}${cleanPath}`;
  const hasSearchParam = search.includes('search=');
  const isCore = matchCorePath(cleanPath) !== null;
  const shouldNoindex = hasSearchParam || !isIndexablePath(normalizePath(pathname));

  useEffect(() => {
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Only core pages carry hreflang; drop leftovers from a previous route.
    if (!isCore) {
      document
        .querySelectorAll('link[rel="alternate"][hreflang]')
        .forEach((el) => el.remove());
    }

    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = shouldNoindex ? 'noindex, follow' : 'index, follow';
  }, [canonicalUrl, shouldNoindex, isCore]);

  return null;
};
