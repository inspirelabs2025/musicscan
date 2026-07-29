import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import translations, { type Language } from '@/i18n/translations';
import { LOCALES, DEFAULT_LOCALE, localeFromPath, matchCorePath } from '@/config/site';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tr: Record<string, any>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'musicscan-language';

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function detectBrowserLanguage(): Language {
  const browserLang = navigator.language?.toLowerCase() || '';
  const match = LOCALES.find((l) => browserLang.startsWith(l));
  return (match as Language) ?? 'en';
}

/**
 * Full UI translations exist for nl + en. German and French are used for the
 * core scan/value pages; everything else falls back to English copy.
 */
function bundleFor(language: Language): Record<string, any> {
  const dict = (translations as Record<string, any>)[language];
  return dict ?? (translations as Record<string, any>).en;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Language;
    return detectBrowserLanguage();
  });

  // A localized core URL (/en/..., /de/..., /fr/...) always wins over the stored preference.
  useEffect(() => {
    const core = matchCorePath(location.pathname);
    const urlLocale = core ? core.locale : localeFromPath(location.pathname);
    if (core || urlLocale !== DEFAULT_LOCALE) {
      setLanguageState((prev) => (prev === urlLocale ? prev : (urlLocale as Language)));
    }
  }, [location.pathname]);

  // Keep <html lang> in sync with the active language (index.html ships nl).
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  // Function-based accessor (backward compatible)
  const t = useCallback((key: string): string => {
    const value = getNestedValue(bundleFor(language), key);
    if (value !== undefined) return String(value);
    const fallback = getNestedValue(translations.nl, key);
    if (fallback !== undefined) return String(fallback);
    return key;
  }, [language]);

  // Object-based accessor (new, type-safe)
  const tr = useMemo(() => bundleFor(language), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
