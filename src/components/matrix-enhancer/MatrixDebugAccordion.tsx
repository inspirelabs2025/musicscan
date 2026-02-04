import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug, Clock, Settings, Target, FileJson } from 'lucide-react';
import { MatrixEnhancementParams, RingDetectionResult, QualityAssessment } from '@/utils/matrixEnhancementPipeline';
import { OCRResult } from './MatrixOCRResult';
import { cn } from '@/lib/utils';

interface MatrixDebugAccordionProps {
  params: MatrixEnhancementParams;
  roi: RingDetectionResult | null;
  quality: QualityAssessment;
  ocrResult?: OCRResult | null;
  timings: {
    enhancement?: number;
    ocr?: number;
    total?: number;
  };
  className?: string;
}

export function MatrixDebugAccordion({
  params,
  roi,
  quality,
  ocrResult,
  timings,
  className
}: MatrixDebugAccordionProps) {
  return (
    <Card className={cn('mt-6', className)}>
      <Accordion type="single" collapsible>
        <AccordionItem value="debug" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bug className="h-4 w-4" />
              <span className="text-sm font-medium">Debug Informatie</span>
              <Badge variant="outline" className="ml-2">
                Dev
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="pt-0 space-y-4">
              {/* Timings */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Timing
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground text-xs">Enhancement</p>
                    <p className="font-mono">{timings.enhancement?.toFixed(0) || '-'}ms</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground text-xs">OCR</p>
                    <p className="font-mono">{timings.ocr?.toFixed(0) || '-'}ms</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground text-xs">Totaal</p>
                    <p className="font-mono">{timings.total?.toFixed(0) || '-'}ms</p>
                  </div>
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Parameters
                </h4>
                <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                  {JSON.stringify(params, null, 2)}
                </pre>
              </div>

              {/* ROI Detection */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Ring Detectie (ROI)
                </h4>
                {roi ? (
                  <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                    {JSON.stringify(roi, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                    Geen ROI gedetecteerd
                  </p>
                )}
              </div>

              {/* Quality Assessment */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-muted-foreground" />
                  Kwaliteit Assessment
                </h4>
                <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                  {JSON.stringify(quality, null, 2)}
                </pre>
              </div>

              {/* OCR Result */}
              {ocrResult && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-muted-foreground" />
                    OCR Response
                  </h4>
                  <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto max-h-[300px]">
                    {JSON.stringify(ocrResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
