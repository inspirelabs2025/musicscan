import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, ShoppingCart, ExternalLink } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { PromoCodeInput } from './PromoCodeInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsIOS } from '@/hooks/useIsIOS';

export const CreditsDisplay: React.FC = () => {
  const { data: credits, isLoading } = useCredits();
  const { tr } = useLanguage();
  const s = tr.shopUI;
  const isIOS = useIsIOS();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-primary" />
          {s.scanCredits}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{isLoading ? '...' : (credits?.balance ?? 0)}</span>
          <span className="text-sm text-muted-foreground">{s.creditsAvailable}</span>
        </div>
        {isIOS ? (
          <div className="rounded-lg bg-muted/50 p-3 text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              🍎 Koop credits via onze website:
            </p>
            <a
              href="https://musicscan.lovable.app/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-2"
            >
              musicscan.lovable.app <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link to="/pricing">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {s.buyCredits}
                </Link>
              </Button>
            </div>
            {/* Betaalmethodes */}
            <div className="flex items-center gap-3 justify-center pt-1">
              <span className="text-[11px] text-muted-foreground">{s.payWith}</span>
              <div className="flex items-center gap-2">
                <img src="/images/payment/ideal.svg" alt="iDEAL" className="h-6" />
                <img src="/images/payment/visa.svg" alt="Visa" className="h-4" />
                <img src="/images/payment/mastercard.svg" alt="Mastercard" className="h-6" />
                <img src="/images/payment/paypal.svg" alt="PayPal" className="h-5" />
                <img src="/images/payment/klarna.svg" alt="Klarna" className="h-5" />
              </div>
            </div>
          </>
        )}
        <div className="border-t pt-3">
          <p className="text-sm text-muted-foreground mb-2">{s.havePromoCode}</p>
          <PromoCodeInput />
        </div>
      </CardContent>
    </Card>
  );
};