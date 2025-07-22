
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxModalProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageLightboxModal = ({ 
  images, 
  initialIndex, 
  isOpen, 
  onClose 
}: ImageLightboxModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (images.length > 1) {
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
          }
          break;
        case "ArrowRight":
          if (images.length > 1) {
            setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, onClose]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
  };

  if (!isOpen || !images.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/80" />
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-transparent shadow-none">
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-10 h-10 p-0"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-10 h-10 p-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-10 h-10 p-0"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Image Container */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            
            <img
              src={images[currentIndex]}
              alt={`Scan foto ${currentIndex + 1}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ 
                maxWidth: "90vw", 
                maxHeight: "85vh",
                opacity: isLoading ? 0 : 1,
                transition: "opacity 0.2s ease-in-out"
              }}
            />
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
