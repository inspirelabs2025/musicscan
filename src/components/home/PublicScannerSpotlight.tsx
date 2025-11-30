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
    <section className="py-6 md:py-8 bg-gradient-to-r from-primary/5 via-background to-accent/5">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Camera className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              Scan je Platen & CD's
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Identificeer en waardeer je collectie met onze AI-scanner
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {features.map((feature) => (
                <Badge 
                  key={feature.label} 
                  variant="secondary" 
                  className="flex items-center gap-1.5 px-2.5 py-1"
                >
                  <feature.icon className="w-3.5 h-3.5" />
                  <span className="text-xs">{feature.label}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
              <Link to="/scanner">
                Start Scannen
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
