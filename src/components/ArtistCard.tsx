import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Eye, Heart, Image as ImageIcon } from "lucide-react";
import type { ArtistFanwall } from "@/hooks/useArtistFanwalls";

interface ArtistCardProps {
  artist: ArtistFanwall;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link to={`/fanwall/${artist.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all">
        <div className="aspect-square overflow-hidden bg-muted relative">
          {artist.featured_photo_url ? (
            <img
              src={artist.featured_photo_url}
              alt={artist.artist_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-xl mb-2 line-clamp-2">
              {artist.artist_name}
            </h3>
            <div className="flex items-center gap-4 text-white/90 text-sm">
              <span className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                {artist.photo_count}
              </span>
              {artist.total_views > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {artist.total_views}
                </span>
              )}
              {artist.total_likes > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {artist.total_likes}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
