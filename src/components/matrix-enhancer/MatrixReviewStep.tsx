import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Scan, ZoomIn, ZoomOut } from 'lucide-react';
import { MatrixBeforeAfterSlider } from './MatrixBeforeAfterSlider';
import { MatrixParameterControls } from './MatrixParameterControls';
import { MatrixEnhancementParams, DEFAULT_PARAMS, MatrixProcessingResult, QualityAssessment } from '@/utils/matrixEnhancementPipeline';
import { cn } from '@/lib/utils';

interface MatrixReviewStepProps {
  originalImage: string;
  result: MatrixProcessingResult;
  onReprocess: (params: MatrixEnhancementParams) => Promise<void>;
  onRunOCR: () => void;
  isProcessing?: boolean;
  className?: string;
}

export function MatrixReviewStep({
  originalImage,
  result,
  onReprocess,
  onRunOCR,
  isProcessing = false,
  className
}: MatrixReviewStepProps) {
  const [params, setParams] = useState<MatrixEnhancementParams>(result.params);
  const [selectedTab, setSelectedTab] = useState('compare');
  const [zoom, setZoom] = useState(1);
  const [hasChanges, setHasChanges] = useState(false);

  // Track if params have changed from current result
  useEffect(() => {
    const changed = JSON.stringify(params) !== JSON.stringify(result.params);
    setHasChanges(changed);
  }, [params, result.params]);

  // Debounced reprocess
  const handleParamsChange = useCallback((newParams: MatrixEnhancementParams) => {
    setParams(newParams);
  }, []);

  const handleReprocess = async () => {
    await onReprocess(params);
    setHasChanges(false);
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
  };

  const getQualityBadgeVariant = (score: QualityAssessment['score']) => {
    switch (score) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor': return 'destructive';
    }
  };

  const getQualityLabel = (score: QualityAssessment['score']) => {
    switch (score) {
      case 'excellent': return 'Uitstekend';
      case 'good': return 'Goed';
      case 'fair': return 'Matig';
      case 'poor': return 'Slecht';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Resultaat Bekijken</h2>
        <p className="text-muted-foreground">
          Vergelijk de verbetering en pas parameters aan indien nodig
        </p>
      </div>

      {/* Quality indicator */}
      <div className="flex items-center justify-center gap-4">
        <Badge variant={getQualityBadgeVariant(result.quality.score)}>
          Kwaliteit: {getQualityLabel(result.quality.score)}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {result.quality.feedback}
        </span>
        <Badge variant="outline">
          {result.processingTimeMs.toFixed(0)}ms
        </Badge>
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Preview area */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="compare">Vergelijken</TabsTrigger>
                    <TabsTrigger value="zoomed">🔍 Zoom Ring</TabsTrigger>
                    <TabsTrigger value="enhanced">Verbeterd</TabsTrigger>
                    <TabsTrigger value="ocr">OCR Laag</TabsTrigger>
                  </TabsList>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom(z => Math.max(1, z - 0.5))}
                      disabled={zoom <= 1}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-sm">{zoom}×</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setZoom(z => Math.min(4, z + 0.5))}
                      disabled={zoom >= 4}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <TabsContent value="compare" className="mt-0">
                  <MatrixBeforeAfterSlider
                    beforeImage={originalImage}
                    afterImage={result.enhancedPreview}
                    beforeLabel="Origineel"
                    afterLabel="Verbeterd"
                  />
                </TabsContent>

                <TabsContent value="zoomed" className="mt-0">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                      Ingezoomd op de matrix ring (2.5× vergroting)
                    </p>
                    <div 
                      className="aspect-square bg-muted rounded-lg overflow-auto"
                      style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
                    >
                      <img
                        src={result.zoomedRingEnhanced}
                        alt="Zoomed Matrix Ring"
                        className="w-full h-full object-contain transition-transform"
                        style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="enhanced" className="mt-0">
                  <div 
                    className="aspect-square bg-muted rounded-lg overflow-auto"
                    style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
                  >
                    <img
                      src={result.enhancedPreview}
                      alt="Verbeterd"
                      className="w-full h-full object-contain transition-transform"
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="ocr" className="mt-0">
                  <div 
                    className="aspect-square bg-white rounded-lg overflow-auto"
                    style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
                  >
                    <img
                      src={result.ocrLayer}
                      alt="OCR Laag"
                      className="w-full h-full object-contain transition-transform"
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* ROI info */}
              {result.roi && (
                <div className="mt-4 p-2 bg-muted rounded text-xs text-muted-foreground">
                  Ring detectie: {result.roi.detected ? '✓' : '✗'} | 
                  Methode: {result.roi.method} | 
                  Confidence: {(result.roi.confidence * 100).toFixed(0)}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <MatrixParameterControls
            params={params}
            onChange={handleParamsChange}
            onReset={handleReset}
            isProcessing={isProcessing}
          />

          {/* Action buttons */}
          <div className="space-y-2">
            {hasChanges && (
              <Button
                className="w-full gap-2"
                onClick={handleReprocess}
                disabled={isProcessing}
              >
                <RefreshCw className={cn('h-4 w-4', isProcessing && 'animate-spin')} />
                {isProcessing ? 'Verwerken...' : 'Opnieuw Verwerken'}
              </Button>
            )}

            <Button
              className="w-full gap-2"
              variant={hasChanges ? 'outline' : 'default'}
              onClick={onRunOCR}
              disabled={isProcessing}
            >
              <Scan className="h-4 w-4" />
              Matrix Codes Lezen
            </Button>
          </div>

          {/* Stats */}
          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Helderheid</span>
                <span>{(result.quality.brightness * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contrast</span>
                <span>{(result.quality.contrast * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scherpte</span>
                <span>{(result.quality.sharpness * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reflectie niveau</span>
                <span>{result.quality.reflectionLevel.toFixed(0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
