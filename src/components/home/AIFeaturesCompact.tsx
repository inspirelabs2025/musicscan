import { Link } from 'react-router-dom';
import { Camera, Search, MessageCircle, Brain, TrendingUp, Store } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AIFeaturesCompact = () => {
  const features = [
    {
      icon: Camera,
      title: 'Scan Collectie',
      description: 'Smart herkenning',
      href: '/scanner',
      badge: 'Gratis',
      gradient: 'from-red-600 to-red-800'
    },
    {
      icon: Search,
      title: 'Prijs Check',
      description: 'Actuele waardes',
      href: '/quick-price-check',
      badge: '€0,99/scan',
      gradient: 'from-vinyl-gold to-amber-500'
    },
    {
      icon: MessageCircle,
      title: 'Collectie Chat',
      description: 'Vraag alles',
      href: '/collection-chat',
      badge: 'Premium',
      gradient: 'from-green-600 to-green-800'
    },
    {
      icon: Brain,
      title: 'Muziek Analyse',
      description: 'Inzichten',
      href: '/ai-analysis',
      badge: 'Nieuw',
      gradient: 'from-red-700 to-green-700'
    },
    {
      icon: TrendingUp,
      title: 'Trends',
      description: 'Ontdek meer',
      href: '/dashboard',
      badge: 'Populair',
      gradient: 'from-green-700 to-red-600'
    },
    {
      icon: Store,
      title: 'Open Shop',
      description: 'Verkoop vinyl',
      href: '/my-shop',
      badge: 'Beta',
      gradient: 'from-red-600 to-green-600'
    }
  ];

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">🤖 Ontdek Onze Slimme Tools</h2>
          <p className="text-muted-foreground">
            Slimme tools om meer uit je collectie te halen
          </p>
        </div>

        {/* Horizontal scroll container */}
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link 
                  key={feature.title} 
                  to={feature.href}
                  className="flex-shrink-0 w-48 snap-start"
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-all hover:scale-105 group relative overflow-hidden border-2 hover:border-red-500 dark:hover:border-red-400">
                    {/* Gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    
                    <div className="relative z-10 space-y-3 text-center">
                      {/* Icon */}
                      <div className="flex justify-center">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm">{feature.title}</h3>
                      
                      {/* Description */}
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                      
                      {/* Badge */}
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Scroll hint */}
          <div className="text-center mt-4 md:hidden">
            <p className="text-xs text-muted-foreground">← Swipe voor meer →</p>
          </div>
        </div>
      </div>
    </section>
  );
};
