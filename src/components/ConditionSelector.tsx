
import React, { useMemo } from 'react';
import { CheckCircle, Loader2, TrendingUp, Info, Edit3, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConditionSelectorProps {
  mediaType: 'vinyl' | 'cd';
  selectedCondition: string;
  lowestPrice: string | null;
  medianPrice?: string | null;
  highestPrice?: string | null;
  calculatedAdvicePrice: number | null;
  manualAdvicePrice: number | null;
  useManualAdvicePrice: boolean;
  isSaving: boolean;
  onConditionChange: (condition: string) => void;
  onManualAdvicePriceChange: (price: number | null) => void;
  onToggleManualAdvicePrice: (useManual: boolean) => void;
  onSave: () => void;
}

export const ConditionSelector = React.memo(({ 
  mediaType,
  selectedCondition, 
  lowestPrice,
  medianPrice,
  highestPrice,
  calculatedAdvicePrice,
  manualAdvicePrice,
  useManualAdvicePrice,
  isSaving,
  onConditionChange,
  onManualAdvicePriceChange,
  onToggleManualAdvicePrice,
  onSave
}: ConditionSelectorProps) => {
  
  const conditionOptions = useMemo(() => {
    if (mediaType === 'vinyl') {
      return [
        'Mint (M)',
        'Near Mint (NM or M-)',
        'Very Good Plus (VG+)',
        'Very Good (VG)',
        'Good Plus (G+)',
        'Good (G)',
        'Fair (F) / Poor (P)'
      ];
    }
    return [
      'Mint (M)',
      'Near Mint (NM)',
      'Very Good Plus (VG+)',
      'Very Good (VG)',
      'Good Plus (G+)',
      'Good (G)',
      'Fair (F) / Poor (P)'
    ];
  }, [mediaType]);

  const getConditionDescription = useMemo(() => (condition: string) => {
    const descriptions: Record<string, string> = {
      'Mint (M)': 'Perfect, nieuwstaat',
      'Near Mint (NM or M-)': 'Bijna perfect, zeer lichte gebruikssporen',
      'Near Mint (NM)': 'Bijna perfect, zeer lichte gebruikssporen',
      'Very Good Plus (VG+)': 'Goede staat, lichte gebruikssporen',
      'Very Good (VG)': 'Duidelijke gebruikssporen maar nog goed speelbaar',
      'Good Plus (G+)': 'Zichtbare slijtage, beïnvloedt geluidskwaliteit licht',
      'Good (G)': 'Duidelijke slijtage, merkbare geluidsbeïnvloeding',
      'Fair (F) / Poor (P)': 'Slechte staat, alleen voor verzamelaars'
    };
    return descriptions[condition] || '';
  }, []);

  const getPriceBadgeColor = (price: string | null) => {
    if (!price) return 'secondary';
    const numPrice = parseFloat(price.replace(',', '.'));
    if (numPrice < 20) return 'outline';
    if (numPrice < 50) return 'secondary';
    return 'destructive';
  };

  const handleManualPriceInput = (value: string) => {
    if (value === '' || value === undefined) {
      onManualAdvicePriceChange(null);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        onManualAdvicePriceChange(numValue);
      }
    }
  };

  const getActivePrice = () => {
    return useManualAdvicePrice ? manualAdvicePrice : calculatedAdvicePrice;
  };

  const getPriceDifference = () => {
    if (!manualAdvicePrice || !calculatedAdvicePrice) return null;
    const diff = manualAdvicePrice - calculatedAdvicePrice;
    const percentage = Math.abs(diff / calculatedAdvicePrice * 100);
    return { diff, percentage };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Staat Beoordeling
        </CardTitle>
        <CardDescription>
          Selecteer de staat van je {mediaType} om een adviesprijs te krijgen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecteer staat</label>
          <Select value={selectedCondition} onValueChange={(value) => {
            console.log('🔄 ConditionSelector value changed to:', value);
            onConditionChange(value);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Kies de staat van je vinyl" />
            </SelectTrigger>
            <SelectContent>
              {conditionOptions.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  <div className="flex flex-col">
                    <span>{condition}</span>
                    <span className="text-xs text-muted-foreground">
                      {getConditionDescription(condition)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Information Cards */}
        {(lowestPrice || medianPrice || highestPrice) && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Discogs Prijsinformatie
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lowest Price */}
              {lowestPrice && (
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-green-700 dark:text-green-400 mb-1">Laagste Prijs</div>
                    <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                      €{lowestPrice}
                    </div>
                    <Badge variant={getPriceBadgeColor(lowestPrice)} className="mt-2">
                      Minimum
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* Median Price */}
              {medianPrice && (
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">Gemiddelde Prijs</div>
                    <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                      €{medianPrice}
                    </div>
                    <Badge variant={getPriceBadgeColor(medianPrice)} className="mt-2">
                      Gemiddeld
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {/* Highest Price */}
              {highestPrice && (
                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-red-700 dark:text-red-400 mb-1">Hoogste Prijs</div>
                    <div className="text-2xl font-bold text-red-800 dark:text-red-300">
                      €{highestPrice}
                    </div>
                    <Badge variant={getPriceBadgeColor(highestPrice)} className="mt-2">
                      Maximum
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Advice Price Section */}
        {selectedCondition && (
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Adviesprijs</span>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {useManualAdvicePrice ? 'Handmatig' : calculatedAdvicePrice ? `Gebaseerd op ${selectedCondition}` : 'Handmatige invoer vereist'}
                </Badge>
              </div>
              
              {/* Active Price Display */}
              <div className="text-3xl font-bold text-primary mb-4">
                {getActivePrice() !== null ? `€${getActivePrice()!.toFixed(2)}` : '€0.00'}
              </div>
              
              {/* No Discogs Price Warning */}
              {!calculatedAdvicePrice && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <Info className="h-4 w-4" />
                    <span className="text-sm font-medium">Geen Discogs prijsdata beschikbaar</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Voer handmatig een prijs in om door te gaan
                  </p>
                </div>
              )}
              
              {/* Manual/Automatic Toggle */}
              <div className="space-y-4 mb-4">
                {calculatedAdvicePrice && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Handmatige prijsinstelling</label>
                    <Switch
                      checked={useManualAdvicePrice}
                      onCheckedChange={onToggleManualAdvicePrice}
                    />
                  </div>
                )}
                
                {/* Price Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Automatic Price */}
                  {calculatedAdvicePrice && (
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Automatische Prijs</label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={`€${calculatedAdvicePrice.toFixed(2)}`}
                          readOnly
                          disabled
                          className="bg-muted/50"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Manual Price */}
                  <div className={`space-y-2 ${!calculatedAdvicePrice ? 'md:col-span-2' : ''}`}>
                    <label className="text-xs text-muted-foreground">
                      {calculatedAdvicePrice ? 'Handmatige Prijs' : 'Prijs *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">€</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={manualAdvicePrice || ''}
                        onChange={(e) => handleManualPriceInput(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                        disabled={calculatedAdvicePrice && !useManualAdvicePrice}
                        required={!calculatedAdvicePrice}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                {useManualAdvicePrice && calculatedAdvicePrice && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onManualAdvicePriceChange(calculatedAdvicePrice)}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Kopieer Automatische
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onManualAdvicePriceChange(null)}
                    >
                      Wis
                    </Button>
                  </div>
                )}
                
                {/* Price Difference Warning */}
                {useManualAdvicePrice && manualAdvicePrice && getPriceDifference() && getPriceDifference()!.percentage > 20 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      De handmatige prijs wijkt {getPriceDifference()!.percentage.toFixed(0)}% af van de automatische prijs 
                      ({getPriceDifference()!.diff > 0 ? '+' : ''}€{getPriceDifference()!.diff.toFixed(2)})
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {lowestPrice && !useManualAdvicePrice && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Berekend vanaf laagste prijs: €{lowestPrice}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Pricing Data Warning */}
        {!lowestPrice && !medianPrice && !highestPrice && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Geen prijsgegevens beschikbaar</p>
                  <p className="text-sm text-amber-700 mt-1">
                    De prijsinformatie kon niet worden opgehaald. Je kunt handmatig een prijs invoeren of de scan opslaan zonder prijsgegevens.
                  </p>
                </div>
              </div>
              
              {/* Manual price input when no pricing data */}
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium text-amber-800">Handmatige Prijs (optioneel)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-amber-700">€</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualAdvicePrice || ''}
                    onChange={(e) => handleManualPriceInput(e.target.value)}
                    placeholder="0.00"
                    className="pl-7 bg-white border-amber-300"
                  />
                </div>
                <p className="text-xs text-amber-600">
                  Laat leeg om zonder prijs op te slaan
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button - Always visible */}
        <Button 
          onClick={() => {
            console.log('🔘 ConditionSelector OPSLAAN button clicked');
            onSave();
          }}
          disabled={isSaving || !selectedCondition}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Opslaan...
            </>
          ) : !selectedCondition ? (
            <>
              <Info className="h-4 w-4 mr-2" />
              Selecteer eerst een conditie
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Scan Opslaan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
});

ConditionSelector.displayName = 'ConditionSelector';
