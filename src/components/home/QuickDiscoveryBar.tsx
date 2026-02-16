import { Link } from 'react-router-dom';
import { Dice3, Search, Camera, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export const QuickDiscoveryBar = () => {
  const { user } = useAuth();
  const { tr } = useLanguage();
  const h = tr.homeUI;

  const actions = [
    { icon: Dice3, label: h.recordRoulette, href: '/dashboard', gradient: 'from-red-600 to-green-600' },
    { icon: Search, label: h.quickPriceCheck, href: '/quick-price-check', gradient: 'from-red-600 to-red-800' },
    { icon: Camera, label: h.scanNow, href: user ? '/scanner' : '/auth', gradient: 'from-green-600 to-green-800' },
    { icon: MessageCircle, label: h.askQuestion, href: user ? '/collection-chat' : '/auth', gradient: 'from-red-700 to-green-700' },
  ];

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={action.label} asChild variant="outline" className="flex-shrink-0 group relative overflow-hidden hover:border-primary transition-all h-8 px-2.5 text-xs">
                <Link to={action.href} className="flex items-center gap-1.5">
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10 whitespace-nowrap">{action.label}</span>
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
