import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Euro } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PriceAnalysisSectionProps {
  lowestPrice?: number | null;
  medianPrice?: number | null;
  highestPrice?: number | null;
  calculatedAdvicePrice?: number | null;
  marketplacePrice?: number | null;
  currency?: string;
}

export function PriceAnalysisSection({
  lowestPrice, medianPrice, highestPrice, calculatedAdvicePrice, marketplacePrice, currency = "€"
}: PriceAnalysisSectionProps) {
  const { tr } = useLanguage();
  const sc = tr.scanCollectionUI;

  if (!lowestPrice && !medianPrice && !highestPrice && !calculatedAdvicePrice && !marketplacePrice) return null;

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
    if (Math.abs(percentageDiff) < 5) return { status: "fair", icon: Minus, text: sc.fairlyPriced };
    if (percentageDiff > 0) return { status: "high", icon: TrendingUp, text: sc.aboveMarket.replace('{pct}', percentageDiff.toFixed(1)) };
    return { status: "low", icon: TrendingDown, text: sc.belowMarket.replace('{pct}', Math.abs(percentageDiff).toFixed(1)) };
  };

  const marketComparison = getMarketComparison();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Euro className="w-5 h-5" />{sc.priceAnalysis}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(lowestPrice || medianPrice || highestPrice) && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">{sc.marketValueRange}</h4>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">{sc.min}: {formatPrice(lowestPrice)}</span>
              <span className="font-medium">{sc.med}: {formatPrice(medianPrice)}</span>
              <span className="text-red-600">{sc.max}: {formatPrice(highestPrice)}</span>
            </div>
            {lowestPrice && highestPrice && <Progress value={50} className="h-2" />}
          </div>
        )}
        {calculatedAdvicePrice && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">{sc.advisedValue}</h4>
            <div className="text-2xl font-bold text-primary">{formatPrice(calculatedAdvicePrice)}</div>
            {lowestPrice && highestPrice && <Progress value={getPricePosition()} className="h-3" />}
          </div>
        )}
        {marketplacePrice && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">{sc.currentAskingPrice}</h4>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold">{formatPrice(marketplacePrice)}</span>
              {marketComparison && (
                <Badge variant={marketComparison.status === 'fair' ? 'secondary' : marketComparison.status === 'high' ? 'destructive' : 'default'} className="flex items-center gap-1">
                  <marketComparison.icon className="w-3 h-3" />{marketComparison.text}
                </Badge>
              )}
            </div>
          </div>
        )}
        {(lowestPrice && highestPrice) && (
          <div className="text-xs text-muted-foreground pt-2 border-t">{sc.priceDataBased}</div>
        )}
      </CardContent>
    </Card>
  );
}
