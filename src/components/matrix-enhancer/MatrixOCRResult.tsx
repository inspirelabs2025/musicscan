import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, Check, RefreshCw, Save, ArrowLeft, 
  ExternalLink, AlertCircle, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface OCRSegment {
  text: string;
  type: 'matrix' | 'ifpi' | 'other';
  confidence: number;
}

export interface OCRResult {
  rawText: string;
  cleanText: string;
  segments: OCRSegment[];
  overallConfidence: number;
  layerUsed: 'normal' | 'inverted';
  processingTimeMs: number;
}

interface MatrixOCRResultProps {
  result: OCRResult;
  enhancedImage: string;
  ocrLayerImage: string;
  onRetry: () => void;
  onSave: () => void;
  onBack: () => void;
  isProcessing?: boolean;
  isSaving?: boolean;
  className?: string;
}

export function MatrixOCRResult({
  result,
  enhancedImage,
  ocrLayerImage,
  onRetry,
  onSave,
  onBack,
  isProcessing = false,
  isSaving = false,
  className
}: MatrixOCRResultProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: 'Gekopieerd!',
      description: `${fieldName} is naar je klembord gekopieerd`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Hoog';
    if (confidence >= 0.5) return 'Gemiddeld';
    return 'Laag';
  };

  const getSegmentTypeLabel = (type: OCRSegment['type']) => {
    switch (type) {
      case 'matrix': return 'Matrix Nummer';
      case 'ifpi': return 'IFPI Code';
      case 'other': return 'Extra Info';
      default: return 'Extra Info';
    }
  };

  const getSegmentTypeBadgeClass = (type: OCRSegment['type']) => {
    switch (type) {
      case 'matrix': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'ifpi': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'other': return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">OCR Resultaat</h2>
        <p className="text-muted-foreground">
          Geëxtraheerde matrix codes uit de CD
        </p>
      </div>

      {/* Confidence indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Betrouwbaarheid</span>
            <span className={cn('font-bold', getConfidenceColor(result.overallConfidence))}>
              {(result.overallConfidence * 100).toFixed(0)}% ({getConfidenceLabel(result.overallConfidence)})
            </span>
          </div>
          <Progress 
            value={result.overallConfidence * 100} 
            className="h-2"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Laag (0%)</span>
            <span>Verwerkt in {result.processingTimeMs.toFixed(0)}ms | Laag: {result.layerUsed}</span>
            <span>Hoog (100%)</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Results */}
        <div className="space-y-4">
          {/* Segments */}
          {result.segments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Gedetecteerde Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.segments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getSegmentTypeBadgeClass(segment.type)}>
                          {getSegmentTypeLabel(segment.type)}
                        </Badge>
                        <span className={cn('text-xs', getConfidenceColor(segment.confidence))}>
                          {(segment.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="font-mono text-lg">{segment.text}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(segment.text, segment.type)}
                    >
                      {copiedField === segment.type ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Raw and clean text */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Volledige Tekst</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="clean">
                <TabsList className="w-full">
                  <TabsTrigger value="clean" className="flex-1">Opgeschoond</TabsTrigger>
                  <TabsTrigger value="raw" className="flex-1">Origineel</TabsTrigger>
                </TabsList>

                <TabsContent value="clean" className="mt-4">
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap break-all min-h-[100px]">
                      {result.cleanText || '(geen tekst gedetecteerd)'}
                    </pre>
                    {result.cleanText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(result.cleanText, 'Opgeschoonde tekst')}
                      >
                        {copiedField === 'Opgeschoonde tekst' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="raw" className="mt-4">
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap break-all min-h-[100px] opacity-70">
                      {result.rawText || '(geen tekst gedetecteerd)'}
                    </pre>
                    {result.rawText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(result.rawText, 'Originele tekst')}
                      >
                        {copiedField === 'Originele tekst' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Low confidence warning */}
          {result.overallConfidence < 0.5 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-yellow-600">Lage betrouwbaarheid</p>
                  <p className="text-sm text-muted-foreground">
                    De OCR resultaten kunnen onnauwkeurig zijn. 
                    Probeer een betere foto te maken of pas de parameters aan.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview images */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Gebruikte Afbeelding</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="enhanced">
                <TabsList className="w-full">
                  <TabsTrigger value="enhanced" className="flex-1">Verbeterd</TabsTrigger>
                  <TabsTrigger value="ocr" className="flex-1">OCR Laag</TabsTrigger>
                </TabsList>

                <TabsContent value="enhanced" className="mt-4">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={enhancedImage}
                      alt="Verbeterde afbeelding"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="ocr" className="mt-4">
                  <div className="aspect-square bg-white rounded-lg overflow-hidden">
                    <img
                      src={ocrLayerImage}
                      alt="OCR laag"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Discogs lookup */}
          {result.segments.some(s => s.type === 'matrix') && (
            <Card>
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    const matrix = result.segments.find(s => s.type === 'matrix');
                    if (matrix) {
                      window.open(`https://www.discogs.com/search/?q=${encodeURIComponent(matrix.text)}&type=release`, '_blank');
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Zoek op Discogs
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing || isSaving}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar Review
        </Button>

        <Button
          variant="outline"
          onClick={onRetry}
          disabled={isProcessing || isSaving}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', isProcessing && 'animate-spin')} />
          {isProcessing ? 'Opnieuw proberen...' : 'Opnieuw OCR'}
        </Button>

        <Button
          onClick={onSave}
          disabled={isProcessing || isSaving}
          className="gap-2"
        >
          <Save className={cn('h-4 w-4', isSaving && 'animate-pulse')} />
          {isSaving ? 'Opslaan...' : 'Resultaat Opslaan'}
        </Button>
      </div>
    </div>
  );
}
