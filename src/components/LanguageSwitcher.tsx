import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        onClick={() => setLanguage('nl')}
        className={cn(
          "text-sm px-2 py-1 rounded transition-colors",
          language === 'nl'
            ? "bg-accent text-accent-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Nederlands"
      >
        🇳🇱
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          "text-sm px-2 py-1 rounded transition-colors",
          language === 'en'
            ? "bg-accent text-accent-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="English"
      >
        🇬🇧
      </button>
    </div>
  );
}
