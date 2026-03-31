import { Link } from 'react-router-dom';
import { ArrowRight, Headphones, Radio } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function MagicMikePodcastSection() {
  const { tr, language } = useLanguage();
  const h = tr.homeUI;

  if (language === 'en') return null;

  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/podcasts" className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/20 p-6 md:p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
              
              <div className="relative flex items-start gap-5">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <Headphones className="w-8 h-8 text-primary-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Radio className="w-3 h-3" />
                      Podcast
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground text-xl mb-2 group-hover:text-primary transition-colors">
                    {h.podcastHeroTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {h.podcastHeroDesc}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                    {h.listenEpisodes}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
