import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Calendar, Tag, Hash, Music } from "lucide-react";
import { AIScanResult } from "@/hooks/useAIScans";

interface AIScanDetailModalProps {
  scan: AIScanResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AIScanDetailModal = ({ scan, open, onOpenChange }: AIScanDetailModalProps) => {
  if (!scan) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "failed": return "bg-destructive text-destructive-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getMediaTypeColor = (mediaType: string) => {
    return mediaType === "vinyl" 
      ? "bg-primary text-primary-foreground" 
      : "bg-secondary text-secondary-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            AI Scan Details
            <Badge className={getStatusColor(scan.status)}>
              {scan.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Gallery */}
          {scan.photo_urls && scan.photo_urls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {scan.photo_urls.map((url, index) => (
                  <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={url} 
                      alt={`Scan ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(url, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Release Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{scan.artist || "Unknown Artist"}</span>
                  </div>
                  <div className="text-lg font-semibold">{scan.title || "Unknown Title"}</div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>{scan.label || "Unknown Label"}</span>
                  </div>
                  {scan.catalog_number && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span>{scan.catalog_number}</span>
                    </div>
                  )}
                  {scan.year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{scan.year}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Badge className={getMediaTypeColor(scan.media_type)}>
                  {scan.media_type.toUpperCase()}
                </Badge>
                <Badge variant="outline">{scan.condition_grade}</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Analysis Results</h3>
                {scan.confidence_score !== null && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Confidence Score</span>
                      <span>{Math.round((scan.confidence_score || 0) * 100)}%</span>
                    </div>
                    <Progress value={(scan.confidence_score || 0) * 100} />
                  </div>
                )}
              </div>

              {scan.discogs_url && (
                <div>
                  <h4 className="font-medium mb-2">Discogs Match</h4>
                  <Button variant="outline" size="sm" asChild>
                    <a href={scan.discogs_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Discogs
                    </a>
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Scanned: {new Date(scan.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* AI Description */}
          {scan.ai_description && (
            <div>
              <h3 className="text-lg font-semibold mb-3">AI Analysis</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm leading-relaxed">{scan.ai_description}</p>
              </div>
            </div>
          )}

          {/* Search Queries */}
          {scan.search_queries && scan.search_queries.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Search Queries Used</h3>
              <div className="flex flex-wrap gap-2">
                {scan.search_queries.map((query, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {query}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {scan.error_message && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Error Details</h3>
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                <p className="text-sm text-destructive">{scan.error_message}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};