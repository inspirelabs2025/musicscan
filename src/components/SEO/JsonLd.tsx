import { useEffect, useRef } from 'react';

/**
 * Lightweight JSON-LD structured data component.
 * Replaces react-helmet for schema.org data injection.
 * Manages script tag lifecycle via useEffect (no external library).
 */
export const JsonLd = ({ data }: { data: Record<string, unknown> }) => {
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [JSON.stringify(data)]);

  return null;
};
