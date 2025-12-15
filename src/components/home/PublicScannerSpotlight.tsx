import { Link } from 'react-router-dom';
import { Camera, Disc3, DollarSign, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const features = [
  { icon: Disc3, label: 'Vinyl Analyse' },
  { icon: Camera, label: 'CD Herkenning' },
  { icon: DollarSign, label: 'Prijscheck' },
  { icon: Globe, label: 'Gratis & Publiek' },
];

export const PublicScannerSpotlight = () => {
  return (
    <section className="py-10 md:py-14 bg-gradient-to-br from-red-50/40 via-green-50/30 to-muted/50 dark:from-red-950/15 dark:via-green-950/10 dark:to-muted/50">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-br from-card to-muted/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-red-500/20">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Icon - Larger and more prominent */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-green-600 rounded-3xl blur-xl opacity-30 animate-pulse" />
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-red-600 to-green-600 flex items-center justify-center shadow-2xl">
                <Camera className="w-12 h-12 md:w-14 md:h-14 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Ontdek de waarde van je LP of CD
              </h2>
              <p className="text-base text-muted-foreground mb-5 max-w-lg">
                Scan je platen en CD's met onze gratis scanner
              </p>
              
              {/* Feature badges - Larger */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {features.map((feature) => (
                  <Badge 
                    key={feature.label} 
                    variant="secondary" 
                    className="flex items-center gap-2 px-3 py-1.5 text-sm"
                  >
                    <feature.icon className="w-4 h-4" />
                    <span>{feature.label}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* CTA - Larger button */}
            <div className="flex-shrink-0">
              <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-red-600 to-green-600 hover:opacity-90 transition-all hover:scale-105 shadow-lg">
                <Link to="/scanner" className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Start Scannen
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
