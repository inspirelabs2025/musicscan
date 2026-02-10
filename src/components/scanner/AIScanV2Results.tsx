import React, { Component, ErrorInfo, ReactNode, useMemo } from 'react';
import { CheckCircle, Info, Camera, Eye, Euro, TrendingUp, TrendingDown, Loader2, RefreshCw, ShoppingCart, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExtractionFields } from '@/components/scan-pipeline/ExtractionFields';
import type { ScanExtraction } from '@/hooks/useCDScanPipeline';

// Error boundary to prevent silent crashes
class ResultsErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AIScanV2Results crash:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Resultaten konden niet worden weergegeven: {this.state.error?.message}
          </AlertDescription>
        </Alert>
      );
    }
    return this.props.children;
  }
}

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

interface PricingStats {
  lowest_price: number | null;
  median_price: number | null;
  highest_price: number | null;
  num_for_sale: number;
  currency: string;
  blocked?: boolean;
  blocked_reason?: string;
}

interface Suggestion {
  id: number;
  title: string;
  catno?: string;
  year?: number;
  country?: string;
  url?: string;
}

interface AuditEntry {
  step: string;
  detail: string;
  timestamp: string;
}

interface PhotoGuidanceItem {
  field: string;
  instruction: string;
}

interface AnalysisResultData {
  scanId: string;
  result: {
    discogs_id: number | null;
    discogs_url: string | null;
    artist: string | null;
    title: string | null;
    label: string | null;
    catalog_number: string | null;
    year: number | null;
    confidence_score: number;
    ai_description: string;
    image_quality?: string;
    matrix_number?: string | null;
    sid_code_mastering?: string | null;
    sid_code_mould?: string | null;
    label_code?: string | null;
    barcode?: string | null;
    genre?: string | null;
    country?: string | null;
    pricing_stats?: PricingStats | null;
    match_status?: string;
    missing_fields?: string[];
    photo_guidance?: PhotoGuidanceItem[];
    collector_audit?: AuditEntry[];
    suggestions?: Suggestion[];
    search_metadata?: any;
  };
  version: string;
}

interface AIScanV2ResultsProps {
  analysisResult: AnalysisResultData;
  uploadedFiles: UploadedFile[];
  mediaType: string;
  conditionGrade: string;
  isPricingLoading: boolean;
  searchResults: any[];
  onReset: () => void;
  onRetryPricing: (discogsId: number) => void;
  onSearchByDiscogsId: (id: string) => void;
}

const formatPrice = (val: string | number | null | undefined): string => {
  if (val == null) return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? '-' : num.toFixed(2);
};

const fieldEmoji: Record<string, string> = {
  matrix: '💿',
  ifpi: '🔍',
  barcode: '📊',
  catno: '🏷️',
};

function buildExtractions(
  result: AnalysisResultData['result'],
  audit: AuditEntry[] | undefined
): ScanExtraction[] {
  const auditSteps = audit || [];
  
  const getAuditStatus = (field: string): 'verified' | 'rejected' | 'unverified' => {
    for (const entry of auditSteps) {
      const step = entry.step.toLowerCase();
      const detail = entry.detail.toLowerCase();
      if (step.includes(field) || detail.includes(field)) {
        if (step.includes('rejected') || step.includes('invalid')) return 'rejected';
        if (step.includes('match') || step.includes('verified') || step.includes('lock')) return 'verified';
      }
    }
    return 'unverified';
  };

  const getConfidence = (value: any, field: string): number => {
    if (!value) return 0;
    const status = getAuditStatus(field);
    if (status === 'verified') return 1.0;
    if (status === 'rejected') return 0.3;
    return 0.8;
  };

  const fields: { field: string; key: string; value: any }[] = [
    { field: 'barcode', key: 'barcode', value: result.barcode },
    { field: 'catno', key: 'catno', value: result.catalog_number },
    { field: 'matrix', key: 'matrix', value: result.matrix_number },
    { field: 'ifpi_master', key: 'ifpi_master', value: result.sid_code_mastering },
    { field: 'ifpi_mould', key: 'ifpi_mould', value: result.sid_code_mould },
    { field: 'label_code', key: 'label_code', value: result.label_code },
    { field: 'label', key: 'label', value: result.label },
    { field: 'country', key: 'country', value: result.country },
    { field: 'year_hint', key: 'year', value: result.year?.toString() || null },
    { field: 'genre', key: 'genre', value: result.genre },
  ];

  return fields.map(({ field, key, value }) => ({
    field,
    raw: value || null,
    normalized: value || null,
    confidence: getConfidence(value, key),
    source: value ? 'ocr' : null,
  }));
}

export function AIScanV2Results({
  analysisResult,
  uploadedFiles,
  mediaType,
  conditionGrade,
  isPricingLoading,
  searchResults,
  onReset,
  onRetryPricing,
  onSearchByDiscogsId,
}: AIScanV2ResultsProps) {
  const navigate = useNavigate();
  const { result } = analysisResult;
  const pricing = result.pricing_stats || searchResults[0]?.pricing_stats;

  const extractions = useMemo(
    () => buildExtractions(result, result.collector_audit),
    [result]
  );

  const navigateToDiscogs = (discogsId: string, artist: string, title: string, label: string, catalogNumber: string, year: string) => {
    const params = new URLSearchParams({
      mediaType,
      discogsId,
      artist,
      title,
      label,
      catalogNumber,
      year,
      condition: conditionGrade,
      fromAiScan: 'true',
    });
    navigate(`/scanner/discogs?${params.toString()}`);
  };

  return (
    <ResultsErrorBoundary>
    <TooltipProvider>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            V2 Analyse Resultaat
            <Badge variant="outline">{analysisResult.version}</Badge>
            {result.match_status && result.match_status !== 'single_match' && (
              <Badge variant={result.match_status === 'needs_more_photos' ? 'secondary' : 'destructive'}>
                {result.match_status === 'needs_more_photos' ? "📸 Meer foto's nodig" :
                 result.match_status === 'multiple_candidates' ? '🔍 Meerdere mogelijkheden' :
                 result.match_status === 'no_match' ? '❌ Geen match' : result.match_status}
              </Badge>
            )}
          </CardTitle>
        </div>
        <Button onClick={onReset} variant="outline">Nieuwe Analyse</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="font-medium">Vertrouwen Score:</span>
          <Badge variant={result.confidence_score > 0.8 ? 'default' : result.confidence_score > 0.5 ? 'secondary' : 'destructive'}>
            {Math.round(result.confidence_score * 100)}%
          </Badge>
        </div>

        {/* Extracted Fields */}
        <ExtractionFields extractions={extractions} />

        {/* Uploaded photos */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Geüploade foto's
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="relative rounded-lg overflow-hidden border">
                  <img src={file.preview} alt={file.file.name} className="w-full h-32 object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Release Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Release Informatie</h3>
            <div className="space-y-1 text-sm">
              <div><strong>Artiest:</strong> {result.artist || 'Niet gevonden'}</div>
              <div><strong>Titel:</strong> {result.title || 'Niet gevonden'}</div>
              <div><strong>Label:</strong> {result.label || 'Niet gevonden'}</div>
              <div><strong>Catalog Nr:</strong> {result.catalog_number || 'Niet gevonden'}</div>
              <div><strong>Jaar:</strong> {result.year || 'Niet gevonden'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              Technische Details
              <Tooltip>
                <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Matrix nummer: gegraveerd in de binnenste ring van de CD. Foto de disc onder een hoek voor beste resultaat.</p>
                </TooltipContent>
              </Tooltip>
            </h3>
            <div className="space-y-1 text-sm">
              {result.matrix_number && <div><strong>Matrix Nr:</strong> {result.matrix_number}</div>}
              {result.sid_code_mastering && <div><strong>IFPI Mastering:</strong> {result.sid_code_mastering}</div>}
              {result.sid_code_mould && <div><strong>IFPI Mould:</strong> {result.sid_code_mould}</div>}
              {result.label_code && <div><strong>Label Code:</strong> {result.label_code}</div>}
              {result.barcode && <div><strong>Barcode:</strong> {result.barcode}</div>}
              {result.genre && <div><strong>Genre:</strong> {result.genre}</div>}
              {result.country && <div><strong>Land:</strong> {result.country}</div>}
              {result.image_quality && <div><strong>Beeld kwaliteit:</strong> {result.image_quality}</div>}
              <div><strong>Scan ID:</strong> {analysisResult.scanId}</div>
              {result.discogs_id && <div><strong>Discogs ID:</strong> {result.discogs_id}</div>}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <PricingSection
          pricing={pricing}
          isPricingLoading={isPricingLoading}
          discogsId={result.discogs_id}
          onRetryPricing={onRetryPricing}
          onSearchByDiscogsId={onSearchByDiscogsId}
        />

        {/* Action Buttons */}
        {result.discogs_url && (
          <div className="pt-4 space-y-3">
            <Button
              onClick={() => navigateToDiscogs(
                result.discogs_id?.toString() || '',
                result.artist || '',
                result.title || '',
                result.label || '',
                result.catalog_number || '',
                result.year?.toString() || ''
              )}
              className="w-full"
              disabled={!conditionGrade}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Toevoegen aan Collectie
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href={result.discogs_url} target="_blank" rel="noopener noreferrer">Bekijk op Discogs</a>
            </Button>
          </div>
        )}

        {/* Photo Guidance */}
        {result.photo_guidance && result.photo_guidance.length > 0 && (
          <div className="pt-4 border-t">
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Camera className="h-4 w-4" />
                Volgende beste foto's
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                De volgende velden zijn niet gedetecteerd. Betere foto's kunnen de match verbeteren:
              </p>
              <div className="space-y-2">
                {result.photo_guidance.map((g) => (
                  <div key={g.field} className="flex gap-2 rounded-md bg-white/60 dark:bg-white/5 p-2.5 text-sm">
                    <span className="text-lg shrink-0">{fieldEmoji[g.field] || '📷'}</span>
                    <div>
                      <div className="font-medium text-amber-900 dark:text-amber-200 capitalize">
                        {g.field === 'ifpi' ? 'IFPI codes' : g.field === 'catno' ? 'Catalogusnummer' : g.field}
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{g.instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions && result.suggestions.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              🔍 Mogelijke releases ({result.suggestions.length})
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Selecteer de juiste release om deze toe te voegen aan je collectie.
            </p>
            <div className="space-y-2">
              {result.suggestions.map((s, i) => (
                <div key={s.id} className="rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                        <span className="font-medium truncate">{s.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1 text-xs text-muted-foreground">
                        {s.catno && <span>{s.catno}</span>}
                        {s.year && <span>· {s.year}</span>}
                        {s.country && <span>· {s.country}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {s.url && (
                        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                          <a href={s.url} target="_blank" rel="noopener noreferrer">Bekijk</a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          let sugArtist = '';
                          let sugTitle = s.title || '';
                          if (sugTitle.includes(' - ')) {
                            const parts = sugTitle.split(' - ');
                            sugArtist = parts[0].replace(/\s*\(\d+\)\s*$/, '').trim();
                            sugTitle = parts.slice(1).join(' - ').trim();
                          }
                          navigateToDiscogs(
                            s.id?.toString() || '',
                            sugArtist || result.artist || '',
                            sugTitle || result.title || '',
                            result.label || '',
                            s.catno || '',
                            s.year?.toString() || ''
                          );
                        }}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Selecteer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Protocol Details */}
        {result.search_metadata && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2 mb-3">
              {result.search_metadata.lock_reason && (
                <Badge variant="default" className="bg-green-600">🔒 {result.search_metadata.lock_reason}</Badge>
              )}
              {result.search_metadata.verification_level && (
                <Badge variant="outline">
                  {result.search_metadata.verification_level === 'LOCKED' ? '✅ Geverifieerd' :
                   result.search_metadata.verification_level === 'no_match' ? '❌ Geen match' :
                   result.search_metadata.verification_level}
                </Badge>
              )}
              {result.search_metadata.total_searches > 0 && (
                <Badge variant="secondary">{result.search_metadata.total_searches} zoekopdrachten</Badge>
              )}
              {result.search_metadata.matched_on?.length > 0 && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Match: {result.search_metadata.matched_on.join(', ')}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Collector Audit Log */}
        {result.collector_audit && result.collector_audit.length > 0 && (
          <div className="pt-4 border-t">
            <details className="group">
              <summary className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                <Info className="h-4 w-4" />
                Audit log — Waarom denken wij dit ({result.collector_audit.length} stappen)
              </summary>
              <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                {result.collector_audit.map((entry, i) => {
                  const stepColor = entry.step.includes('rejected') ? 'text-red-600' :
                    entry.step.includes('match') || entry.step.includes('valid') ? 'text-green-600' :
                    entry.step.includes('cap') || entry.step.includes('unverified') ? 'text-amber-600' : 'text-muted-foreground';
                  return (
                    <div key={i} className="flex gap-2 text-xs font-mono">
                      <span className={`shrink-0 font-semibold ${stepColor}`}>[{entry.step}]</span>
                      <span className="text-foreground/80 break-all">{entry.detail}</span>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        {/* AI Description */}
        {result.ai_description && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">V2 AI Analyse</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.ai_description}</p>
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
    </ResultsErrorBoundary>
  );
}

// Extracted pricing sub-component
function PricingSection({
  pricing,
  isPricingLoading,
  discogsId,
  onRetryPricing,
  onSearchByDiscogsId,
}: {
  pricing: PricingStats | null | undefined;
  isPricingLoading: boolean;
  discogsId: number | null;
  onRetryPricing: (id: number) => void;
  onSearchByDiscogsId: (id: string) => void;
}) {
  const isBlocked = pricing && 'blocked' in pricing && pricing.blocked;
  const blockedReason = pricing && 'blocked_reason' in pricing ? pricing.blocked_reason : null;

  return (
    <div className="pt-4 border-t">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Euro className="h-4 w-4" />
        Marktprijzen
      </h3>

      {isPricingLoading && (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Prijzen laden...
        </div>
      )}

      {!isPricingLoading && isBlocked && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="font-medium text-red-800 dark:text-red-200">Verkoop geblokkeerd</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {(blockedReason as string) || 'Deze release is geblokkeerd voor verkoop op Discogs.'}
          </p>
        </div>
      )}

      {!isPricingLoading && !isBlocked && pricing && (pricing.lowest_price || pricing.median_price || pricing.highest_price) && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
              <TrendingDown className="h-4 w-4 mx-auto text-green-600 mb-1" />
              <p className="text-xs text-muted-foreground">Laagste</p>
              <p className="font-bold text-green-600">€{formatPrice(pricing.lowest_price)}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
              <TrendingUp className="h-4 w-4 mx-auto text-blue-600 mb-1" />
              <p className="text-xs text-muted-foreground">Mediaan</p>
              <p className="font-bold text-blue-600">€{formatPrice(pricing.median_price)}</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg text-center">
              <TrendingUp className="h-4 w-4 mx-auto text-orange-600 mb-1" />
              <p className="text-xs text-muted-foreground">Hoogste</p>
              <p className="font-bold text-orange-600">€{formatPrice(pricing.highest_price)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{pricing.num_for_sale || 0} te koop</span>
            <Button variant="ghost" size="sm" onClick={() => discogsId && onRetryPricing(discogsId)} className="h-7 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Vernieuw
            </Button>
          </div>
        </div>
      )}

      {!isPricingLoading && !isBlocked && !(pricing && (pricing.lowest_price || pricing.median_price || pricing.highest_price)) && discogsId && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
            <Info className="h-5 w-5" />
            <span className="font-medium">Geen prijsdata beschikbaar</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-500">Dit item is nog nooit verkocht op Discogs of er zijn geen actieve aanbiedingen.</p>
          <Button variant="outline" size="sm" onClick={() => onSearchByDiscogsId(discogsId.toString())} className="mt-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Opnieuw proberen
          </Button>
        </div>
      )}

      {!isPricingLoading && !discogsId && (
        <div className="rounded-lg border border-muted bg-muted/30 p-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Info className="h-5 w-5" />
            <span className="font-medium">Geen Discogs ID gevonden</span>
          </div>
          <p className="text-xs text-muted-foreground">Prijsinformatie is niet beschikbaar zonder Discogs-koppeling.</p>
        </div>
      )}
    </div>
  );
}
