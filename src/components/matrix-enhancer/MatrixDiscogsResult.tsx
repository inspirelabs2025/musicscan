import React from 'react';
import { ExternalLink, Disc, CheckCircle, AlertCircle, Loader2, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SafeImage from '@/components/SafeImage';

export interface DiscogsLookupResult {
  success: boolean;
  discogs_id: number | null;
  discogs_url: string | null;
  artist: string | null;
  title: string | null;
  catalog_number: string | null;
  label: string | null;
  year: number | null;
  country: string | null;
  genre: string | null;
  cover_image: string | null;
  match_confidence: number;
  match_reasons: string[];
  format?: string; // 'CD' or 'Vinyl'
  all_candidates?: Array<{
    id: number;
    artist: string;
    title: string;
    catalog_number: string | null;
    year: number | null;
    match_score: number;
  }>;
  error?: string;
}

interface MatrixDiscogsResultProps {
  result: DiscogsLookupResult | null;
  isLoading: boolean;
  onRetry?: () => void;
  matrixNumber?: string;
}

export function MatrixDiscogsResult({ result, isLoading, onRetry, matrixNumber }: MatrixDiscogsResultProps) {
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Discogs lookup...</p>
              <p className="text-sm text-muted-foreground">Zoeken naar release met matrix: {matrixNumber?.slice(0, 20)}...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  // No match found
  if (!result.success) {
    return (
      <Card className="mt-6 border-amber-500/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Geen exacte match gevonden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {result.error || 'De matrix kon niet betrouwbaar worden gekoppeld aan een Discogs release.'}
          </p>
          
          {/* Show candidates if available */}
          {result.all_candidates && result.all_candidates.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Mogelijke matches:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.all_candidates.slice(0, 5).map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{candidate.artist} - {candidate.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {candidate.catalog_number || 'Geen catalog'} • {candidate.year || '?'}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {(candidate.match_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
              Opnieuw zoeken
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Match found!
  const confidenceColor = result.match_confidence >= 0.6 
    ? 'text-green-600' 
    : result.match_confidence >= 0.4 
    ? 'text-amber-600' 
    : 'text-red-600';

  const confidenceBg = result.match_confidence >= 0.6 
    ? 'bg-green-500/10 border-green-500/30' 
    : result.match_confidence >= 0.4 
    ? 'bg-amber-500/10 border-amber-500/30' 
    : 'bg-red-500/10 border-red-500/30';

  return (
    <Card className={`mt-6 ${confidenceBg}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Discogs Match Gevonden
          </div>
          {/* Format badge */}
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            <Disc className="h-3 w-3 mr-1" />
            {result.format || 'CD'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Cover image */}
          <div className="shrink-0">
            {result.cover_image ? (
              <SafeImage
                src={result.cover_image}
                alt={`${result.artist} - ${result.title}`}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Metadata */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="font-semibold text-lg truncate">{result.artist}</p>
              <p className="text-muted-foreground truncate">{result.title}</p>
            </div>
            
            {/* Catalog Number - Prominent */}
            {result.catalog_number && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                <Disc className="h-4 w-4 text-primary" />
                <span className="font-mono font-bold text-primary">{result.catalog_number}</span>
              </div>
            )}
            
            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {result.label && (
                <div>
                  <span className="text-muted-foreground">Label:</span>{' '}
                  <span className="font-medium">{result.label}</span>
                </div>
              )}
              {result.year && (
                <div>
                  <span className="text-muted-foreground">Jaar:</span>{' '}
                  <span className="font-medium">{result.year}</span>
                </div>
              )}
              {result.country && (
                <div>
                  <span className="text-muted-foreground">Land:</span>{' '}
                  <span className="font-medium">{result.country}</span>
                </div>
              )}
              {result.genre && (
                <div>
                  <span className="text-muted-foreground">Genre:</span>{' '}
                  <span className="font-medium">{result.genre}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Match confidence & Discogs link */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Match:</span>
            <Badge variant="outline" className={confidenceColor}>
              {(result.match_confidence * 100).toFixed(0)}%
            </Badge>
            {result.match_reasons.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({result.match_reasons.join(', ')})
              </span>
            )}
          </div>
          
          {result.discogs_url && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={result.discogs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Bekijk op Discogs
              </a>
            </Button>
          )}
        </div>
        
        {/* Other candidates if low confidence */}
        {result.match_confidence < 0.6 && result.all_candidates && result.all_candidates.length > 1 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Andere mogelijke matches:</p>
            <div className="space-y-1">
              {result.all_candidates.slice(1, 4).map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between p-2 bg-background/50 rounded text-xs"
                >
                  <span className="truncate">
                    {candidate.artist} - {candidate.title} ({candidate.catalog_number || '?'})
                  </span>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {(candidate.match_score * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
