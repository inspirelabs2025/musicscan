import { Link } from 'react-router-dom';
import { Camera, Disc3, DollarSign, Globe, Sparkles } from 'lucide-react';
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
    <section className="py-10 md:py-14 bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-primary/30 ring-1 ring-white/5">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Icon - Larger and more prominent */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-3xl blur-xl opacity-40 animate-pulse" />
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl">
                <Camera className="w-12 h-12 md:w-14 md:h-14 text-primary-foreground" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-accent-foreground" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full text-xs font-medium text-primary mb-3">
                <Sparkles className="w-3 h-3" />
                AI-Powered Scanner
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Scan je Platen & CD's
              </h2>
              <p className="text-base text-slate-300 mb-5 max-w-lg">
                Identificeer en waardeer je hele collectie met onze gratis AI-scanner. Direct resultaat!
              </p>
              
              {/* Feature badges - Larger */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {features.map((feature) => (
                  <Badge 
                    key={feature.label} 
                    variant="secondary" 
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 text-slate-200 border-white/10 hover:bg-white/20"
                  >
                    <feature.icon className="w-4 h-4" />
                    <span>{feature.label}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* CTA - Larger button */}
            <div className="flex-shrink-0">
              <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all hover:scale-105 shadow-lg">
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
