import { TimeMachineEvent } from '@/hooks/useTimeMachineEvents';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Camera, Newspaper, ZoomIn } from 'lucide-react';
import { useState } from 'react';

interface ArchiveGalleryProps {
  event: TimeMachineEvent;
}

export function ArchiveGallery({ event }: ArchiveGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const photos = event.archive_photos || [];
  const reviews = event.press_reviews || [];

  return (
    <div className="space-y-8">
      {/* Photo Gallery */}
      {Array.isArray(photos) && photos.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Camera className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Foto Archief</h2>
              <p className="text-sm text-muted-foreground">
                {photos.length} historische foto's
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo: any, index: number) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer group overflow-hidden hover:border-primary/50 transition-colors">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.caption || `Archief foto ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    {photo.caption && (
                      <CardContent className="pt-3">
                        <p className="text-sm text-muted-foreground">{photo.caption}</p>
                        {photo.source && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Bron: {photo.source}
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <img
                    src={photo.url}
                    alt={photo.caption || `Archief foto ${index + 1}`}
                    className="w-full h-auto"
                  />
                  {photo.caption && (
                    <div className="mt-4">
                      <p className="text-foreground">{photo.caption}</p>
                      {photo.source && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Bron: {photo.source}
                        </p>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      )}

      {/* Press Reviews */}
      {Array.isArray(reviews) && reviews.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Newspaper className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Pers Recensies</h2>
              <p className="text-sm text-muted-foreground">
                {reviews.length} publicaties
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {reviews.map((review: any, index: number) => (
              <Card key={index} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{review.publication}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    {review.rating && (
                      <Badge variant="secondary">
                        ⭐ {review.rating}/5
                      </Badge>
                    )}
                  </div>
                  
                  <blockquote className="border-l-4 border-primary pl-4 italic text-foreground/90">
                    {review.excerpt}
                  </blockquote>

                  {review.url && (
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-3 inline-block"
                    >
                      Lees volledige recensie →
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!photos.length && !reviews.length && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              Geen archiefmateriaal beschikbaar voor dit event.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
