import { Link } from 'react-router-dom';
import { Podcast, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function MagicMikePodcastSection() {
  return (
    <section className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-5 flex flex-col justify-between h-full">
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
