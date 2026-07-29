import { useLanguage } from '@/contexts/LanguageContext';
import { LOCALES } from '@/config/site';
import { cn } from '@/lib/utils';

const FLAGS: Record<string, { flag: string; label: string }> = {
  nl: { flag: '🇳🇱', label: 'Nederlands' },
  en: { flag: '🇬🇧', label: 'English' },
  de: { flag: '🇩🇪', label: 'Deutsch' },
  fr: { flag: '🇫🇷', label: 'Français' },
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {LOCALES.map((code) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={cn(
            "text-sm px-2 py-1 rounded transition-colors",
            language === code
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={FLAGS[code].label}
        >
          {FLAGS[code].flag}
        </button>
      ))}
    </div>
  );
}
