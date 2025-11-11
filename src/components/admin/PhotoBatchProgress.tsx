import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Loader2, Image, Shirt, Palette } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BatchStatus {
  id: string;
  status: 'processing' | 'completed' | 'completed_with_errors' | 'failed';
  total_jobs: number;
  completed_jobs: number;
  current_job: string;
  results: {
    posters: Array<{ style: string; url: string; label: string; emoji: string }>;
    canvas: string | null;
    tshirt: {
      baseDesign: string;
      variants: Array<{ style: string; url: string }>;
    } | null;
    socks: string | null;
    errors: Array<{ job: string; error: string }>;
  } | null;
}

interface PhotoBatchProgressProps {
  batchStatus: BatchStatus | null;
  progress: number;
}

export const PhotoBatchProgress: React.FC<PhotoBatchProgressProps> = ({ 
  batchStatus, 
  progress 
}) => {
  if (!batchStatus) return null;

  const getStatusIcon = () => {
    switch (batchStatus.status) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'completed_with_errors':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusBadge = () => {
    switch (batchStatus.status) {
      case 'processing':
        return <Badge variant="default">Processing</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-success/20 text-success">Completed</Badge>;
      case 'completed_with_errors':
        return <Badge variant="secondary" className="bg-warning/20 text-warning">Completed with Errors</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle>Batch Processing Progress</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {batchStatus.current_job}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {batchStatus.completed_jobs} / {batchStatus.total_jobs} jobs completed
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Job Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Posters</span>
            </div>
            <p className="text-2xl font-bold">
              {batchStatus.results?.posters?.length || 0}/7
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Canvas</span>
            </div>
            <p className="text-2xl font-bold">
              {batchStatus.results?.canvas ? '1/1' : '0/1'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shirt className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">T-Shirt</span>
            </div>
            <p className="text-2xl font-bold">
              {batchStatus.results?.tshirt ? '1/1' : '0/1'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧦</span>
              <span className="text-sm font-medium">Socks</span>
            </div>
            <p className="text-2xl font-bold">
              {batchStatus.results?.socks ? '1/1' : '0/1'}
            </p>
          </div>
        </div>

        {/* Errors */}
        {batchStatus.results?.errors && batchStatus.results.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Errors Occurred</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {batchStatus.results.errors.map((error, index) => (
                  <li key={index} className="text-sm">
                    <strong>{error.job}:</strong> {error.error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Results Preview */}
        {batchStatus.status === 'completed' && batchStatus.results && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold">Generated Assets:</h4>
            
            {/* Poster Previews */}
            {batchStatus.results.posters.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  🎨 {batchStatus.results.posters.length} Poster Styles
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {batchStatus.results.posters.map((poster, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border">
                      <img 
                        src={poster.url} 
                        alt={poster.label}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Canvas Preview */}
            {batchStatus.results.canvas && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  🖼️ Canvas (Warm Grayscale)
                </p>
                <div className="w-32 h-32 rounded-lg overflow-hidden border">
                  <img 
                    src={batchStatus.results.canvas} 
                    alt="Canvas"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* T-shirt Previews */}
            {batchStatus.results.tshirt && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  👕 T-Shirt + {batchStatus.results.tshirt.variants.length} Variants
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="aspect-square rounded-lg overflow-hidden border">
                    <img 
                      src={batchStatus.results.tshirt.baseDesign} 
                      alt="Base T-shirt"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {batchStatus.results.tshirt.variants.slice(0, 3).map((variant, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border">
                      <img 
                        src={variant.url} 
                        alt={`Variant ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Socks Preview */}
            {batchStatus.results.socks && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  🧦 Socks (Pop Art)
                </p>
                <div className="w-32 h-32 rounded-lg overflow-hidden border">
                  <img 
                    src={batchStatus.results.socks} 
                    alt="Socks"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
