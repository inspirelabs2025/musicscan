import React from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

interface MatrixProcessingStepProps {
  originalImage: string;
  progress: number;
  steps: ProcessingStep[];
  error?: string | null;
  className?: string;
}

export function MatrixProcessingStep({
  originalImage,
  progress,
  steps,
  error,
  className
}: MatrixProcessingStepProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Afbeelding Verwerken</h2>
        <p className="text-muted-foreground">
          We analyseren en verbeteren de foto voor optimale OCR
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Preview */}
        <Card>
          <CardContent className="p-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={originalImage}
                alt="Origineel"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Originele afbeelding
            </p>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Voortgang</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps list */}
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg transition-colors',
                    step.status === 'processing' && 'bg-muted',
                    step.status === 'complete' && 'opacity-60',
                    step.status === 'error' && 'bg-destructive/10'
                  )}
                >
                  {step.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  {step.status === 'processing' && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {step.status === 'complete' && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {step.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  <span className={cn(
                    'text-sm',
                    step.status === 'processing' && 'font-medium',
                    step.status === 'error' && 'text-destructive'
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Info */}
            {!error && progress < 100 && (
              <p className="text-xs text-muted-foreground text-center">
                Dit duurt meestal 2-5 seconden
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Default processing steps
export const DEFAULT_PROCESSING_STEPS: ProcessingStep[] = [
  { id: 'load', label: 'Afbeelding laden', status: 'pending' },
  { id: 'grayscale', label: 'Converteren naar grijswaarden', status: 'pending' },
  { id: 'highlight', label: 'Reflecties onderdrukken', status: 'pending' },
  { id: 'clahe', label: 'Lokaal contrast verbeteren', status: 'pending' },
  { id: 'denoise', label: 'Ruis verwijderen', status: 'pending' },
  { id: 'sharpen', label: 'Verscherpen', status: 'pending' },
  { id: 'gradient', label: 'Belichting normaliseren', status: 'pending' },
  { id: 'threshold', label: 'OCR laag genereren', status: 'pending' },
];
