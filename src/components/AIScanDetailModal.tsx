import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Calendar, Tag, Hash, Music, Plus, Check, ShoppingCart } from "lucide-react";
import { AIScanResult } from "@/hooks/useAIScans";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AIScanDetailModalProps {
  scan: AIScanResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AIScanDetailModal = ({ scan, open, onOpenChange }: AIScanDetailModalProps) => {
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);
  const [addedToCollection, setAddedToCollection] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!scan) return null;

  const addToCollection = async () => {
    if (!user || !scan) return;

    setIsAddingToCollection(true);
    try {
      const collectionData = {
        user_id: user.id,
        artist: scan.artist,
        title: scan.title,
        label: scan.label,
        catalog_number: scan.catalog_number,
        year: scan.year,
        genre: scan.genre,
        country: scan.country,
        format: scan.format,
        style: scan.style,
        discogs_id: scan.discogs_id,
        discogs_url: scan.discogs_url,
        condition_grade: scan.condition_grade,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let insertedItemId = null;

      if (scan.media_type === 'cd') {
        // Add images to CD scan
        const cdData = {
          ...collectionData,
          front_image: scan.photo_urls?.[0] || null,
          back_image: scan.photo_urls?.[1] || null,
          barcode_image: scan.photo_urls?.[2] || null,
          matrix_image: scan.photo_urls?.[3] || null,
          matrix_number: scan.matrix_number,
          barcode: scan.barcode,
        };

        const { data: insertData, error } = await supabase
          .from('cd_scan')
          .insert(cdData)
          .select('id')
          .single();

        if (error) throw error;
        insertedItemId = insertData.id;
      } else if (scan.media_type === 'vinyl') {
        // Add images to vinyl scan
        const vinylData = {
          ...collectionData,
          catalog_image: scan.photo_urls?.[0] || null,
          matrix_image: scan.photo_urls?.[1] || null,
          additional_image: scan.photo_urls?.[2] || null,
          matrix_number: scan.matrix_number,
        };

        const { data: insertData, error } = await supabase
          .from('vinyl2_scan')
          .insert(vinylData)
          .select('id')
          .single();

        if (error) throw error;
        insertedItemId = insertData.id;
      }

      // Automatically fetch official artwork after successful insertion
      if (insertedItemId && (scan.discogs_url || (scan.artist && scan.title))) {
        try {
          console.log('🎨 Automatically fetching artwork for new collection item...');
          await supabase.functions.invoke('fetch-album-artwork', {
            body: {
              discogs_url: scan.discogs_url,
              artist: scan.artist,
              title: scan.title,
              media_type: scan.media_type,
              item_id: insertedItemId,
            }
          });
          console.log('✅ Automatic artwork fetch initiated');
        } catch (artworkError) {
          console.log('⚠️ Automatic artwork fetch failed:', artworkError);
          // Don't show error to user - artwork is optional
        }
      }

      setAddedToCollection(true);
      toast({
        title: "Toegevoegd aan collectie",
        description: `${scan.artist} - ${scan.title} is toegevoegd. Artwork wordt automatisch gezocht...`,
      });
    } catch (error) {
      console.error('Error adding to collection:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen aan je collectie.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCollection(false);
    }
  };

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
            Smart Scan Details
            <Badge className={getStatusColor(scan.status)}>
              {scan.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add to Collection Buttons */}
          {scan.status === 'completed' && user && (
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  const params = new URLSearchParams({
                    mediaType: scan.media_type,
                    discogsId: scan.discogs_id?.toString() || '',
                    artist: scan.artist || '',
                    title: scan.title || '',
                    label: scan.label || '',
                    catalogNumber: scan.catalog_number || '',
                    year: scan.year?.toString() || '',
                    condition: scan.condition_grade || '',
                    fromAiScan: 'true'
                  });
                  navigate(`/scanner/discogs?${params.toString()}`);
                }}
                variant="secondary" 
                className="flex-1"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Toevoegen aan Collectie
              </Button>
              <Button
                onClick={addToCollection}
                disabled={isAddingToCollection || addedToCollection}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
              >
                {addedToCollection ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Toegevoegd aan collectie
                  </>
                ) : isAddingToCollection ? (
                  "Toevoegen..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Direct opslaan
                  </>
                )}
              </Button>
            </div>
          )}

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
                <CardTitle className="text-lg">Analyse Resultaten</CardTitle>
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
                <CardTitle className="text-lg">Analyse Details</CardTitle>
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