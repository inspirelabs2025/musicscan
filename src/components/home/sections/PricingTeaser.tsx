import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, Crown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const PRICING_URL = 'https://musicscan.app/pricing';

const tiers = [
  { credits: 10, price: '€2,95', perCredit: '€0,30', icon: Sparkles, badge: null },
  { credits: 100, price: '€14,95', perCredit: '€0,15', icon: Zap, badge: 'Populair' },
  { credits: 1000, price: '€79,95', perCredit: '€0,08', icon: Crown, badge: 'Beste deal' },
];

export function PricingTeaser() {
  const { language } = useLanguage();

  const labels = {
    title: language === 'nl' ? 'Eenvoudige prijzen' : 'Simple pricing',
    subtitle: language === 'nl'
      ? '1 credit = 1 scan. Hoe meer je koopt, hoe goedkoper. Credits verlopen nooit.'
      : '1 credit = 1 scan. The more you buy, the cheaper. Credits never expire.',
    credits: language === 'nl' ? 'credits' : 'credits',
    perCredit: language === 'nl' ? 'per credit' : 'per credit',
    cta: language === 'nl' ? 'Bekijk alle prijzen & abonnementen' : 'View all pricing & plans',
  };

  return (
    <section className="py-10 bg-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">{labels.title}</h2>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {tiers.map(({ credits, price, perCredit, icon: Icon, badge }) => (
            <a
              key={credits}
              href={PRICING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all group"
            >
              {badge && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {credits} {labels.credits}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">{price}</div>
              <div className="text-xs text-muted-foreground">{perCredit} {labels.perCredit}</div>
            </a>
          ))}
        </div>

        <div className="flex justify-center">
          <Button asChild size="lg" className="gap-2">
            <a href={PRICING_URL} target="_blank" rel="noopener noreferrer">
              {labels.cta}
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
