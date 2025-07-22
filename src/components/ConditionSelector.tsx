
import React, { useMemo } from 'react';
import { CheckCircle, Loader2, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ConditionSelectorProps {
  mediaType: 'vinyl' | 'cd';
  selectedCondition: string;
  lowestPrice: string | null;
  medianPrice?: string | null;
  highestPrice?: string | null;
  calculatedAdvicePrice: number | null;
  isSaving: boolean;
  onConditionChange: (condition: string) => void;
  onSave: () => void;
}

export const ConditionSelector = React.memo(({ 
  mediaType,
  selectedCondition, 
  lowestPrice,
  medianPrice,
  highestPrice,
  calculatedAdvicePrice,
  isSaving,
  onConditionChange,
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
        {selectedCondition && calculatedAdvicePrice !== null && (
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Adviesprijs</span>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Gebaseerd op {selectedCondition}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-primary mb-2">
                €{calculatedAdvicePrice.toFixed(2)}
              </div>
              {lowestPrice && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Berekend vanaf laagste prijs: €{lowestPrice}</span>
                </div>
              )}
            </div>

            <Button 
              onClick={() => {
                console.log('🔘 ConditionSelector OPSLAAN button clicked');
                onSave();
              }}
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Scan Opslaan
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ConditionSelector.displayName = 'ConditionSelector';
