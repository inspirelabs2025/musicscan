import React, { useState, useEffect } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { useIsIOS } from '@/hooks/useIsIOS';
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
import { openExternalPayment } from '@/utils/externalPayment';
import { Progress } from '@/components/ui/progress';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';

const Pricing = () => {
  const { user } = useAuth();
  const { subscription, createCheckout, loading } = useSubscriptionContext();
  const { data: userCredits } = useCredits();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [buyingPriceId, setBuyingPriceId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { aiScansUsed, aiChatUsed, bulkUploadsUsed } = useUsageTracking();
  const { tr } = useLanguage();
  const p = tr.pricing;
  const isIOS = useIsIOS();

  const { data: creditPackages = [] } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000,
  });

  // Always refetch credits when landing on /pricing (e.g. returning from Stripe in another tab)
  useEffect(() => {
    if (!user) return;
    queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    const onFocus = () => queryClient.invalidateQueries({ queryKey: ['user-credits'] });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, queryClient]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const creditsPurchased = searchParams.get('credits_purchased');
    if (!user) return;

    const finalize = async (credits: number) => {
      toast({
        title: `${credits} ${p.creditsAdded}`,
        description: p.creditsAvailableForUse,
      });
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      window.history.replaceState({}, '', '/pricing');
    };

    if (sessionId) {
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke('verify-credit-purchase', {
            body: { sessionId },
          });
          if (error) throw error;
          if (data?.success) {
            await finalize(data.credits ?? Number(creditsPurchased) ?? 0);
          }
        } catch (e: any) {
          toast({ title: tr.common.error, description: e.message || p.tryAgain, variant: 'destructive' });
        }
      })();
    } else if (creditsPurchased) {
      finalize(Number(creditsPurchased));
    } else if (searchParams.get('canceled') === 'true') {
      toast({ title: 'Aankoop geannuleerd', variant: 'destructive' });
      window.history.replaceState({}, '', '/pricing');
    }
  }, [searchParams, user]);

  const handleBuyCredits = async (priceId: string) => {
    if (!user) {
      toast({ title: p.loginRequired, description: p.loginFirst, variant: 'destructive' });
      return;
    }
    setBuyingPriceId(priceId);
    try {
      // On Capacitor native (Android/iOS) window.location.origin is "https://localhost",
      // which Stripe cannot redirect back to. Force the public web origin instead.
      const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
      const origin = isNative ? 'https://musicscan.app' : window.location.origin;
      const { data, error } = await supabase.functions.invoke('create-credit-checkout', {
        body: { priceId, origin },
      });
      if (error) throw error;
      if (data?.url) {
        // External browser for app store compliance
        openExternalPayment(data.url);
      }
    } catch (error: any) {
      toast({ title: tr.common.error, description: error.message || p.tryAgain, variant: 'destructive' });
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
      period: tr.common.perMonth,
      description: p.freeDesc,
      features: [
        `10 ${p.photoScansPerMonth}`,
        p.basicCollectionMgmt,
        p.publicCatalogAccess,
        `5 ${p.chatQueriesPerMonth}`,
        p.communityFeatures
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
      period: tr.common.perMonth,
      description: p.basicDesc,
      features: [
        `50 ${p.photoScansPerMonth}`,
        p.fullCollectionFeatures,
        `20 ${p.chatQueriesPerMonth}`,
        p.basicBlogGeneration,
        p.emailSupport
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
      period: tr.common.perMonth,
      description: p.plusDesc,
      features: [
        `200 ${p.photoScansPerMonth}`,
        p.unlimitedChat,
        p.advancedAnalytics,
        p.marketplaceIntegration,
        p.prioritySupport,
        `${p.bulkUpload} (20)`
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
      period: tr.common.perMonth,
      description: p.proDesc,
      features: [
        p.unlimitedPhotoScans,
        p.unlimitedChat,
        `${p.bulkUpload} (50)`,
        p.advancedMarketplace,
        p.whiteLabelOptions,
        p.apiAccess,
        p.prioritySupport
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
      period: tr.common.perMonth,
      description: p.businessDesc,
      features: [
        p.allProFeatures,
        p.multiUserAccounts,
        p.advancedDashboard,
        p.customIntegrations,
        p.dedicatedManager,
        p.slaGuarantees,
        p.trainingOnboarding
      ],
      icon: Building2,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      popular: false,
      current: subscription?.plan_slug === 'business'
    }
  ];

  const handleSelectPlan = async (planSlug: string) => {
    if (!user) {
      toast({ title: p.loginRequired, description: p.loginFirstSub, variant: "destructive" });
      return;
    }
    if (planSlug === 'free') {
      toast({ title: p.freePlan, description: p.alreadyFree });
      return;
    }
    if (subscription?.plan_slug === planSlug) {
      toast({ title: p.currentPlan, description: p.alreadyCurrent });
      return;
    }
    try {
      await createCheckout(planSlug);
      toast({ title: p.redirecting, description: p.redirectingDesc });
    } catch (error: any) {
      toast({ title: p.checkoutError, description: error.message || p.tryAgain, variant: "destructive" });
    }
  };

  return (
    <>
<div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {p.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {p.subtitle}
            </p>
          </div>

          {user && (
            <Card className="max-w-3xl mx-auto mb-12 border-primary/20 bg-card/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center md:text-left space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">{p.currentPlan}</p>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Crown className="h-5 w-5 text-primary" />
                      <span className="text-xl font-bold">
                        {subscription?.plan_name || 'FREE - Music Explorer'}
                      </span>
                    </div>
                    {subscription?.subscription_end && (
                      <p className="text-xs text-muted-foreground">
                        {p.renewsOn} {new Date(subscription.subscription_end).toLocaleDateString('nl-NL')}
                      </p>
                    )}
                  </div>

                  <div className="text-center space-y-2 border-x-0 md:border-x border-border px-4">
                    <p className="text-sm text-muted-foreground font-medium">{p.creditsBalance}</p>
                    <div className="flex items-center gap-2 justify-center">
                      <Coins className="h-5 w-5 text-primary" />
                      <span className="text-3xl font-bold">{userCredits?.balance ?? 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{tr.common.available}</p>
                  </div>

                  <div className="text-center md:text-right space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">{p.usageThisMonth}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-center md:justify-end gap-2 text-sm">
                        <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{aiScansUsed} {tr.common.scans}</span>
                      </div>
                      <div className="flex items-center justify-center md:justify-end gap-2 text-sm">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{aiChatUsed} {tr.common.chats}</span>
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

          <Tabs defaultValue="credits" className="max-w-7xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-10">
              <TabsTrigger value="credits" className="text-base">
                <Coins className="h-4 w-4 mr-2" /> {p.looseCredits}
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="text-base">
                <Crown className="h-4 w-4 mr-2" /> {p.subscriptions}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credits">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{p.buyScanCredits}</h2>
                <p className="text-muted-foreground">{p.eachScanCosts}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {creditPackages.map((pkg) => {
                  const isPopular = pkg.badge === 'Populairste';
                  const isBest = pkg.badge === 'Beste Deal';
                  return (
                  <Card
                    key={pkg.stripe_price_id}
                    className={`relative p-6 transition-all duration-300 hover:scale-105 ${
                      pkg.badge ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        {p.mostPopular}
                      </Badge>
                    )}
                    {isBest && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600">
                        <Sparkles className="h-3 w-3 mr-1" /> {p.bestDeal}
                      </Badge>
                    )}
                    {pkg.badge && !isPopular && !isBest && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        {pkg.badge}
                      </Badge>
                    )}

                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                        <span className="text-2xl font-bold text-primary">{pkg.credits}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{pkg.credits} Credits</h3>
                        <p className="text-sm text-muted-foreground">{pkg.per_credit_label} {p.perCredit}</p>
                      </div>
                      <div>
                        <span className="text-3xl font-bold">{pkg.price_label}</span>
                      </div>
                      {isIOS ? (
                        <div className="text-center space-y-2">
                          <p className="text-xs text-muted-foreground">
                            🍎 Koop credits via onze website
                          </p>
                          <a
                            href="https://musicscan.lovable.app/pricing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
                          >
                            musicscan.lovable.app/pricing
                          </a>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          variant={pkg.badge ? 'default' : 'outline'}
                          onClick={() => handleBuyCredits(pkg.stripe_price_id)}
                          disabled={buyingPriceId === pkg.stripe_price_id}
                        >
                          {buyingPriceId === pkg.stripe_price_id ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" />{p.patience}</>
                          ) : (
                            p.buy
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                  );
                })}
              </div>

              <div className="text-center mt-8 text-sm text-muted-foreground">
                <p>{p.creditsNeverExpire}</p>
              </div>
            </TabsContent>

            <TabsContent value="subscriptions">
              {subscription && (
                <div className="text-center mb-8">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {p.currentPlan}: {subscription.plan_name}
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
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">{p.popularChoice}</Badge>
                      )}
                      {plan.current && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500">{p.currentPlanBadge}</Badge>
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
                        {plan.current ? p.currentPlanBadge : plan.slug === 'free' ? p.freeStart : p.choosePlan}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">{p.faq}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">{p.faqCreditsVsSub}</h3>
                <p className="text-muted-foreground">{p.faqCreditsVsSubAnswer}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">{p.faqBoth}</h3>
                <p className="text-muted-foreground">{p.faqBothAnswer}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">{p.faqExpire}</h3>
                <p className="text-muted-foreground">{p.faqExpireAnswer}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">{p.faqChange}</h3>
                <p className="text-muted-foreground">{p.faqChangeAnswer}</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">{p.questionsAboutPricing}</p>
            <Button variant="outline" asChild>
              <a href="mailto:support@musicscan.app">{p.contactUs}</a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
