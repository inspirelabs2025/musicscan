
import React from 'react';
import { Calculator, Euro, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ManualPriceInputProps {
  automaticPrice: number | null;
  manualPrice: number | null;
  useManualPrice: boolean;
  onManualPriceChange: (price: number | null) => void;
  onToggleManualPrice: (useManual: boolean) => void;
}

export const ManualPriceInput = ({
  automaticPrice,
  manualPrice,
  useManualPrice,
  onManualPriceChange,
  onToggleManualPrice
}: ManualPriceInputProps) => {
  const handlePriceInput = (value: string) => {
    if (value === '') {
      onManualPriceChange(null);
      return;
    }
    
    const numericValue = parseFloat(value.replace(',', '.'));
    if (!isNaN(numericValue) && numericValue >= 0) {
      onManualPriceChange(numericValue);
    }
  };

  const getPriceDifference = () => {
    if (!automaticPrice || !manualPrice) return null;
    const difference = manualPrice - automaticPrice;
    const percentage = (difference / automaticPrice) * 100;
    return { difference, percentage };
  };

  const difference = getPriceDifference();
  const currentPrice = useManualPrice ? manualPrice : automaticPrice;

  return (
    <Card variant="dark" className="max-w-2xl mx-auto">\
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Prijs Aanpassing
        </CardTitle>
        <CardDescription>
          Pas de prijs handmatig aan of gebruik de automatisch berekende prijs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Active Price Display */}
        <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Actieve Prijs</span>
            <Badge variant={useManualPrice ? "default" : "secondary"}>
              {useManualPrice ? "Handmatig" : "Automatisch"}
            </Badge>
          </div>
          <div className="text-3xl font-bold text-primary">
            €{currentPrice?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="price-toggle" className="text-sm font-medium">
              Handmatige prijs gebruiken
            </Label>
            <p className="text-xs text-muted-foreground">
              Schakel tussen automatische en handmatige prijsbepaling
            </p>
          </div>
          <Switch
            id="price-toggle"
            checked={useManualPrice}
            onCheckedChange={onToggleManualPrice}
          />
        </div>

        {/* Price Comparison Table */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Automatische Prijs
            </Label>
            <div className={`p-3 rounded-lg border ${!useManualPrice ? 'bg-primary/10 border-primary' : 'bg-muted/50'}`}>
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="font-semibold">
                  €{automaticPrice?.toFixed(2) || '0.00'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gebaseerd op Discogs data
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Handmatige Prijs
            </Label>
            <div className={`space-y-2 ${useManualPrice ? 'opacity-100' : 'opacity-60'}`}>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={manualPrice || ''}
                  onChange={(e) => handlePriceInput(e.target.value)}
                  className="pl-10"
                  step="0.01"
                  min="0"
                  disabled={!useManualPrice}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Voer je eigen prijs in
              </p>
            </div>
          </div>
        </div>

        {/* Price Difference Warning */}
        {difference && useManualPrice && Math.abs(difference.percentage) > 20 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-2 text-warning-foreground">
              <span className="text-sm font-medium">⚠️ Significant verschil</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Je handmatige prijs wijkt {Math.abs(difference.percentage).toFixed(1)}% af van de automatische prijs
              ({difference.difference > 0 ? '+' : ''}€{difference.difference.toFixed(2)})
            </p>
          </div>
        )}

        {/* Quick Actions */}
        {useManualPrice && automaticPrice && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onManualPriceChange(automaticPrice)}
            >
              Kopieer automatische prijs
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onManualPriceChange(null)}
            >
              Wis handmatige prijs
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
