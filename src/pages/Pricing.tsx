import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Star, Crown, Building2, Music, Coins, Loader2, Sparkles, Zap, MessageSquare, Upload } from 'lucide-react';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { useQueryClient } from '@tanstack/react-query';

const CREDIT_PACKAGES = [
  { credits: 10, price: '€2,95', priceId: 'price_1T13ukIWa9kBN7qAxdQu2r1P', perCredit: '€0,30' },
  { credits: 50, price: '€9,95', priceId: 'price_1T13vOIWa9kBN7qA6P75zHI5', perCredit: '€0,20' },
  { credits: 100, price: '€14,95', priceId: 'price_1T13vbIWa9kBN7qAcBAIDL43', perCredit: '€0,15', popular: true },
  { credits: 250, price: '€29,95', priceId: 'price_1T13w0IWa9kBN7qA6CeHdAKU', perCredit: '€0,12' },
  { credits: 500, price: '€49,95', priceId: 'price_1T13wJIWa9kBN7qAXmNQnrjl', perCredit: '€0,10' },
  { credits: 1000, price: '€79,95', priceId: 'price_1T13wYIWa9kBN7qAE41S1xZg', perCredit: '€0,08', best: true },
];

const Pricing = () => {
  const { user } = useAuth();
  const { subscription, createCheckout, loading } = useSubscriptionContext();
  const { data: userCredits } = useCredits();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [buyingPriceId, setBuyingPriceId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { aiScansUsed, aiChatUsed, bulkUploadsUsed } = useUsageTracking();

  // Handle return from Stripe checkout
  useEffect(() => {
    const creditsPurchased = searchParams.get('credits_purchased');
    const sessionId = searchParams.get('session_id');
    if (creditsPurchased && user) {
      toast({
        title: `${creditsPurchased} credits toegevoegd! 🎉`,
        description: 'Je credits zijn beschikbaar voor gebruik.',
      });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      // Clean URL
      window.history.replaceState({}, '', '/pricing');
    }
  }, [searchParams, user]);

  const handleBuyCredits = async (priceId: string) => {
    if (!user) {
      toast({ title: 'Inloggen vereist', description: 'Log eerst in om credits te kopen.', variant: 'destructive' });
      return;
    }
    setBuyingPriceId(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-credit-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({ title: 'Fout', description: error.message || 'Probeer het opnieuw.', variant: 'destructive' });
    } finally {
      setBuyingPriceId(null);
    }
  };

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
      toast({ title: "Inloggen vereist", description: "Log eerst in om een abonnement af te sluiten.", variant: "destructive" });
      return;
    }
    if (planSlug === 'free') {
      toast({ title: "Gratis plan", description: "Je gebruikt al het gratis plan!" });
      return;
    }
    if (subscription?.plan_slug === planSlug) {
      toast({ title: "Huidig plan", description: "Dit is je huidige abonnement." });
      return;
    }
    try {
      await createCheckout(planSlug);
      toast({ title: "Doorgestuurd naar betaling", description: "Je wordt doorgestuurd naar Stripe." });
    } catch (error: any) {
      toast({ title: "Fout bij aanmaken checkout", description: error.message || "Probeer het opnieuw.", variant: "destructive" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Prijzen & Abonnementen - MusicScan</title>
        <meta name="description" content="Kies het perfecte abonnement of koop losse scan credits. Smart scanning vanaf €2,95." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Kies jouw Perfect Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Van hobbyist tot professional - kies een abonnement of koop losse credits
            </p>
          </div>

          {/* Account Status Card - visible for logged in users */}
          {user && (
            <Card className="max-w-3xl mx-auto mb-12 border-primary/20 bg-card/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Current Plan */}
                  <div className="text-center md:text-left space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Huidig Plan</p>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Crown className="h-5 w-5 text-primary" />
                      <span className="text-xl font-bold">
                        {subscription?.plan_name || 'FREE - Music Explorer'}
                      </span>
                    </div>
                    {subscription?.subscription_end && (
                      <p className="text-xs text-muted-foreground">
                        Verlengt {new Date(subscription.subscription_end).toLocaleDateString('nl-NL')}
                      </p>
                    )}
                  </div>

                  {/* Credits Balance */}
                  <div className="text-center space-y-2 border-x-0 md:border-x border-border px-4">
                    <p className="text-sm text-muted-foreground font-medium">Credits Saldo</p>
                    <div className="flex items-center gap-2 justify-center">
                      <Coins className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">{userCredits?.balance ?? 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">beschikbaar</p>
                  </div>

                  {/* Usage This Month */}
                  <div className="text-center md:text-right space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Gebruik deze maand</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-center md:justify-end gap-2 text-sm">
                        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{aiScansUsed} scans</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-end gap-2 text-sm">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{aiChatUsed} chats</span>
                      </div>
                      {bulkUploadsUsed > 0 && (
                        <div className="flex items-center justify-center md:justify-end gap-2 text-sm">
                          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{bulkUploadsUsed} bulk uploads</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="credits" className="max-w-7xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-10">
              <TabsTrigger value="credits" className="text-base">
                <Coins className="h-4 w-4 mr-2" /> Losse Credits
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="text-base">
                <Crown className="h-4 w-4 mr-2" /> Abonnementen
              </TabsTrigger>
            </TabsList>

            {/* Credits Tab */}
            <TabsContent value="credits">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Koop Scan Credits</h2>
                <p className="text-muted-foreground">Elke scan kost 1 credit. Hoe meer je koopt, hoe goedkoper per credit.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {CREDIT_PACKAGES.map((pkg) => (
                  <Card
                    key={pkg.credits}
                    className={`relative p-6 transition-all duration-300 hover:scale-105 ${
                      pkg.popular ? 'ring-2 ring-primary' : ''
                    } ${pkg.best ? 'ring-2 ring-primary' : ''}`}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        Populairste
                      </Badge>
                    )}
                    {pkg.best && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" /> Beste Deal
                      </Badge>
                    )}

                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                        <span className="text-2xl font-bold text-primary">{pkg.credits}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{pkg.credits} Credits</h3>
                        <p className="text-sm text-muted-foreground">{pkg.perCredit} per credit</p>
                      </div>
                      <div>
                        <span className="text-3xl font-bold">{pkg.price}</span>
                      </div>
                      <Button
                        className="w-full"
                        variant={pkg.popular || pkg.best ? 'default' : 'outline'}
                        onClick={() => handleBuyCredits(pkg.priceId)}
                        disabled={buyingPriceId === pkg.priceId}
                      >
                        {buyingPriceId === pkg.priceId ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Even geduld...</>
                        ) : (
                          'Kopen'
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-8 text-sm text-muted-foreground">
                <p>Credits verlopen niet en zijn direct beschikbaar na betaling.</p>
              </div>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions">
              {subscription && (
                <div className="text-center mb-8">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    Huidig plan: {subscription.plan_name}
                  </Badge>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Populairste keuze</Badge>
                      )}
                      {plan.current && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500">Huidig Plan</Badge>
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
                        variant={plan.current ? 'outline' : plan.popular ? 'default' : 'outline'}
                        onClick={() => handleSelectPlan(plan.slug)}
                        disabled={loading || plan.current}
                      >
                        {plan.current ? 'Huidig Plan' : plan.slug === 'free' ? 'Gratis Starten' : 'Kies Dit Plan'}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* FAQ */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Veelgestelde Vragen</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Wat is het verschil tussen credits en een abonnement?</h3>
                <p className="text-muted-foreground">
                  Credits zijn losse scans die je eenmalig koopt en niet verlopen. Een abonnement geeft je maandelijks een vast aantal scans plus extra features.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Kan ik credits én een abonnement hebben?</h3>
                <p className="text-muted-foreground">
                  Ja! Credits en abonnement scans werken naast elkaar. Eerst worden je abonnement scans gebruikt, daarna je losse credits.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Verlopen mijn credits?</h3>
                <p className="text-muted-foreground">
                  Nee, gekochte credits verlopen nooit. Je kunt ze op elk moment gebruiken.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Kan ik mijn abonnement wijzigen?</h3>
                <p className="text-muted-foreground">
                  Ja, je kunt je abonnement op elk moment upgraden of downgraden. Wijzigingen worden pro-rata verrekend.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">Vragen over onze prijzen?</p>
            <Button variant="outline" asChild>
              <a href="mailto:support@musicscan.nl">Neem Contact Op</a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
