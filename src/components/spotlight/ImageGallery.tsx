import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface SpotlightImage {
  url: string;
  type?: string;
  caption?: string;
  alt_text?: string;
}

interface ImageGalleryProps {
  images: SpotlightImage[];
  artistName: string;
}

export const ImageGallery = ({ images, artistName }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<SpotlightImage | null>(null);

  if (!images || images.length === 0) return null;

  // Separate artist photos and album covers
  const artistPhotos = images.filter(img => img.type === 'artist');
  const albumCovers = images.filter(img => img.type === 'album' || !img.type);

  return (
    <div className="space-y-6">
      {/* Artist Photos - Smaller grid */}
      {artistPhotos.length > 0 && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {artistPhotos.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-md cursor-pointer aspect-square bg-muted max-w-[180px]"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.url}
                alt={image.alt_text || `${artistName} photo ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {image.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs font-medium line-clamp-1">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Album Covers - Smaller grid */}
      {albumCovers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-foreground">Notable Albums</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {albumCovers.map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-md cursor-pointer aspect-square bg-muted shadow-sm hover:shadow-lg transition-shadow max-w-[150px]"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.url}
                  alt={image.alt_text || `Album cover ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {image.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-[10px] font-medium line-clamp-1">{image.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.alt_text || "Full size image"}
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              {selectedImage.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                  <p className="text-white text-lg font-medium">{selectedImage.caption}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
