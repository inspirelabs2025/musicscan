import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar } from 'lucide-react';

interface YearOverviewHeroProps {
  year: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  isAdmin?: boolean;
}

export const YearOverviewHero: React.FC<YearOverviewHeroProps> = ({
  year,
  onYearChange,
  availableYears,
  onRegenerate,
  isRegenerating,
  isAdmin
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-border/50 p-8 mb-8">
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">
                MusicScan Jaar Overzicht
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Een compleet overzicht van muziektrends, scans en community activiteit
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={year.toString()} onValueChange={(v) => onYearChange(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {isAdmin && onRegenerate && (
              <Button 
                variant="outline" 
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Genereren...' : 'Regenereren'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
