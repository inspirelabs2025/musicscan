import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'nl' as const, flag: '🇳🇱', label: 'Nederlands' },
  { code: 'en' as const, flag: '🇬🇧', label: 'English' },
];

export function LanguageBar() {
  const { language, setLanguage } = useLanguage();

  return (
    <section className="bg-muted/50 border-b border-border">
      <div className="container mx-auto px-4 py-1.5 flex items-center justify-center gap-2">
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <div className="flex items-center gap-2">
          {languages.map(({ code, flag, label }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                language === code
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background text-muted-foreground hover:text-foreground hover:bg-accent border border-border"
              )}
            >
              <span className="text-base">{flag}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
