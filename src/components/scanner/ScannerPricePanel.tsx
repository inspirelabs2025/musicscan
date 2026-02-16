import React, { useMemo } from 'react';
import { TrendingUp, Info, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PricingStats } from '@/hooks/useUnifiedScan';

interface ScannerPricePanelProps {
  mediaType: 'vinyl' | 'cd';
  pricingStats: PricingStats | null | undefined;
  condition: string;
  advicePrice: number | null;
  manualPrice: number | null;
  useManualPrice: boolean;
  onConditionChange: (condition: string) => void;
  onManualPriceChange: (price: number | null) => void;
  onToggleManualPrice: (useManual: boolean) => void;
  isLoading?: boolean;
}

export const ScannerPricePanel = React.memo(({
  mediaType,
  pricingStats,
  condition,
  advicePrice,
  manualPrice,
  useManualPrice,
  onConditionChange,
  onManualPriceChange,
  onToggleManualPrice,
  isLoading = false,
}: ScannerPricePanelProps) => {
  const { tr } = useLanguage();
  const s = tr.scannerUI;

  const CONDITION_OPTIONS = useMemo(() => ({
    vinyl: [
      { value: 'Mint (M)', label: 'Mint (M)', desc: s.perfectNew },
      { value: 'Near Mint (NM or M-)', label: 'Near Mint (NM)', desc: s.almostPerfectShort },
      { value: 'Very Good Plus (VG+)', label: 'Very Good Plus (VG+)', desc: s.slightWearShort },
      { value: 'Very Good (VG)', label: 'Very Good (VG)', desc: s.clearWearShort },
      { value: 'Good Plus (G+)', label: 'Good Plus (G+)', desc: s.visibleWearShort },
      { value: 'Good (G)', label: 'Good (G)', desc: s.clearWearSimple },
      { value: 'Fair (F) / Poor (P)', label: 'Fair / Poor', desc: s.poorState },
    ],
    cd: [
      { value: 'Mint (M)', label: 'Mint (M)', desc: s.perfectNew },
      { value: 'Near Mint (NM)', label: 'Near Mint (NM)', desc: s.almostPerfectShort },
      { value: 'Very Good Plus (VG+)', label: 'Very Good Plus (VG+)', desc: s.slightWearShort },
      { value: 'Very Good (VG)', label: 'Very Good (VG)', desc: s.clearWearShort },
      { value: 'Good Plus (G+)', label: 'Good Plus (G+)', desc: s.visibleWearShort },
      { value: 'Good (G)', label: 'Good (G)', desc: s.clearWearSimple },
      { value: 'Fair (F) / Poor (P)', label: 'Fair / Poor', desc: s.poorState },
    ],
  }), [s]);

  const conditions = CONDITION_OPTIONS[mediaType] || CONDITION_OPTIONS.vinyl;

  const handleManualPriceInput = (value: string) => {
    if (value === '') {
      onManualPriceChange(null);
    } else {
      const num = parseFloat(value);
      if (!isNaN(num) && num >= 0) {
        onManualPriceChange(num);
      }
    }
  };

  const activePrice = useMemo(() => {
    return useManualPrice ? manualPrice : advicePrice;
  }, [useManualPrice, manualPrice, advicePrice]);

  const hasPricing = pricingStats && (pricingStats.lowest_price || pricingStats.median_price);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">{s.loadingPrices}</span>
          </div>
        ) : hasPricing ? (
          <div className="grid grid-cols-3 gap-2">
            {pricingStats?.lowest_price && (
              <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-xs text-green-700 dark:text-green-400">{s.lowest}</div>
                <div className="font-bold text-green-800 dark:text-green-300">€{pricingStats.lowest_price}</div>
              </div>
            )}
            {pricingStats?.median_price && (
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-xs text-blue-700 dark:text-blue-400">{s.median}</div>
                <div className="font-bold text-blue-800 dark:text-blue-300">€{pricingStats.median_price}</div>
              </div>
            )}
            {pricingStats?.highest_price && (
              <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="text-xs text-red-700 dark:text-red-400">{s.highest}</div>
                <div className="font-bold text-red-800 dark:text-red-300">€{pricingStats.highest_price}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <Info className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800 dark:text-amber-300">{s.noPriceData}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">{s.condition}</label>
          <Select value={condition} onValueChange={onConditionChange}>
            <SelectTrigger>
              <SelectValue placeholder={s.selectCondition} />
            </SelectTrigger>
            <SelectContent>
              {conditions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {condition && (
          <div className="space-y-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium">{s.advicePrice}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {useManualPrice ? s.manual : s.automatic}
              </Badge>
            </div>

            <div className="text-2xl font-bold text-primary">
              {activePrice !== null ? `€${activePrice.toFixed(2)}` : '€ --'}
            </div>

            {advicePrice !== null && (
              <div className="flex items-center justify-between">
                <label className="text-sm">{s.manualAdjust}</label>
                <Switch checked={useManualPrice} onCheckedChange={onToggleManualPrice} />
              </div>
            )}

            {(useManualPrice || !advicePrice) && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualPrice ?? ''}
                  onChange={(e) => handleManualPriceInput(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ScannerPricePanel.displayName = 'ScannerPricePanel';
