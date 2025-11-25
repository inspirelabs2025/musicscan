import { Link } from "react-router-dom";
import { RatingDisplay } from "./RatingDisplay";
import { Badge } from "@/components/ui/badge";
import { Calendar, Music } from "lucide-react";

interface AlbumReviewCardProps {
  slug: string;
  artist_name: string;
  album_title: string;
  genre?: string;
  format?: string;
  release_year?: number;
  summary: string;
  rating?: number;
  cover_image_url?: string;
}

export const AlbumReviewCard = ({
  slug,
  artist_name,
  album_title,
  genre,
  format,
  release_year,
  summary,
  rating,
  cover_image_url,
}: AlbumReviewCardProps) => {
  return (
    <Link to={`/reviews/${slug}`}>
      <div className="group bg-card rounded-lg overflow-hidden border hover:border-primary transition-all hover:shadow-lg">
        <div className="aspect-square relative overflow-hidden bg-muted">
          {cover_image_url ? (
            <img
              src={cover_image_url}
              alt={`${artist_name} - ${album_title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-20 w-20 text-muted-foreground" />
            </div>
          )}
          {rating && (
            <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm rounded-lg p-2">
              <RatingDisplay rating={rating} size="sm" showNumber={false} />
            </div>
          )}
        </div>
        
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
              {artist_name}
            </h3>
            <p className="text-muted-foreground line-clamp-1">{album_title}</p>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">{summary}</p>
          
          <div className="flex flex-wrap gap-2">
            {genre && <Badge variant="secondary">{genre}</Badge>}
            {format && <Badge variant="outline">{format.toUpperCase()}</Badge>}
            {release_year && (
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {release_year}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
