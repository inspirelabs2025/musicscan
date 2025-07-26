import { useParams, useNavigate } from "react-router-dom";
import { useAlbumDetail } from "@/hooks/useAlbumDetail";
import { useAlbumInsights } from "@/hooks/useAlbumInsights";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlbumInsightsSection } from "@/components/AlbumInsightsSection";
import { ArrowLeft, ExternalLink, Calendar, Tag, Music2, Disc3, Brain, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { album, isLoading, error } = useAlbumDetail(albumId!);
  const { insights, isLoading: insightsLoading, generateInsights } = useAlbumInsights();
  const [imageError, setImageError] = useState(false);

  // Auto-generate insights when album loads
  useEffect(() => {
    if (albumId && album && !insights && !insightsLoading) {
      generateInsights(albumId);
    }
  }, [albumId, album, insights, insightsLoading, generateInsights]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vinyl-purple/5 via-transparent to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <Skeleton className="h-8 w-32" />
            <div className="grid md:grid-cols-2 gap-8">
              <Skeleton className="aspect-square w-full" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vinyl-purple/5 via-transparent to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug
            </Button>
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Album niet gevonden</h1>
              <p className="text-muted-foreground">
                Het album dat je zoekt bestaat niet of is niet toegankelijk.
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced image fallback logic
  const getImageUrl = () => {
    if (album.media_type === 'cd') {
      return album.front_image || album.back_image || album.barcode_image || album.matrix_image;
    } else {
      return album.catalog_image || album.matrix_image || album.additional_image;
    }
  };

  const imageUrl = getImageUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-vinyl-purple/5 via-transparent to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Navigation */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-accent/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar collectie
          </Button>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Album Art */}
            <div className="space-y-4">
              <Card className="overflow-hidden bg-gradient-to-br from-card/50 to-background/80 backdrop-blur-sm">
                <div className="aspect-square relative bg-gradient-to-br from-muted/30 to-background/50">
                  {imageUrl && !imageError ? (
                    <img
                      src={imageUrl}
                      alt={`${album.artist} - ${album.title}`}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {album.media_type === 'cd' ? (
                        <Disc3 className="w-24 h-24 text-muted-foreground/30" />
                      ) : (
                        <Music2 className="w-24 h-24 text-muted-foreground/30" />
                      )}
                    </div>
                  )}
                </div>
              </Card>
              
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {album.media_type.toUpperCase()}
                </Badge>
                {album.is_public && (
                  <Badge variant="outline" className="bg-primary/10">
                    Publiek zichtbaar
                  </Badge>
                )}
                {album.is_for_sale && (
                  <Badge variant="default">
                    Te koop
                  </Badge>
                )}
                {album.condition_grade && (
                  <Badge variant="outline">
                    {album.condition_grade}
                  </Badge>
                )}
              </div>
            </div>

            {/* Album Information */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {album.title || "Onbekende titel"}
                </h1>
                <h2 className="text-xl text-muted-foreground mb-4">
                  {album.artist || "Onbekende artiest"}
                </h2>
                
                {album.marketplace_price && (
                  <div className="text-2xl font-bold text-primary mb-4">
                    {album.currency}{album.marketplace_price}
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-4">
                {album.label && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Label:</span>
                    <span className="font-medium">{album.label}</span>
                  </div>
                )}
                
                {album.year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Jaar:</span>
                    <span className="font-medium">{album.year}</span>
                  </div>
                )}
                
                {album.catalog_number && (
                  <div className="flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Catalogusnummer:</span>
                    <span className="font-medium">{album.catalog_number}</span>
                  </div>
                )}
                
                {album.genre && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Genre:</span>
                    <span className="font-medium">{album.genre}</span>
                  </div>
                )}
                
                {album.country && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Land:</span>
                    <span className="font-medium">{album.country}</span>
                  </div>
                )}
              </div>

              {/* Shop Description */}
              {album.shop_description && (
                <Card className="p-4 bg-accent/20">
                  <h3 className="font-semibold mb-2">Beschrijving</h3>
                  <p className="text-sm text-muted-foreground">
                    {album.shop_description}
                  </p>
                </Card>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {album.discogs_url && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(album.discogs_url!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Bekijk op Discogs
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          {insightsLoading && (
            <>
              <Separator className="my-8" />
              <Card className="p-8">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">AI Insights genereren...</span>
                </div>
              </Card>
            </>
          )}
          
          {insights && (
            <>
              <Separator className="my-8" />
              <AlbumInsightsSection insights={insights} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}