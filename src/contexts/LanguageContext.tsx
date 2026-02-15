import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import translations, { type Language, type TranslationKeys } from '@/i18n/translations';

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
  if (browserLang.startsWith('nl')) return 'nl';
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'nl' || stored === 'en') return stored;
    return detectBrowserLanguage();
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  // Function-based accessor (backward compatible)
  const t = useCallback((key: string): string => {
    const value = getNestedValue(translations[language], key);
    if (value !== undefined) return String(value);
    const fallback = getNestedValue(translations.nl, key);
    if (fallback !== undefined) return String(fallback);
    return key;
  }, [language]);

  // Object-based accessor (new, type-safe)
  const tr = useMemo(() => translations[language], [language]);

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