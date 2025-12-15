import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Crown, Building2, Music } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Pricing = () => {
  const { user } = useAuth();
  const { subscription, createCheckout, loading } = useSubscription();
  const { toast } = useToast();

  const plans = [
    {
      slug: 'free',
      name: 'FREE',
      subtitle: 'Music Explorer',
      price: '€0',
      period: '/maand',
      description: 'Perfect om te beginnen met je muziekcollectie',
      features: [
        '10 foto scans per maand',
        'Basis collectie management',
        'Publieke catalogus toegang',
        '5 chat queries per maand',
        'Community features'
      ],
      icon: Music,
      color: 'bg-gradient-to-br from-slate-500 to-slate-600',
      popular: false,
      current: subscription?.plan_slug === 'free'
    },
    {
      slug: 'basic',
      name: 'BASIC',
      subtitle: 'Collection Builder',
      price: '€3,95',
      period: '/maand',
      description: 'Perfect voor wie serieus wil beginnen met collectie beheer',
      features: [
        '50 foto scans per maand',
        'Volledige collectie features',
        '20 chat queries per maand',
        'Basis blog generatie',
        'Email ondersteuning'
      ],
      icon: Star,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      popular: false,
      current: subscription?.plan_slug === 'basic'
    },
    {
      slug: 'plus',
      name: 'PLUS',
      subtitle: 'Music Enthusiast',
      price: '€7,95',
      period: '/maand',
      description: 'Voor de echte muziekliefhebber met een groeiende collectie',
      features: [
        '200 foto scans per maand',
        'Onbeperkte chat',
        'Geavanceerde analytics',
        'Marketplace integratie',
        'Priority support',
        'Bulk upload (20 foto\'s)'
      ],
      icon: Crown,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      popular: true,
      current: subscription?.plan_slug === 'plus'
    },
    {
      slug: 'pro',
      name: 'PRO',
      subtitle: 'Serious Collector',
      price: '€14,95',
      period: '/maand',
      description: 'Voor de serieuze verzamelaar die alles uit zijn collectie wil halen',
      features: [
        'Onbeperkte foto scans',
        'Onbeperkte chat',
        'Bulk upload (50 foto\'s tegelijk)',
        'Geavanceerde marketplace tools',
        'White-label opties',
        'API toegang',
        'Priority support'
      ],
      icon: Crown,
      color: 'bg-gradient-to-br from-gold-500 to-gold-600',
      popular: false,
      current: subscription?.plan_slug === 'pro'
    },
    {
      slug: 'business',
      name: 'BUSINESS',
      subtitle: 'Trading House',
      price: '€29,95',
      period: '/maand',
      description: 'Voor handelaars en professionals in de muziekindustrie',
      features: [
        'Alle PRO features',
        'Multi-user accounts',
        'Geavanceerde analytics dashboard',
        'Custom integraties',
        'Dedicated account manager',
        'SLA garanties',
        'Training & onboarding'
      ],
      icon: Building2,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      popular: false,
      current: subscription?.plan_slug === 'business'
    }
  ];

  const handleSelectPlan = async (planSlug: string) => {
    if (!user) {
      toast({
        title: "Inloggen vereist",
        description: "Log eerst in om een abonnement af te sluiten.",
        variant: "destructive"
      });
      return;
    }

    if (planSlug === 'free') {
      toast({
        title: "Gratis plan",
        description: "Je gebruikt al het gratis plan!",
      });
      return;
    }

    if (subscription?.plan_slug === planSlug) {
      toast({
        title: "Huidig plan",
        description: "Dit is je huidige abonnement.",
      });
      return;
    }

    try {
      await createCheckout(planSlug);
      toast({
        title: "Doorgestuurd naar betaling",
        description: "Je wordt doorgestuurd naar Stripe om je betaling te voltooien.",
      });
    } catch (error: any) {
      toast({
        title: "Fout bij aanmaken checkout",
        description: error.message || "Er ging iets mis. Probeer het opnieuw.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Prijzen & Abonnementen - MusicScan</title>
        <meta 
          name="description" 
          content="Kies het perfecte abonnement voor jouw muziekcollectie. Van gratis starter tot professionele tools voor handelaars. AI scanning vanaf €3,95 per maand." 
        />
        <meta name="keywords" content="muziek abonnement, vinyl scanner prijzen, cd collectie management, AI muziek analyse" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Kies jouw Perfect Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Van hobbyist tot professional - we hebben het juiste abonnement voor elke muziekliefhebber
            </p>
          </div>

          {/* Current Plan Indicator */}
          {subscription && (
            <div className="text-center mb-8">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Huidig plan: {subscription.plan_name}
              </Badge>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={plan.slug}
                  className={`relative p-6 transition-all duration-300 hover:scale-105 ${
                    plan.popular ? 'ring-2 ring-primary' : ''
                  } ${plan.current ? 'ring-2 ring-green-500' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                      Populairste keuze
                    </Badge>
                  )}
                  
                  {plan.current && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                      Huidig Plan
                    </Badge>
                  )}

                  <div className="text-center mb-6">
                    <div className={`inline-flex p-3 rounded-full ${plan.color} mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full"
                    variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.slug)}
                    disabled={loading || plan.current}
                  >
                    {plan.current ? 'Huidig Plan' : plan.slug === 'free' ? 'Gratis Starten' : 'Kies Dit Plan'}
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Veelgestelde Vragen</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Kan ik mijn plan op elk moment wijzigen?</h3>
                <p className="text-muted-foreground">
                  Ja, je kunt je abonnement op elk moment upgraden of downgraden. Wijzigingen worden direct actief en pro-rata verrekend.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Wat gebeurt er met mijn data bij opzeggen?</h3>
                <p className="text-muted-foreground">
                  Je behoudt toegang tot al je gescande data. Alleen nieuwe AI scans zijn beperkt tot het gratis plan limiet.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Zijn er setup kosten?</h3>
                <p className="text-muted-foreground">
                  Nee, er zijn geen setup kosten. Je betaalt alleen het maandelijkse abonnement dat je kiest.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Krijg ik support bij mijn abonnement?</h3>
                <p className="text-muted-foreground">
                  Alle betaalde plannen krijgen email support. PRO en BUSINESS klanten krijgen priority support.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">
              Vragen over onze abonnementen?
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:support@musicscan.nl">
                Neem Contact Op
              </a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;