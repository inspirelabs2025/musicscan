import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ImageLightboxModal } from "@/components/ImageLightboxModal";

interface ImageGalleryProps {
  images: Array<{
    url: string;
    label: string;
    type: string;
    alt?: string;
  }>;
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (images.length === 0) {
    return (
      <Card className="aspect-square flex items-center justify-center bg-muted/30">
        <span className="text-muted-foreground">Geen afbeeldingen beschikbaar</span>
      </Card>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-4">
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <Card className="relative overflow-hidden">
                <div className="aspect-square relative group">
                  <img
                    src={image.url}
                    alt={image.alt || image.label}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openLightbox(index)}
                  >
                    <Expand className="w-4 h-4" />
                  </Button>
                  <Badge
                    variant="secondary"
                    className="absolute bottom-2 left-2"
                  >
                    {image.label}
                  </Badge>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className="flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
            >
              <img
                src={image.url}
                alt={image.alt || image.label}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </button>
          ))}
        </div>
      )}

      <ImageLightboxModal
        images={images.map(img => img.url)}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}