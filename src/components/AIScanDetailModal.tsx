
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card-dark text-card-dark-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-card-dark-foreground">
            AI Scan Details
            <Badge className={getStatusColor(scan.status)}>
              {scan.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Gallery */}
          {scan.photo_urls && scan.photo_urls.length > 0 && (
            <Card variant="dark">
              <CardHeader>
                <CardTitle className="text-lg">Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {scan.photo_urls.map((url, index) => (
                    <div key={index} className="aspect-square bg-muted/20 rounded-lg overflow-hidden border border-muted">
                      <img 
                        src={url} 
                        alt={`Scan ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(url, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="dark">
              <CardHeader>
                <CardTitle className="text-lg">Release Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-card-dark-foreground/70" />
                    <span className="font-medium text-card-dark-foreground">{scan.artist || "Unknown Artist"}</span>
                  </div>
                  <div className="text-lg font-semibold text-card-dark-foreground">{scan.title || "Unknown Title"}</div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-card-dark-foreground/70" />
                    <span className="text-card-dark-foreground">{scan.label || "Unknown Label"}</span>
                  </div>
                  {scan.catalog_number && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-card-dark-foreground/70" />
                      <span className="text-card-dark-foreground">{scan.catalog_number}</span>
                    </div>
                  )}
                  {scan.year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-card-dark-foreground/70" />
                      <span className="text-card-dark-foreground">{scan.year}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Badge className={getMediaTypeColor(scan.media_type)}>
                    {scan.media_type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="border-card-dark-foreground/20 text-card-dark-foreground">
                    {scan.condition_grade}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card variant="purple">
              <CardHeader>
                <CardTitle className="text-lg">Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scan.confidence_score !== null && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-card-purple-foreground">
                      <span>Confidence Score</span>
                      <span>{Math.round((scan.confidence_score || 0) * 100)}%</span>
                    </div>
                    <Progress value={(scan.confidence_score || 0) * 100} />
                  </div>
                )}

                {scan.discogs_url && (
                  <div>
                    <h4 className="font-medium mb-2 text-card-purple-foreground">Discogs Match</h4>
                    <Button variant="outline" size="sm" asChild className="border-card-purple-foreground/20 text-card-purple-foreground hover:bg-card-purple-foreground/10">
                      <a href={scan.discogs_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Discogs
                      </a>
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-card-purple-foreground/70">
                  <Calendar className="h-4 w-4" />
                  <span>Scanned: {new Date(scan.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Description */}
          {scan.ai_description && (
            <Card variant="dark">
              <CardHeader>
                <CardTitle className="text-lg">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/20 p-4 rounded-lg border border-muted/30">
                  <p className="text-sm leading-relaxed text-card-dark-foreground">{scan.ai_description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Queries */}
          {scan.search_queries && scan.search_queries.length > 0 && (
            <Card variant="purple">
              <CardHeader>
                <CardTitle className="text-lg">Search Queries Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {scan.search_queries.map((query, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-card-purple-foreground/20 text-card-purple-foreground">
                      {query}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {scan.error_message && (
            <Card variant="dark">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Error Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                  <p className="text-sm text-destructive">{scan.error_message}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
