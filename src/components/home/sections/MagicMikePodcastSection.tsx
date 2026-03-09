import { Link } from 'react-router-dom';
import { Music2, Podcast, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const echoAvatar = '/magic-mike-logo.png';

export function MagicMikePodcastSection() {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="overflow-hidden rounded-xl border-border/50 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={echoAvatar}
                  alt="Magic Mike muziekexpert"
                  loading="lazy"
                  decoding="async"
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full border-2 border-primary/30 shadow-lg object-cover"
                />
                <div>
                  <h3 className="font-bold text-foreground text-lg">Magic Mike</h3>
                  <p className="text-xs text-muted-foreground">Jouw persoonlijke muziekexpert</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 italic">
                "Vraag me alles over albums, artiesten, muziekgeschiedenis en meer. Ik ken elk verhaal achter de plaat."
              </p>
              <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Link to="/echo">
                  <Music2 className="w-4 h-4 mr-2" />
                  Chat met Magic Mike
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-xl border-border/50 shadow-md">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Podcast className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-foreground text-lg">De Plaat & Het Verhaal</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Luister naar de verhalen achter legendarische albums. Elke aflevering duikt diep in de muziekgeschiedenis.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/podcasts">
                  Luister <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
