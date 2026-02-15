import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, ShoppingCart } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';
import { PromoCodeInput } from './PromoCodeInput';

export const CreditsDisplay: React.FC = () => {
  const { data: credits, isLoading } = useCredits();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-primary" />
          Scan Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{isLoading ? '...' : (credits?.balance ?? 0)}</span>
          <span className="text-sm text-muted-foreground">credits beschikbaar</span>
        </div>
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to="/pricing">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Koop Credits
            </Link>
          </Button>
        </div>
        <div className="border-t pt-3">
          <p className="text-sm text-muted-foreground mb-2">Heb je een promocode?</p>
          <PromoCodeInput />
        </div>
      </CardContent>
    </Card>
  );
};
