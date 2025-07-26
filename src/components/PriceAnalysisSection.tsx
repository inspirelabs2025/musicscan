import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Euro } from "lucide-react";

interface PriceAnalysisSectionProps {
  lowestPrice?: number | null;
  medianPrice?: number | null;
  highestPrice?: number | null;
  calculatedAdvicePrice?: number | null;
  marketplacePrice?: number | null;
  currency?: string;
}

export function PriceAnalysisSection({
  lowestPrice,
  medianPrice,
  highestPrice,
  calculatedAdvicePrice,
  marketplacePrice,
  currency = "€"
}: PriceAnalysisSectionProps) {
  // If no price data available, don't render
  if (!lowestPrice && !medianPrice && !highestPrice && !calculatedAdvicePrice && !marketplacePrice) {
    return null;
  }

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "N/A";
    return `${currency}${price.toFixed(2)}`;
  };

  const getPricePosition = () => {
    if (!calculatedAdvicePrice || !lowestPrice || !highestPrice) return 50;
    const range = highestPrice - lowestPrice;
    if (range === 0) return 50;
    return ((calculatedAdvicePrice - lowestPrice) / range) * 100;
  };

  const getMarketComparison = () => {
    if (!marketplacePrice || !calculatedAdvicePrice) return null;
    
    const difference = marketplacePrice - calculatedAdvicePrice;
    const percentageDiff = (difference / calculatedAdvicePrice) * 100;
    
    if (Math.abs(percentageDiff) < 5) {
      return { status: "fair", icon: Minus, text: "Marktconform geprijsd" };
    } else if (percentageDiff > 0) {
      return { status: "high", icon: TrendingUp, text: `${percentageDiff.toFixed(1)}% boven marktwaarde` };
    } else {
      return { status: "low", icon: TrendingDown, text: `${Math.abs(percentageDiff).toFixed(1)}% onder marktwaarde` };
    }
  };

  const marketComparison = getMarketComparison();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="w-5 h-5" />
          Prijsanalyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Value Range */}
        {(lowestPrice || medianPrice || highestPrice) && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Marktwaarde Bereik</h4>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Min: {formatPrice(lowestPrice)}</span>
              <span className="font-medium">Med: {formatPrice(medianPrice)}</span>
              <span className="text-red-600">Max: {formatPrice(highestPrice)}</span>
            </div>
            {lowestPrice && highestPrice && (
              <Progress value={50} className="h-2" />
            )}
          </div>
        )}

        {/* Calculated Advice Price */}
        {calculatedAdvicePrice && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Geadviseerde Waarde</h4>
            <div className="text-2xl font-bold text-primary">
              {formatPrice(calculatedAdvicePrice)}
            </div>
            {lowestPrice && highestPrice && (
              <Progress value={getPricePosition()} className="h-3" />
            )}
          </div>
        )}

        {/* Current Marketplace Price */}
        {marketplacePrice && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Huidige Vraagprijs</h4>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold">{formatPrice(marketplacePrice)}</span>
              {marketComparison && (
                <Badge 
                  variant={marketComparison.status === 'fair' ? 'secondary' : 
                          marketComparison.status === 'high' ? 'destructive' : 'default'}
                  className="flex items-center gap-1"
                >
                  <marketComparison.icon className="w-3 h-3" />
                  {marketComparison.text}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Price Insights */}
        {(lowestPrice && highestPrice) && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Prijsdata gebaseerd op recente verkopen en huidige marktaanbod
          </div>
        )}
      </CardContent>
    </Card>
  );
}