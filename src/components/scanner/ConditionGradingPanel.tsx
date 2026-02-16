import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

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
  conditionSleeve: string,
  lowestPrice?: number | null,
  highestPrice?: number | null
): number | null {
  if (!conditionMedia) return null;
  const mediaFactor = CONDITION_FACTORS[conditionMedia] ?? 0.5;
  const sleeveFactor = CONDITION_FACTORS[conditionSleeve] ?? 0.5;
  const combinedFactor = (mediaFactor * 0.7) + (sleeveFactor * 0.3);

  if (medianPrice && medianPrice > 0) {
    return Math.round(medianPrice * combinedFactor * 100) / 100;
  }
  if (lowestPrice && lowestPrice > 0) {
    const estimatedMedian = lowestPrice * 1.3;
    return Math.round(estimatedMedian * combinedFactor * 100) / 100;
  }
  if (highestPrice && highestPrice > 0) {
    const estimatedMedian = highestPrice * 0.5;
    return Math.round(estimatedMedian * combinedFactor * 100) / 100;
  }
  const fallbackMedian = 8;
  return Math.round(fallbackMedian * combinedFactor * 100) / 100;
}

interface ConditionGradingPanelProps {
  mediaType: 'vinyl' | 'cd' | '';
  conditionMedia: string;
  conditionSleeve: string;
  medianPrice: number | null | undefined;
  lowestPrice?: number | null;
  highestPrice?: number | null;
  onConditionMediaChange: (value: string) => void;
  onConditionSleeveChange: (value: string) => void;
}

export const ConditionGradingPanel: React.FC<ConditionGradingPanelProps> = ({
  mediaType,
  conditionMedia,
  conditionSleeve,
  medianPrice,
  lowestPrice,
  highestPrice,
  onConditionMediaChange,
  onConditionSleeveChange,
}) => {
  const { tr } = useLanguage();
  const s = tr.scannerUI;

  const DISCOGS_CONDITIONS = useMemo(() => [
    { value: 'Mint (M)', label: 'Mint (M)', desc: s.absolutelyPerfect },
    { value: 'Near Mint (NM or M-)', label: 'Near Mint (NM)', desc: s.almostPerfect },
    { value: 'Very Good Plus (VG+)', label: 'Very Good Plus (VG+)', desc: s.slightWear },
    { value: 'Very Good (VG)', label: 'Very Good (VG)', desc: s.clearWear },
    { value: 'Good Plus (G+)', label: 'Good Plus (G+)', desc: s.visibleWear },
    { value: 'Good (G)', label: 'Good (G)', desc: s.heavyWear },
    { value: 'Fair (F)', label: 'Fair (F)', desc: s.damaged },
    { value: 'Poor (P)', label: 'Poor (P)', desc: s.barelyPlayable },
  ], [s]);

  const advicePrice = useMemo(
    () => calculateAdvicePrice(medianPrice, conditionMedia, conditionSleeve, lowestPrice, highestPrice),
    [medianPrice, conditionMedia, conditionSleeve, lowestPrice, highestPrice]
  );

  const isEstimate = !medianPrice || medianPrice <= 0;
  const mediaLabel = mediaType === 'vinyl' ? 'Vinyl' : 'CD';

  return (
    <div className="mt-3 p-3 bg-background/60 rounded-lg border border-border/50 space-y-3">
      <div className="text-xs font-semibold flex items-center gap-1.5">
        📋 {s.conditionGrading}
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{s.mediaState} {mediaLabel}</label>
        <Select value={conditionMedia} onValueChange={onConditionMediaChange}>
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue placeholder={s.selectCondition} />
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

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{s.sleeveState}</label>
        <Select value={conditionSleeve} onValueChange={onConditionSleeveChange}>
          <SelectTrigger className="h-8 text-xs bg-background">
            <SelectValue placeholder={s.selectCondition} />
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

      {advicePrice !== null && (
        <div className={`flex items-center justify-between p-2 rounded-lg border ${
          isEstimate ? 'bg-amber-500/10 border-amber-500/20' : 'bg-primary/10 border-primary/20'
        }`}>
          <div className="flex items-center gap-1.5">
            <TrendingUp className={`h-3.5 w-3.5 ${isEstimate ? 'text-amber-600' : 'text-primary'}`} />
            <div className="flex flex-col">
              <span className="text-xs font-medium">{s.advicePrice}</span>
              {isEstimate && (
                <span className="text-[10px] text-muted-foreground">{s.estimateNoDiscogs}</span>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-sm font-bold">
            {isEstimate ? '~' : ''}€{advicePrice.toFixed(2)}
          </Badge>
        </div>
      )}
    </div>
  );
};
