import { Link } from 'react-router-dom';
import { Dice3, Search, Camera, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const QuickDiscoveryBar = () => {
  const { user } = useAuth();

  const actions = [
    {
      icon: Dice3,
      label: 'Plaat Roulette',
      href: '/dashboard',
      gradient: 'from-vinyl-purple to-accent'
    },
    {
      icon: Search,
      label: 'Quick Price Check',
      href: '/quick-price-check',
      gradient: 'from-vinyl-gold to-amber-500'
    },
    {
      icon: Camera,
      label: 'Scan Nu',
      href: user ? '/scanner' : '/auth',
      gradient: 'from-primary to-vinyl-purple'
    },
    {
      icon: MessageCircle,
      label: 'Stel een Vraag',
      href: user ? '/collection-chat' : '/auth',
      gradient: 'from-accent to-primary'
    }
  ];

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                asChild
                variant="outline"
                className="flex-shrink-0 group relative overflow-hidden hover:border-primary transition-all"
              >
                <Link to={action.href} className="flex items-center gap-2">
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <Icon className="w-4 h-4 relative z-10" />
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
