import { Link } from 'react-router-dom';
import { Music2, Podcast, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const echoAvatar = '/magic-mike-logo.png';

export function MagicMikePodcastSection() {
  return (
    <section className="py-10 md:py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-xl bg-card border border-border p-4 md:p-6 shadow-md">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <img
                src={echoAvatar}
                alt="Magic Mike muziekexpert"
                loading="lazy"
                decoding="async"
                width={48}
                height={48}
                className="w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-primary/30 shadow-lg object-cover"
              />
              <div>
                <h3 className="font-bold text-foreground text-sm md:text-lg">Magic Mike</h3>
                <p className="text-[11px] md:text-xs text-muted-foreground">Jouw persoonlijke muziekexpert</p>
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 italic">
              "Vraag me alles over albums, artiesten, muziekgeschiedenis en meer."
            </p>
            <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 min-h-[44px]">
              <Link to="/echo">
                <Music2 className="w-4 h-4 mr-2" />
                Chat met Magic Mike
              </Link>
            </Button>
          </div>

          <div className="rounded-xl bg-card border border-border p-4 md:p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Podcast className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-sm md:text-lg">De Plaat & Het Verhaal</h3>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                Luister naar de verhalen achter legendarische albums. Elke aflevering duikt diep in de muziekgeschiedenis.
              </p>
            </div>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link to="/podcasts">
                Luister <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
