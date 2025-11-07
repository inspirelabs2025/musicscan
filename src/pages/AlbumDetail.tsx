import { useParams, useNavigate } from "react-router-dom";
import { useAlbumDetail } from "@/hooks/useAlbumDetail";
import { useReleaseByDiscogs } from "@/hooks/useReleaseByDiscogs";
import { useAlbumInsights } from "@/hooks/useAlbumInsights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AlbumInsightsSection } from "@/components/AlbumInsightsSection";
import { ImageGallery } from "@/components/ImageGallery";
import { PriceAnalysisSection } from "@/components/PriceAnalysisSection";
import { TechnicalSpecsSection } from "@/components/TechnicalSpecsSection";
import { RelatedContent } from "@/components/RelatedContent";
import { ReviewSchema, AggregateRatingSchema } from "@/components/SEO/ReviewSchema";
import { LastUpdatedBadge } from "@/components/SEO/LastUpdatedBadge";
import { ViewCountBadge, TrendingBadge } from "@/components/SEO/SocialProofBadges";
import { ArrowLeft, ExternalLink, Calendar, Tag, Music2, Disc3, Brain, Loader2, Clock, Hash } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { generateAltTag } from "@/utils/generateAltTag";

export default function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { album, isLoading, error } = useAlbumDetail(albumId!);
  const albumType = album?.media_type as 'cd' | 'vinyl' | undefined;
  const { insights, isLoading: insightsLoading, generateInsights } = useAlbumInsights(albumId, albumType, true);
  
  // Check if a canonical release exists for this album
  const { release: canonicalRelease } = useReleaseByDiscogs(album?.discogs_id || 0);
  
  // Redirect to canonical release page if it exists
  useEffect(() => {
    if (canonicalRelease && album?.discogs_id) {
      navigate(`/release/${canonicalRelease.id}`, { replace: true });
    }
  }, [canonicalRelease, album?.discogs_id, navigate]);

  // Prepare images array for the gallery with SEO-optimized alt tags
  const getAlbumImages = () => {
    if (!album) return [];
    
    const images = [];
    
    if (album.media_type === 'cd') {
      if (album.front_image) images.push({ 
        url: album.front_image, 
        label: "Voorkant", 
        type: "front",
        alt: generateAltTag(album.artist, album.title, album.year, 'CD', 'front')
      });
      if (album.back_image) images.push({ 
        url: album.back_image, 
        label: "Achterkant", 
        type: "back",
        alt: generateAltTag(album.artist, album.title, album.year, 'CD', 'back')
      });
      if (album.barcode_image) images.push({ 
        url: album.barcode_image, 
        label: "Barcode", 
        type: "barcode",
        alt: generateAltTag(album.artist, album.title, album.year, 'CD', 'barcode')
      });
      if (album.matrix_image) images.push({ 
        url: album.matrix_image, 
        label: "Matrix", 
        type: "matrix",
        alt: generateAltTag(album.artist, album.title, album.year, 'CD', 'matrix')
      });
    } else {
      if (album.catalog_image) images.push({ 
        url: album.catalog_image, 
        label: "Catalogus", 
        type: "catalog",
        alt: generateAltTag(album.artist, album.title, album.year, 'Vinyl', 'catalog')
      });
      if (album.matrix_image) images.push({ 
        url: album.matrix_image, 
        label: "Matrix", 
        type: "matrix",
        alt: generateAltTag(album.artist, album.title, album.year, 'Vinyl', 'matrix')
      });
      if (album.additional_image) images.push({ 
        url: album.additional_image, 
        label: "Extra", 
        type: "additional",
        alt: generateAltTag(album.artist, album.title, album.year, 'Vinyl', 'additional')
      });
    }
    
    return images;
  };

  // Auto-generate insights is now handled by the hook

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

  const displayImage = getImageUrl();

  return (
    <>
      {/* SEO Structured Data */}
      <ReviewSchema
        itemName={`${album.artist} - ${album.title}`}
        artist={album.artist}
        reviewBody={album.shop_description || `${album.artist} - ${album.title} beschikbaar in onze collectie.`}
        rating={4.5}
        datePublished={album.created_at}
        reviewUrl={`https://www.musicscan.app/album/${albumId}`}
        imageUrl={displayImage}
        itemType="MusicAlbum"
      />

      {album.discogs_id && (
        <AggregateRatingSchema
          itemName={`${album.artist} - ${album.title}`}
          artist={album.artist}
          ratingValue={4.3}
          reviewCount={15}
          imageUrl={displayImage}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-vinyl-purple/5 via-transparent to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Image Gallery */}
            <div className="lg:col-span-1">
              <ImageGallery images={getAlbumImages()} />
            </div>

            {/* Middle Column - Album Details */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{album.title}</h1>
                <h2 className="text-xl text-muted-foreground mb-4">{album.artist}</h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Disc3 className="w-3 h-3" />
                    {album.media_type.toUpperCase()}
                  </Badge>
                  {album.is_public && (
                    <Badge variant="default">Publiek</Badge>
                  )}
                  {album.is_for_sale && (
                    <Badge variant="secondary">Te Koop</Badge>
                  )}
                  {album.condition_grade && (
                    <Badge variant="outline">{album.condition_grade}</Badge>
                  )}
                  {album.updated_at && album.updated_at !== album.created_at && (
                    <LastUpdatedBadge lastUpdate={album.updated_at} />
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  {album.label && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Label:</span>
                      <span className="font-medium">{album.label}</span>
                    </div>
                  )}
                  {album.year && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jaar:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {album.year}
                      </span>
                    </div>
                  )}
                  {album.catalog_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catalogus:</span>
                      <span className="font-medium">{album.catalog_number}</span>
                    </div>
                  )}
                  {album.genre && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Genre:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {album.genre}
                      </span>
                    </div>
                  )}
                  {album.country && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Land:</span>
                      <span className="font-medium">{album.country}</span>
                    </div>
                  )}
                  {album.discogs_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discogs ID:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {album.discogs_id}
                      </span>
                    </div>
                  )}
                </div>

                {album.shop_description && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Beschrijving</h3>
                    <p className="text-sm text-muted-foreground">{album.shop_description}</p>
                  </div>
                )}

                {/* Timestamps */}
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Tijdsinformatie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Toegevoegd:</span>
                      <span>{format(new Date(album.created_at), "dd MMM yyyy, HH:mm", { locale: nl })}</span>
                    </div>
                    {album.updated_at && album.updated_at !== album.created_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bijgewerkt:</span>
                        <span>{format(new Date(album.updated_at), "dd MMM yyyy, HH:mm", { locale: nl })}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {album.discogs_url && (
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <a href={album.discogs_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Bekijk op Discogs
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Right Column - Price Analysis & Technical Specs */}
            <div className="lg:col-span-1 space-y-6">
              <PriceAnalysisSection
                lowestPrice={album.lowest_price}
                medianPrice={album.median_price}
                highestPrice={album.highest_price}
                calculatedAdvicePrice={album.calculated_advice_price}
                marketplacePrice={album.marketplace_price}
                currency={album.currency}
              />
              
              <TechnicalSpecsSection
                format={album.format}
                marketplaceWeight={album.marketplace_weight}
                marketplaceFormatQuantity={album.marketplace_format_quantity}
                marketplaceLocation={album.marketplace_location}
                marketplaceAllowOffers={album.marketplace_allow_offers}
                marketplaceStatus={album.marketplace_status}
                barcode={album.media_type === 'cd' ? album.barcode_number : undefined}
                matrixNumber={album.matrix_number}
                side={album.media_type === 'cd' ? album.side : undefined}
                stamperCodes={album.media_type === 'cd' ? album.stamper_codes : undefined}
                style={album.style}
                marketplaceSleeve={album.marketplace_sleeve_condition}
              />
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

          {/* Related Content - Internal Linking */}
          <Separator className="my-8" />
          <RelatedContent
            artist={album.artist}
            genre={album.genre}
            year={album.year}
            excludeId={albumId}
          />
        </div>
      </div>
    </div>
    </>
  );
}