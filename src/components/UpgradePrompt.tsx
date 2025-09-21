import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'usage_limit' | 'feature_limit' | 'general';
  currentPlan?: string;
  usageInfo?: {
    current: number;
    limit: number;
    plan: string;
  };
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  isOpen,
  onClose,
  reason = 'general',
  currentPlan = 'free',
  usageInfo
}) => {
  const getPromptContent = () => {
    switch (reason) {
      case 'usage_limit':
        return {
          icon: <Zap className="h-12 w-12 text-orange-500" />,
          title: 'AI Scan Limiet Bereikt',
          description: usageInfo 
            ? `Je hebt ${usageInfo.current} van je ${usageInfo.limit} AI scans gebruikt deze maand. Upgrade je plan voor meer scans.`
            : 'Je hebt je maandelijkse AI scan limiet bereikt. Upgrade je plan om door te gaan.',
          recommendedPlans: currentPlan === 'free' ? ['basic', 'plus'] : ['plus', 'pro']
        };
      
      case 'feature_limit':
        return {
          icon: <Star className="h-12 w-12 text-purple-500" />,
          title: 'Premium Feature',
          description: 'Deze functie is alleen beschikbaar voor betaalde abonnementen. Upgrade je plan om toegang te krijgen tot alle geavanceerde features.',
          recommendedPlans: ['basic', 'plus', 'pro']
        };
      
      default:
        return {
          icon: <Crown className="h-12 w-12 text-blue-500" />,
          title: 'Upgrade je Plan',
          description: 'Krijg toegang tot meer AI scans, geavanceerde features en priority support met een betaald abonnement.',
          recommendedPlans: ['basic', 'plus']
        };
    }
  };

  const content = getPromptContent();
  
  const planBenefits = {
    basic: {
      name: 'BASIC - Collection Builder',
      price: '€3,95/maand',
      highlights: ['50 AI scans/maand', '20 AI chat queries', 'Email support'],
      color: 'bg-blue-500',
      popular: false
    },
    plus: {
      name: 'PLUS - Music Enthusiast',
      price: '€7,95/maand',
      highlights: ['200 AI scans/maand', 'Onbeperkte AI chat', 'Marketplace toegang'],
      color: 'bg-purple-500',
      popular: true
    },
    pro: {
      name: 'PRO - Serious Collector',
      price: '€14,95/maand',
      highlights: ['Onbeperkte AI scans', 'Bulk upload (50 foto\'s)', 'API toegang'],
      color: 'bg-gold-500',
      popular: false
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {content.icon}
          </div>
          <DialogTitle className="text-2xl">{content.title}</DialogTitle>
          <DialogDescription className="text-base">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <h4 className="font-semibold text-center">Aanbevolen Abonnementen</h4>
          
          <div className="grid gap-4">
            {content.recommendedPlans.map((planSlug) => {
              const plan = planBenefits[planSlug as keyof typeof planBenefits];
              if (!plan) return null;

              return (
                <div 
                  key={planSlug}
                  className={`relative p-4 border rounded-lg transition-colors hover:border-primary ${
                    plan.popular ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-4 bg-primary">
                      Populairste keuze
                    </Badge>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-semibold">{plan.name}</h5>
                      <p className="text-2xl font-bold text-primary">{plan.price}</p>
                      <ul className="mt-2 space-y-1">
                        {plan.highlights.map((highlight, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Link to="/pricing" onClick={onClose}>
                      <Button 
                        className={plan.popular ? 'bg-primary' : ''}
                        variant={plan.popular ? 'default' : 'outline'}
                      >
                        Selecteer
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Later
          </Button>
          <Link to="/pricing" className="flex-1" onClick={onClose}>
            <Button className="w-full">
              Bekijk Alle Prijzen
            </Button>
          </Link>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Je kunt op elk moment upgraden of downgraden. Geen setup kosten.
        </p>
      </DialogContent>
    </Dialog>
  );
};