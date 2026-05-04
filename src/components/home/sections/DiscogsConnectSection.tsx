import { Link } from 'react-router-dom';
import { Disc3, ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function DiscogsConnectSection() {
  const { language } = useLanguage();

  const labels = {
    badge: language === 'nl' ? 'Integratie' : 'Integration',
    title: language === 'nl' ? 'Verbind je Discogs account' : 'Connect your Discogs account',
    subtitle: language === 'nl'
      ? 'Bekijk je volledige collectie, wantlist en marketplace listings direct in MusicScan.'
      : 'View your complete collection, wantlist and marketplace listings directly in MusicScan.',
    collection: language === 'nl' ? 'Collectie' : 'Collection',
    wantlist: 'Wantlist',
    marketplace: 'Marketplace',
    cta: language === 'nl' ? 'Koppel met Discogs' : 'Connect with Discogs',
  };

  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/mijn-discogs" className="block group">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border border-primary/20 p-6 md:p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

            <div className="relative flex items-start gap-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Disc3 className="w-7 h-7 text-primary-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-2">
                  {labels.badge}
                </span>
                <h3 className="font-bold text-foreground text-xl mb-1.5 group-hover:text-primary transition-colors">
                  {labels.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {labels.subtitle}
                </p>

                <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Disc3 className="w-3.5 h-3.5 text-primary" /> {labels.collection}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-primary" /> {labels.wantlist}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-primary" /> {labels.marketplace}
                  </span>
                </div>

                <Button size="sm" className="gap-2 pointer-events-none">
                  {labels.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
