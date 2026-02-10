import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DISCOGS_CONDITIONS = [
  { value: 'Mint (M)', label: 'Mint (M)', desc: 'Absoluut perfect, nooit afgespeeld' },
  { value: 'Near Mint (NM or M-)', label: 'Near Mint (NM)', desc: 'Vrijwel perfect' },
  { value: 'Very Good Plus (VG+)', label: 'Very Good Plus (VG+)', desc: 'Lichte gebruikssporen' },
  { value: 'Very Good (VG)', label: 'Very Good (VG)', desc: 'Duidelijke gebruikssporen, speelt goed' },
  { value: 'Good Plus (G+)', label: 'Good Plus (G+)', desc: 'Zichtbare slijtage' },
  { value: 'Good (G)', label: 'Good (G)', desc: 'Veel slijtage, speelt nog' },
  { value: 'Fair (F)', label: 'Fair (F)', desc: 'Beschadigd' },
  { value: 'Poor (P)', label: 'Poor (P)', desc: 'Nauwelijks afspeelbaar' },
];

const CONDITION_FACTORS: Record<string, number> = {
  'Mint (M)': 1.20,
  'Near Mint (NM or M-)': 1.00,
  'Very Good Plus (VG+)': 0.75,
  'Very Good (VG)': 0.50,
  'Good Plus (G+)': 0.35,
  'Good (G)': 0.20,
  'Fair (F)': 0.10,
  'Poor (P)': 0.05,
};

export function calculateAdvicePrice(
  medianPrice: number | null | undefined,
  conditionMedia: string,
  conditionSleeve: string
): number | null {
  if (!medianPrice || !conditionMedia) return null;
  const mediaFactor = CONDITION_FACTORS[conditionMedia] ?? 0.5;
  const sleeveFactor = CONDITION_FACTORS[conditionSleeve] ?? 0.5;
  // Media weegt zwaarder (70%) dan hoes (30%)
  const combinedFactor = (mediaFactor * 0.7) + (sleeveFactor * 0.3);
  return Math.round(medianPrice * combinedFactor * 100) / 100;
}

interface ConditionGradingPanelProps {
  mediaType: 'vinyl' | 'cd' | '';
  conditionMedia: string;
  conditionSleeve: string;
  medianPrice: number | null | undefined;
  onConditionMediaChange: (value: string) => void;
  onConditionSleeveChange: (value: string) => void;
}

export const ConditionGradingPanel: React.FC<ConditionGradingPanelProps> = ({
  mediaType,
  conditionMedia,
  conditionSleeve,
  medianPrice,
  onConditionMediaChange,
  onConditionSleeveChange,
}) => {
  const advicePrice = useMemo(
    () => calculateAdvicePrice(medianPrice, conditionMedia, conditionSleeve),
    [medianPrice, conditionMedia, conditionSleeve]
  );

  const mediaLabel = mediaType === 'vinyl' ? 'Vinyl' : 'CD';

  return (
    <div className="mt-3 p-3 bg-background/60 rounded-lg border border-border/50 space-y-3">
      <div className="text-xs font-semibold flex items-center gap-1.5">
        📋 Conditie beoordeling (Discogs Grading)
      </div>

      {/* Media condition */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Staat van de {mediaLabel}</label>
        <Select value={conditionMedia} onValueChange={onConditionMediaChange}>
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue placeholder="Selecteer conditie..." />
          </SelectTrigger>
          <SelectContent className="z-[200] bg-popover">
            {DISCOGS_CONDITIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                <span className="font-medium">{opt.label}</span>
                <span className="text-muted-foreground ml-1">— {opt.desc}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sleeve condition */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Staat van de hoes</label>
        <Select value={conditionSleeve} onValueChange={onConditionSleeveChange}>
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue placeholder="Selecteer conditie..." />
          </SelectTrigger>
          <SelectContent className="z-[200] bg-popover">
            {DISCOGS_CONDITIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                <span className="font-medium">{opt.label}</span>
                <span className="text-muted-foreground ml-1">— {opt.desc}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Advice price */}
      {advicePrice !== null && (
        <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Adviesprijs</span>
          </div>
          <Badge variant="secondary" className="text-sm font-bold">
            €{advicePrice.toFixed(2)}
          </Badge>
        </div>
      )}

      {conditionMedia && conditionSleeve && !medianPrice && (
        <div className="text-xs text-muted-foreground italic">
          Geen prijsdata beschikbaar voor adviesprijs
        </div>
      )}
    </div>
  );
};
