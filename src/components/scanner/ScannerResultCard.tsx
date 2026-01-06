import React from 'react';
import { ExternalLink, Disc, Calendar, Tag, MapPin, Music, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ScanResult, ScanStatus } from '@/hooks/useUnifiedScan';

interface ConfidenceInfo {
  artist?: number;
  title?: number;
  overall?: number;
}

interface ExtendedScanResult extends ScanResult {
  confidence?: ConfidenceInfo;
  ocr_notes?: string;
}

interface ScannerResultCardProps {
  result: ExtendedScanResult | null;
  status: ScanStatus;
}

const ConfidenceIndicator = ({ confidence }: { confidence?: ConfidenceInfo }) => {
  if (!confidence) return null;
  
  const overall = confidence.overall ?? 0.5;
  const isLowConfidence = overall < 0.7;
  
  if (!isLowConfidence) return null;
  
  return (
    <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/30 rounded-md text-warning text-xs">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>
        Niet helemaal zeker van dit resultaat. Controleer of de gegevens kloppen.
      </span>
    </div>
  );
};

export const ScannerResultCard = React.memo(({ result, status }: ScannerResultCardProps) => {
  const isLoading = status === 'analyzing' || status === 'searching';
  const extendedResult = result as ExtendedScanResult | null;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              <div className="flex gap-2 mt-2">
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            {status === 'analyzing' ? '🔍 Album wordt geanalyseerd...' : '📀 Zoeken in Discogs...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <ConfidenceIndicator confidence={extendedResult?.confidence} />
        <div className="flex gap-4 mt-2">
          {/* Cover image */}
          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
            {result.cover_image ? (
              <img
                src={result.cover_image}
                alt={`${result.artist} - ${result.title}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Album info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold text-lg leading-tight truncate">
                {result.title || 'Onbekend album'}
              </h3>
              <p className="text-muted-foreground truncate">
                {result.artist || 'Onbekende artiest'}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {result.year && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {result.year}
                </Badge>
              )}
              {result.format && (
                <Badge variant="outline" className="text-xs">
                  <Disc className="h-3 w-3 mr-1" />
                  {result.format}
                </Badge>
              )}
              {result.country && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {result.country}
                </Badge>
              )}
              {result.genre && (
                <Badge variant="outline" className="text-xs">
                  <Music className="h-3 w-3 mr-1" />
                  {result.genre}
                </Badge>
              )}
            </div>

            {/* Label & catalog */}
            {(result.label || result.catalog_number) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {[result.label, result.catalog_number].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* Discogs link */}
            {result.discogs_url && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                asChild
              >
                <a href={result.discogs_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Bekijk op Discogs
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ScannerResultCard.displayName = 'ScannerResultCard';
