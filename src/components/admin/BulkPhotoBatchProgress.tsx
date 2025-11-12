import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BulkBatchStatus } from '@/hooks/useBulkPhotoBatchProcessor';
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface BulkPhotoBatchProgressProps {
  batchStatus: BulkBatchStatus;
}

export const BulkPhotoBatchProgress = ({ batchStatus }: BulkPhotoBatchProgressProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'processing':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Batch Processing Progress
        </CardTitle>
        <CardDescription>
          {batchStatus.completedPhotos} of {batchStatus.totalPhotos} photos completed
          {batchStatus.failedPhotos > 0 && ` • ${batchStatus.failedPhotos} failed`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {batchStatus.overallProgress}%
            </span>
          </div>
          <Progress value={batchStatus.overallProgress} className="h-3" />
        </div>

        {/* Photo List */}
        <div className="space-y-3">
          {batchStatus.photos.map((photo, index) => (
            <Collapsible key={photo.id}>
              <div className={`border rounded-lg p-4 ${getStatusColor(photo.status)}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(photo.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          Photo {index + 1}: {photo.metadata.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {photo.metadata.artist}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {photo.status.toUpperCase()}
                      </Badge>
                    </div>

                    {photo.status === 'processing' && (
                      <div className="mt-2">
                        <Progress value={undefined} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Generating products...
                        </p>
                      </div>
                    )}

                    {photo.status === 'completed' && photo.results && (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="mt-2 h-auto py-1">
                          <ChevronDown className="w-4 h-4 mr-1" />
                          View results
                        </Button>
                      </CollapsibleTrigger>
                    )}

                    {photo.status === 'failed' && photo.error && (
                      <p className="text-xs text-destructive mt-2">
                        Error: {photo.error}
                      </p>
                    )}
                  </div>

                  {/* Photo Preview */}
                  <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted">
                    <img
                      src={photo.url}
                      alt={photo.metadata.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Expandable Results */}
                {photo.status === 'completed' && photo.results && (
                  <CollapsibleContent className="mt-3 pt-3 border-t border-border/50">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {photo.results.posterCount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Posters:</span>
                          <span className="font-medium">{photo.results.posterCount}</span>
                        </div>
                      )}
                      {photo.results.canvasCount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Canvas:</span>
                          <span className="font-medium">{photo.results.canvasCount}</span>
                        </div>
                      )}
                      {photo.results.tshirtCount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">T-shirts:</span>
                          <span className="font-medium">{photo.results.tshirtCount}</span>
                        </div>
                      )}
                      {photo.results.sockCount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Socks:</span>
                          <span className="font-medium">{photo.results.sockCount}</span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                )}
              </div>
            </Collapsible>
          ))}
        </div>

        {/* Summary */}
        {batchStatus.status === 'completed' && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-success">
              ✅ Batch processing completed successfully!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total products generated: ~{batchStatus.completedPhotos * 10}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
