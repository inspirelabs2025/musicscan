import React, { useMemo } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ConditionSelectorProps {
  mediaType: 'vinyl' | 'cd';
  selectedCondition: string;
  lowestPrice: string | null;
  calculatedAdvicePrice: number | null;
  isSaving: boolean;
  onConditionChange: (condition: string) => void;
  onSave: () => void;
}

export const ConditionSelector = React.memo(({ 
  mediaType,
  selectedCondition, 
  lowestPrice,
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

        {selectedCondition && calculatedAdvicePrice !== null && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Adviesprijs</span>
                <Badge variant="secondary">Gebaseerd op {selectedCondition}</Badge>
              </div>
              <div className="text-2xl font-bold text-primary">
                €{calculatedAdvicePrice.toFixed(2)}
              </div>
              {lowestPrice && (
                <p className="text-xs text-muted-foreground mt-1">
                  Berekend vanaf laagste prijs: €{lowestPrice}
                </p>
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